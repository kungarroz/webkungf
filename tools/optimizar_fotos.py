#!/usr/bin/env python3
"""Optimiza las fotos elegidas y genera el HTML de la portada y de la hoja de contactos.

Uso:  python3 tools/optimizar_fotos.py

1. Lee tools/seleccion.json (qué fotos van en cada rollo y cuál es la portada).
2. Por cada foto de originales/<serie>/ crea site/img/<serie>/<foto>-<ancho>.webp
   (480, 960 y 1600 px, más el ancho nativo si queda lejos; nunca amplía).
3. Borra de site/img lo que ya no está en la selección (los originales no se tocan).
4. Reescribe en site/index.html los bloques entre
      <!--PORTADA--> ... <!--/PORTADA-->   y   <!--GALERIA--> ... <!--/GALERIA-->

Requiere ImageMagick (convert) con soporte WebP. Los originales viven en originales/,
fuera de site/, y no se despliegan.
"""
import json
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from html import escape

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG = os.path.join(RAIZ, "originales")
SALIDA = os.path.join(RAIZ, "site", "img")
INDEX = os.path.join(RAIZ, "site", "index.html")
ANCHOS = (480, 960, 1600)
CALIDAD = "76"
EXT = (".jpeg", ".jpg", ".png")

ALT_PORTADA = ("Una persona de espaldas bajo un paraguas rojo, junto a un paso de cebra "
               "mojado, de noche")


def buscar(serie, nombre):
    for e in EXT + tuple(x.upper() for x in EXT):
        ruta = os.path.join(ORIG, serie, nombre + e)
        if os.path.exists(ruta):
            return ruta
    sys.exit(f"No encuentro originales/{serie}/{nombre}.*")


def serie_de(rollo_id):
    return rollo_id  # los ids de rollo coinciden con las carpetas de originales/


def procesar(tarea):
    serie, nombre = tarea
    ruta = buscar(serie, nombre)
    w, h = map(int, subprocess.check_output(
        ["convert", ruta + "[0]", "-auto-orient", "-format", "%w %h", "info:"], text=True).split())
    anchos = [a for a in ANCHOS if a <= w]
    if w <= 1800 and (not anchos or w - anchos[-1] >= 120):
        anchos.append(w)
    if not anchos:
        anchos = [w]
    destino = os.path.join(SALIDA, serie)
    os.makedirs(destino, exist_ok=True)
    for a in anchos:
        subprocess.check_call([
            "convert", ruta + "[0]", "-auto-orient", "-strip", "-colorspace", "sRGB",
            "-resize", f"{a}x>", "-quality", CALIDAD, "-define", "webp:method=6",
            os.path.join(destino, f"{nombre.lower()}-{a}.webp")])
    return {"serie": serie, "nombre": nombre.lower(), "ancho": w, "alto": h, "tamanos": anchos}


def ruta_web(f, a):
    return f"img/{f['serie']}/{f['nombre']}-{a}.webp"


def srcset(f, minimo=0):
    return ", ".join(f"{ruta_web(f, a)} {a}w" for a in f["tamanos"] if a >= minimo)


def bloque_portada(f):
    return (
        '<div class="ventana">\n'
        f'  <img src="{ruta_web(f, f["tamanos"][-1])}"\n'
        f'       srcset="{srcset(f)}"\n'
        '       sizes="(min-width: 600px) 480px, calc(100vw - 56px)"\n'
        f'       width="{f["ancho"]}" height="{f["alto"]}" fetchpriority="high" decoding="async"\n'
        '       alt="' + escape(ALT_PORTADA) + '" data-i18n-attr="alt:portada.alt">\n'
        '</div>')


def bloque_galeria(seleccion, info):
    partes = []
    for rollo in seleccion["rollos"]:
        rid = rollo["id"]
        items = []
        total = len(rollo["fotos"])
        for n, nombre in enumerate(rollo["fotos"], 1):
            f = info[(rid, nombre.lower())]
            aspecto = f["ancho"] / f["alto"]
            mayor = f["tamanos"][-1]
            items.append(
                f'      <li style="--a:{aspecto:.3f}"><a href="{ruta_web(f, mayor)}"'
                f' data-srcset="{srcset(f)}" data-w="{f["ancho"]}" data-h="{f["alto"]}">'
                f'<img src="{ruta_web(f, f["tamanos"][0])}"'
                f' srcset="{srcset(f)}" sizes="(min-width: 600px) 150px, 30vw"'
                f' width="{f["ancho"]}" height="{f["alto"]}" loading="lazy" decoding="async"'
                f' alt="{escape(rollo["titulo"])} · {n}" data-rollo="rollo.{rid}" data-n="{n}"></a></li>')
        partes.append(
            f'    <section class="rollo" aria-labelledby="rollo-{rid}">\n'
            f'      <p class="borde" aria-hidden="true"></p>\n'
            f'      <h3 id="rollo-{rid}" data-i18n="rollo.{rid}">{escape(rollo["titulo"])}</h3>\n'
            f'      <ul class="hoja" data-total="{total}">\n' + "\n".join(items) + '\n      </ul>\n'
            f'    </section>')
    return "\n".join(partes)


def reemplazar(texto, marca, contenido):
    patron = re.compile(rf"(<!--{marca}-->)(.*?)(<!--/{marca}-->)", re.S)
    if not patron.search(texto):
        print(f"AVISO: faltan las marcas <!--{marca}--> en site/index.html")
        return texto
    return patron.sub(lambda m: f"{m.group(1)}\n{contenido}\n{m.group(3)}", texto, count=1)


def main():
    seleccion = json.load(open(os.path.join(RAIZ, "tools", "seleccion.json"), encoding="utf-8"))
    tareas = {(r["id"], n.lower()): (serie_de(r["id"]), n)
              for r in seleccion["rollos"] for n in r["fotos"]}
    p = seleccion["portada"]
    tareas.setdefault((p["serie"], p["foto"].lower()), (p["serie"], p["foto"]))
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 2) as pool:
        resultados = list(pool.map(procesar, tareas.values()))
    info = {(k[0], k[1]): r for k, r in zip(tareas.keys(), resultados)}

    # borrar de site/img lo que ya no está en la selección
    vigentes = {os.path.join(SALIDA, r["serie"], f"{r['nombre']}-{a}.webp")
                for r in resultados for a in r["tamanos"]}
    for d, _, fs in os.walk(SALIDA, topdown=False):
        for f in fs:
            ruta = os.path.join(d, f)
            if ruta not in vigentes:
                os.remove(ruta)
        if not os.listdir(d) and d != SALIDA:
            os.rmdir(d)

    if os.path.exists(INDEX):
        texto = open(INDEX, encoding="utf-8").read()
        texto = reemplazar(texto, "PORTADA", bloque_portada(info[(p["serie"], p["foto"].lower())]))
        texto = reemplazar(texto, "GALERIA", bloque_galeria(seleccion, info))
        open(INDEX, "w", encoding="utf-8").write(texto)

    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(SALIDA) for f in fs)
    por_foto = [sum(os.path.getsize(os.path.join(SALIDA, r["serie"], f"{r['nombre']}-{a}.webp"))
                    for a in r["tamanos"]) for r in resultados]
    print(f"{len(resultados)} fotos, {sum(len(r['tamanos']) for r in resultados)} archivos, "
          f"{total/1e6:.1f} MB en site/img")


if __name__ == "__main__":
    main()
