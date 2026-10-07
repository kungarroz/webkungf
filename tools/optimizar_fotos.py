#!/usr/bin/env python3
"""Genera las versiones web (WebP, varios anchos) de las fotos de originales/.

Uso:  python3 tools/optimizar_fotos.py

- Lee originales/<serie>/*.jpg|jpeg|png
- Escribe site/img/<serie>/<nombre>-<ancho>.webp  (480, 960 y 1600 px)
- Nunca amplía: si el original es más pequeño que un ancho, ese tamaño no se crea
- Escribe tools/galeria.json con serie, nombre, dimensiones y anchos disponibles
Requiere ImageMagick (convert/identify) con soporte WebP.
Los originales NO se tocan y no se despliegan (viven fuera de site/).
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "originales")
SALIDA = os.path.join(RAIZ, "site", "img")
ANCHOS = (480, 960, 1600)
CALIDAD = "76"
# Series que se publican (el resto de carpetas de originales/ no se despliega)
SERIES = ["calle", "noche", "arquitectura", "hongkong", "macao",
          "detalles", "retratos", "retratos-urbanos", "varios", "personales"]
# Archivos concretos que se quedan fuera de la web (producto, no obra)
EXCLUIR = {"varios/DSC00907.JPG"}


def natural(s):
    return [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", s)]


def dimensiones(ruta):
    # %[orientation] se aplica con -auto-orient en convert; aquí leemos ya orientado
    salida = subprocess.check_output(
        ["convert", ruta + "[0]", "-auto-orient", "-format", "%w %h", "info:"], text=True)
    w, h = salida.split()
    return int(w), int(h)


def procesar(tarea):
    serie, archivo = tarea
    ruta = os.path.join(ORIG, serie, archivo)
    base = os.path.splitext(archivo)[0].lower()
    w, h = dimensiones(ruta)
    destino = os.path.join(SALIDA, serie)
    os.makedirs(destino, exist_ok=True)
    anchos = [a for a in ANCHOS if a <= w]
    # Ancho nativo como último tamaño (sin ampliar) si queda lejos del anterior y no pasa de 1800
    if w <= 1800 and (not anchos or w - anchos[-1] >= 120):
        anchos.append(w)
    if not anchos:
        anchos = [w]
    for a in anchos:
        out = os.path.join(destino, f"{base}-{a}.webp")
        subprocess.check_call([
            "convert", ruta + "[0]", "-auto-orient", "-strip",
            "-colorspace", "sRGB", "-resize", f"{a}x>",
            "-quality", CALIDAD, "-define", "webp:method=6", out])
    return {"serie": serie, "nombre": base, "ancho": w, "alto": h, "tamanos": anchos}


def main():
    tareas = []
    for serie in SERIES:
        carpeta = os.path.join(ORIG, serie)
        if not os.path.isdir(carpeta):
            continue
        for f in sorted(os.listdir(carpeta), key=natural):
            if f.lower().endswith((".jpg", ".jpeg", ".png")) and f"{serie}/{f}" not in EXCLUIR:
                tareas.append((serie, f))
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 2) as pool:
        resultado = list(pool.map(procesar, tareas))
    with open(os.path.join(RAIZ, "tools", "galeria.json"), "w", encoding="utf-8") as fh:
        json.dump(resultado, fh, ensure_ascii=False, indent=1)
    total = sum(os.path.getsize(os.path.join(d, f))
                for d, _, fs in os.walk(SALIDA) for f in fs)
    print(f"{len(resultado)} fotos -> {SALIDA}  ({total/1e6:.1f} MB en total)")


if __name__ == "__main__":
    sys.exit(main())
