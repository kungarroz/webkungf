#!/usr/bin/env python3
"""Recorta Long Cang a los caracteres de la firma de la polaroid y escribe site/fonts/long-cang-firma.woff2.

Uso:  python3 tools/subset_firma.py 山德
(solo hace falta repetirlo si cambias el texto de la firma; requiere fonttools y brotli)
"""
import os
import sys

from fontTools import subset

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
texto = sys.argv[1] if len(sys.argv) > 1 else "山德"
opciones = subset.Options()
opciones.flavor = "woff2"
opciones.layout_features = ["kern", "locl"]
opciones.name_IDs = [1, 2, 3, 4, 6]
opciones.hinting = False
fuente = subset.load_font(os.path.join(RAIZ, "tools", "fuentes-origen", "LongCang-Regular.ttf"), opciones)
subsetter = subset.Subsetter(opciones)
subsetter.populate(text=texto)
subsetter.subset(fuente)
salida = os.path.join(RAIZ, "site", "fonts", "long-cang-firma.woff2")
subset.save_font(fuente, salida, opciones)
print(f"{texto} -> {os.path.relpath(salida, RAIZ)} ({os.path.getsize(salida)} bytes)")
