#!/usr/bin/env python3
"""Optimiza las fotos de las reviews.

Para cada reviews/<slug>/ lee las imágenes que citan sus textos (front matter `cover:` e imágenes
`![..](./archivo)`), busca el original en originales/reviews/<slug>/ y crea en site/img/reviews/<slug>/
versiones WebP de 800 y 1600 px de ancho (nunca amplía). Escribe reviews/<slug>/imagenes.json con
los tamaños, que build.mjs usa para el srcset. Los originales no se despliegan.

Uso:  python3 tools/optimizar_reviews.py
Requiere ImageMagick (convert) con soporte WebP.
"""
import glob
import json
import os
import re
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANCHOS = (800, 1600)


def slug(nombre):
    base = os.path.splitext(nombre)[0].lower()
    return re.sub(r"[^a-z0-9]+", "-", base).strip("-")


def citadas(carpeta):
    nombres = set()
    for md in glob.glob(os.path.join(carpeta, "*.md")):
        texto = open(md, encoding="utf-8").read()
        nombres.update(re.findall(r"!\[[^\]]*\]\(\./([^)\s]+)\)", texto))
        m = re.search(r'^cover:\s*["\']?\./([^"\'\n]+)', texto, re.M)
        if m:
            nombres.add(m.group(1).strip())
    return sorted(nombres)


def main():
    salida_total = os.path.join(RAIZ, "site", "img", "reviews")
    for carpeta in sorted(glob.glob(os.path.join(RAIZ, "reviews", "*", ""))):
        carpeta = carpeta.rstrip("/")
        clave = os.path.basename(carpeta)
        destino = os.path.join(salida_total, clave)
        os.makedirs(destino, exist_ok=True)
        manifiesto = {}
        for nombre in citadas(carpeta):
            origen = os.path.join(RAIZ, "originales", "reviews", clave, nombre)
            if not os.path.exists(origen):
                sys.exit(f"Falta el original: {origen}")
            w, h = map(int, subprocess.check_output(
                ["convert", origen + "[0]", "-auto-orient", "-format", "%w %h", "info:"], text=True).split())
            anchos = [a for a in ANCHOS if a < w] + [min(w, ANCHOS[-1])]
            anchos = sorted(set(anchos))
            base = slug(nombre)
            for a in anchos:
                subprocess.check_call(["convert", origen + "[0]", "-auto-orient", "-resize", f"{a}x", "-strip",
                                       "-colorspace", "sRGB", "-quality", "80", os.path.join(destino, f"{base}-{a}.webp")])
            manifiesto[nombre] = {"base": base, "w": w, "h": h, "anchos": anchos}
        # borra lo que ya no se cita
        usados = {f"{v['base']}-{a}.webp" for v in manifiesto.values() for a in v["anchos"]}
        for f in os.listdir(destino):
            if f not in usados:
                os.remove(os.path.join(destino, f))
        json.dump(manifiesto, open(os.path.join(carpeta, "imagenes.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
        print(f"{clave}: {len(manifiesto)} imágenes")


main()
