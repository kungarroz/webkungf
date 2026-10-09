#!/usr/bin/env python3
"""Recorta a latín las fuentes de la web y escribe los .woff2 de site/fonts/.

Uso:  python3 tools/subset_latin.py        (requiere fonttools y brotli)

- Instrument Serif (títulos), normal y cursiva
- Hanken Grotesk (texto), eje de peso limitado a 300-600
- DM Mono (texto impreso en el borde de la película) ya está recortada; no se toca aquí
Las TTF originales viven en tools/fuentes-origen/ y no se despliegan.
"""
import os

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "tools", "fuentes-origen")
SALIDA = os.path.join(RAIZ, "site", "fonts")
TEXTO = ("".join(chr(c) for c in list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)))
         + "–—‘’“”…•·€←→×")


def recortar(origen, destino, ejes=None):
    opciones = subset.Options()
    opciones.flavor = "woff2"
    opciones.layout_features = ["kern", "liga", "locl", "ccmp", "mark", "mkmk"]
    opciones.name_IDs = [1, 2, 3, 4, 6]
    opciones.hinting = False
    opciones.notdef_outline = True
    fuente = subset.load_font(os.path.join(ORIGEN, origen), opciones)
    s = subset.Subsetter(opciones)
    s.populate(text=TEXTO)
    s.subset(fuente)
    if ejes:
        fuente = instancer.instantiateVariableFont(fuente, ejes, inplace=False)
    fuente.flavor = "woff2"
    ruta = os.path.join(SALIDA, destino)
    fuente.save(ruta)
    print(f"{destino}: {os.path.getsize(ruta)/1024:.1f} KB")


if __name__ == "__main__":
    recortar("InstrumentSerif-Regular.ttf", "instrument-serif-latin.woff2")
    recortar("InstrumentSerif-Italic.ttf", "instrument-serif-italic-latin.woff2")
    recortar("HankenGrotesk.ttf", "hanken-grotesk-latin.woff2", {"wght": (300, 600)})
