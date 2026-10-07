#!/usr/bin/env python3
"""Genera site/fonts/noto-serif-sc-zh.woff2 con SOLO los caracteres chinos que usa la web.

Lo ejecuta build.mjs en cada despliegue; no hay pasos manuales. Lee los caracteres de
  - site/i18n/zh.json
  - site/index.html   (nombres como 小红书 y 抖音 que están en el HTML en español)
y los recorta de tools/fuentes-origen/NotoSerifSC[wght].ttf (peso variable 400-600).
Requiere:  pip install fonttools brotli
"""
import json
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(RAIZ, "tools", "fuentes-origen", "NotoSerifSC[wght].ttf")
SALIDA = os.path.join(RAIZ, "site", "fonts", "noto-serif-sc-zh.woff2")

# Solo lo que Source Serif no trae: ideogramas, símbolos y puntuación CJK, formas de ancho completo
CJK = re.compile(r"[⺀-鿿＀-￯—‘-”…·]")


def textos(valor):
    if isinstance(valor, str):
        yield valor
    elif isinstance(valor, dict):
        for v in valor.values():
            yield from textos(v)
    elif isinstance(valor, list):
        for v in valor:
            yield from textos(v)


def main():
    fuentes = []
    zh = os.path.join(RAIZ, "site", "i18n", "zh.json")
    if os.path.exists(zh):
        fuentes += list(textos(json.load(open(zh, encoding="utf-8"))))
    html = os.path.join(RAIZ, "site", "index.html")
    if os.path.exists(html):
        fuentes.append(open(html, encoding="utf-8").read())
    caracteres = sorted(set(c for t in fuentes for c in CJK.findall(t)))
    if not caracteres:
        sys.exit("No hay caracteres chinos que subconjuntar")

    opciones = subset.Options()
    opciones.layout_features = ["kern", "locl", "vert"]
    opciones.name_IDs = [1, 2, 3, 4, 6]
    opciones.hinting = False
    opciones.notdef_outline = True
    fuente = subset.load_font(FUENTE, opciones)
    subsetter = subset.Subsetter(opciones)
    subsetter.populate(text="".join(caracteres))
    subsetter.subset(fuente)
    # Primero recortar y luego limitar el eje de peso: es mucho más rápido que al revés
    fuente = instancer.instantiateVariableFont(fuente, {"wght": (400, 600)}, inplace=False)
    fuente.flavor = "woff2"
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    fuente.save(SALIDA)
    print(f"{len(caracteres)} caracteres -> {os.path.relpath(SALIDA, RAIZ)} "
          f"({os.path.getsize(SALIDA)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
