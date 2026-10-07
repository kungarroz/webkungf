#!/usr/bin/env python3
"""Genera site/og.jpg (1200x630) y site/apple-touch-icon.png. Solo hace falta repetirlo si cambia la portada.

Uso:  python3 tools/generar_og.py RUTA/SourceSerif4.ttf RUTA/DMMono-Regular.ttf
(las fuentes son las mismas de la web; no están en el repositorio porque en site/fonts van recortadas)
Requiere ImageMagick (convert).
"""
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) != 3:
    sys.exit(__doc__)
SERIF, MONO = sys.argv[1], sys.argv[2]
FOTO = os.path.join(RAIZ, "originales", "noche", "noche2.jpeg")
MESA, TIRA, LINEA, PAPEL, TENUE, AMBAR = "#15110D", "#0B0908", "#2B231B", "#EEEAE1", "#A89F92", "#E8871E"

cmd = ["convert", "-size", "1200x630", f"xc:{MESA}"]
# tira vertical a la derecha, a sangre arriba y abajo
x0, ancho = 730, 380
cmd += ["-fill", TIRA, "-stroke", LINEA, "-strokewidth", "1", "-draw", f"rectangle {x0},-10 {x0+ancho},640", "-stroke", "none"]
cmd += ["-fill", MESA]
for y in range(8, 640, 42):
    cmd += ["-draw", f"roundrectangle {x0+10},{y} {x0+24},{y+18} 3,3",
            "-draw", f"roundrectangle {x0+ancho-24},{y} {x0+ancho-10},{y+18} 3,3"]
# fotograma
cmd += ["(", FOTO, "-auto-orient", "-resize", "292x438!", ")", "-geometry", f"+{x0+44}+96", "-composite"]
# texto impreso en el borde
cmd += ["-font", MONO, "-pointsize", "15", "-fill", AMBAR, "-annotate", f"+{x0+44}+82", "SV 400 · 12 · 12A",
        "-annotate", f"+{x0+44}+560", "SV 400 · 13 · 13A"]
# texto
cmd += ["-font", SERIF, "-fill", PAPEL, "-pointsize", "76", "-kerning", "6", "-annotate", "+80+300", "SHANDE VILLA",
        "-kerning", "0", "-fill", AMBAR, "-pointsize", "46", "-annotate", "+80+372", "Antes de que todo cambie",
        "-fill", TENUE, "-pointsize", "30", "-annotate", "+80+438", "Fotografía de calle · Guangzhou",
        "-fill", TENUE, "-pointsize", "26", "-annotate", "+80+560", "shandevilla.com",
        "-quality", "88", "-strip", "-sampling-factor", "4:2:0", os.path.join(RAIZ, "site", "og.jpg")]
subprocess.check_call(cmd)

# icono de iOS: la misma tira del favicon a 180 px
k = 180 / 64
icono = ["convert", "-size", "180x180", f"xc:{MESA}", "-fill", AMBAR, "-draw", f"rectangle {14*k},0 {50*k},180",
         "-fill", MESA, "-draw", f"rectangle {22*k},{17*k} {42*k},{47*k}"]
for y in (6, 17, 28, 39, 50):
    for x in (16.5, 44.5):
        icono += ["-draw", f"rectangle {x*k},{y*k} {(x+3)*k},{(y+4.5)*k}"]
icono += [os.path.join(RAIZ, "site", "apple-touch-icon.png")]
subprocess.check_call(icono)
print("og.jpg", os.path.getsize(os.path.join(RAIZ, "site", "og.jpg")) // 1024, "KB")
