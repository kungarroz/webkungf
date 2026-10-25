#!/usr/bin/env python3
"""Prepara las fotos del portfolio: TODAS las de las carpetas de originales/ que son series.

  - La serie es el nombre de la carpeta (las series y su orden salen de tools/seleccion.json).
  - El objetivo sale del EXIF de cada original (LensModel) traducido con tools/objetivos.json; una cámara
    de objetivo fijo (Sony ZV-1) cuenta como objetivo. Las cámaras no se filtran.
  - Crea WebP de 480 y 960 px (y el ancho nativo si pasa de 960) en site/img/portfolio/<serie>/, sin EXIF.
  - Escribe tools/portfolio-fotos.json, que lee tools/portfolio.mjs. Las fotos de la selección van primero,
    en el orden de seleccion.json; el resto, detrás, por nombre.

Uso:  python3 tools/optimizar_portfolio.py        (necesita ImageMagick con WebP y Pillow)
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "site", "img", "portfolio")
EXT = (".jpg", ".jpeg", ".png")
ANCHOS = (480, 960)
CALIDAD = "76"


def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def objetivo(ruta, nombres):
    ex = Image.open(ruta).getexif()
    lente = (ex.get_ifd(0x8769).get(0xA434) or "").strip()
    modelo = (ex.get(272) or "").strip()
    if modelo == "ZV-1":
        return "Sony ZV-1"
    if lente:
        return nombres.get(lente, lente)
    return None


def procesar(t):
    serie, nombre, ruta = t
    w, h = map(int, subprocess.check_output(["convert", ruta + "[0]", "-auto-orient", "-format", "%w %h", "info:"], text=True).split())
    anchos = [a for a in ANCHOS if a < w]
    anchos.append(min(w, 1600))
    destino = os.path.join(SALIDA, serie)
    os.makedirs(destino, exist_ok=True)
    base = os.path.splitext(nombre)[0].lower()
    for a in anchos:
        subprocess.check_call(["convert", ruta + "[0]", "-auto-orient", "-strip", "-colorspace", "sRGB", "-resize", f"{a}x>",
                               "-quality", CALIDAD, "-define", "webp:method=6", os.path.join(destino, f"{base}-{a}.webp")])
    return {"id": base, "serie": serie, "w": w, "h": h, "anchos": anchos}


def main():
    sel = json.load(open(os.path.join(RAIZ, "tools", "seleccion.json"), encoding="utf-8"))
    nombres = {k: v for k, v in json.load(open(os.path.join(RAIZ, "tools", "objetivos.json"), encoding="utf-8")).items() if not k.startswith("_")}
    nombres = {k.strip(): v for k, v in nombres.items()}
    tareas, orden = [], []
    for rollo in sel["rollos"]:
        serie = rollo["id"]
        carpeta = os.path.join(RAIZ, "originales", serie)
        if not os.path.isdir(carpeta):
            sys.exit(f"Falta la carpeta {carpeta}")
        archivos = {os.path.splitext(f)[0].lower(): f for f in os.listdir(carpeta) if f.lower().endswith(EXT)}
        elegidas = [f.lower() for f in rollo["fotos"] if f.lower() in archivos]
        resto = sorted((k for k in archivos if k not in elegidas), key=natural)
        for k in elegidas + resto:
            tareas.append((serie, archivos[k], os.path.join(carpeta, archivos[k])))
    with ThreadPoolExecutor(max_workers=4) as ex:
        resultados = list(ex.map(procesar, tareas))
    fotos = []
    for r, (serie, nombre, ruta) in zip(resultados, tareas):
        r["objetivo"] = objetivo(ruta, nombres)
        fotos.append(r)
    # borra lo que ya no se usa
    usados = {os.path.join(SALIDA, f["serie"], f"{f['id']}-{a}.webp") for f in fotos for a in f["anchos"]}
    for d, _, fs in os.walk(SALIDA):
        for f in fs:
            if os.path.join(d, f) not in usados:
                os.remove(os.path.join(d, f))
    json.dump(fotos, open(os.path.join(RAIZ, "tools", "portfolio-fotos.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    sin = sum(1 for f in fotos if not f["objetivo"])
    print(f"{len(fotos)} fotos en {len(sel['rollos'])} series; {sin} sin objetivo identificado")
    cuenta = {}
    for f in fotos:
        cuenta[f["objetivo"]] = cuenta.get(f["objetivo"], 0) + 1
    for k, v in sorted(cuenta.items(), key=lambda x: -x[1]):
        print(f"  {v:3d}  {k}")


main()
