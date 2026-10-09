#!/usr/bin/env python3
"""Optimiza las fotos elegidas y genera el HTML de la portada y de los carretes.

Uso:  python3 tools/optimizar_fotos.py

1. Lee tools/seleccion.json: la foto grande y la polaroid de la portada, y qué fotos van en cada carrete.
2. Por cada foto de originales/<serie>/ crea site/img/<serie>/<foto>-<ancho>.webp
   (480, 960 y 1600 px, más el ancho nativo si queda lejos; nunca amplía).
3. Borra de site/img lo que ya no está en la selección (los originales no se tocan).
4. Reescribe en site/index.html los bloques entre
      <!--PORTADA-->, <!--POLAROID--> y <!--GALERIA--> (cada uno con su <!--/…-->)

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
ALTO_MOVIL, ALTO_ESCRITORIO = 236, 300   # alto de los fotogramas del carrete (debe coincidir con --hf en el CSS)


def buscar(serie, nombre):
    for e in EXT + tuple(x.upper() for x in EXT):
        ruta = os.path.join(ORIG, serie, nombre + e)
        if os.path.exists(ruta):
            return ruta
    sys.exit(f"No encuentro originales/{serie}/{nombre}.*")


def procesar(tarea):
    serie, nombre, recorte = tarea       # recorte: "AnchoxAlto+X+Y" sobre la foto ya orientada, o None
    ruta = buscar(serie, nombre)
    if recorte:
        m = re.fullmatch(r"(\d+)x(\d+)\+(\d+)\+(\d+)", recorte)
        if not m:
            sys.exit(f"Recorte no válido: {recorte}")
        w, h = int(m.group(1)), int(m.group(2))
        previo = ["-crop", recorte, "+repage"]
        nombre_web = nombre.lower() + "-portada"
    else:
        w, h = map(int, subprocess.check_output(
            ["convert", ruta + "[0]", "-auto-orient", "-format", "%w %h", "info:"], text=True).split())
        previo = []
        nombre_web = nombre.lower()
    anchos = [a for a in ANCHOS if a <= w]
    if w <= 1800 and (not anchos or w - anchos[-1] >= 120):
        anchos.append(w)
    if not anchos:
        anchos = [w]
    destino = os.path.join(SALIDA, serie)
    os.makedirs(destino, exist_ok=True)
    for a in anchos:
        subprocess.check_call([
            "convert", ruta + "[0]", "-auto-orient", *previo, "-strip", "-colorspace", "sRGB",
            "-resize", f"{a}x>", "-quality", CALIDAD, "-define", "webp:method=6",
            os.path.join(destino, f"{nombre_web}-{a}.webp")])
    return {"serie": serie, "nombre": nombre_web, "ancho": w, "alto": h, "tamanos": anchos}


def ruta_web(f, a):
    return f"img/{f['serie']}/{f['nombre']}-{a}.webp"


def srcset(f):
    return ", ".join(f"{ruta_web(f, a)} {a}w" for a in f["tamanos"])


def bloque_portada(grande):
    return (
        '    <div class="ventana grande">\n'
        f'      <img src="{ruta_web(grande, grande["tamanos"][-1])}" srcset="{srcset(grande)}"\n'
        '           sizes="(min-width: 700px) 600px, 100vw"\n'
        f'           width="{grande["ancho"]}" height="{grande["alto"]}" fetchpriority="high" decoding="async"\n'
        '           alt="Gente de pie, apretada, dentro de un vagón de metro casi a oscuras"\n'
        '           data-i18n-attr="alt:portada.foto">\n'
        '    </div>')


def bloque_polaroid(polaroid):
    return (
        f'        <img src="{ruta_web(polaroid, polaroid["tamanos"][0])}" srcset="{srcset(polaroid)}"\n'
        '             sizes="(min-width: 700px) 200px, 44vw"\n'
        f'             width="{polaroid["ancho"]}" height="{polaroid["alto"]}" decoding="async"\n'
        '             alt="Shande Villa con gorra naranja y la correa de la cámara cruzada al pecho, mirando hacia un lado en un pasillo con luces de neón"\n'
        '             data-i18n-attr="alt:portada.polaroid">')


def bloque_galeria(seleccion, info):
    pestanas, paneles = [], []
    for n, rollo in enumerate(seleccion["rollos"], 1):
        rid, titulo = rollo["id"], escape(rollo["titulo"])
        activo = n == 1
        pestanas.append(
            f'      <button type="button" role="tab" id="tab-{rid}" aria-controls="panel-{rid}"'
            f' aria-selected="{"true" if activo else "false"}" tabindex="{0 if activo else -1}">'
            f'<span data-i18n="rollo.{rid}">{titulo}</span></button>')
        fotos = []
        total = len(rollo["fotos"])
        for i, nombre in enumerate(rollo["fotos"], 1):
            f = info[(rid, nombre.lower())]
            a = f["ancho"] / f["alto"]
            fotos.append(
                f'          <li class="foto" style="--a:{a:.3f}"><a href="{ruta_web(f, f["tamanos"][-1])}"'
                f' data-srcset="{srcset(f)}" data-w="{f["ancho"]}" data-h="{f["alto"]}">'
                f'<img src="{ruta_web(f, f["tamanos"][0])}" srcset="{srcset(f)}"'
                f' sizes="(min-width: 700px) {round(a * ALTO_ESCRITORIO)}px, {round(a * ALTO_MOVIL)}px"'
                f' width="{f["ancho"]}" height="{f["alto"]}" loading="lazy" decoding="async"'
                f' alt="{titulo} · {i}" data-rollo="rollo.{rid}" data-n="{i}"></a>'
                f'<span class="num" aria-hidden="true"></span></li>')
        paneles.append(
            f'    <div class="rollo" id="panel-{rid}" role="tabpanel" aria-labelledby="tab-{rid}">\n'
            f'      <h3 class="rollo-titulo" data-i18n="rollo.{rid}">{titulo}</h3>\n'
            f'      <div class="carrete" tabindex="0">\n'
            f'        <ul class="cinta">\n' + "\n".join(fotos) + '\n        </ul>\n'
            f'      </div>\n'
            f'      <div class="mandos">\n'
            f'        <button type="button" class="ant" aria-label="Fotos anteriores" data-i18n-attr="aria-label:carrete.ant">←</button>\n'
            f'        <p class="cuenta" aria-hidden="true" data-total="{total}">1 / {total}</p>\n'
            f'        <button type="button" class="sig" aria-label="Fotos siguientes" data-i18n-attr="aria-label:carrete.sig">→</button>\n'
            f'      </div>\n'
            f'    </div>')
    return ('    <div class="selector-carrete" role="tablist" aria-label="Categorías de fotos" data-i18n-attr="aria-label:galeria.categorias">\n'
            + "\n".join(pestanas) + '\n    </div>\n' + "\n".join(paneles))


def reemplazar(texto, marca, contenido):
    patron = re.compile(rf"(<!--{marca}-->)(.*?)(<!--/{marca}-->)", re.S)
    if not patron.search(texto):
        print(f"AVISO: faltan las marcas <!--{marca}--> en site/index.html")
        return texto
    return patron.sub(lambda m: f"{m.group(1)}\n{contenido}\n{m.group(3)}", texto, count=1)


def main():
    seleccion = json.load(open(os.path.join(RAIZ, "tools", "seleccion.json"), encoding="utf-8"))
    tareas = {(r["id"], n.lower()): (r["id"], n, None) for r in seleccion["rollos"] for n in r["fotos"]}
    g, p = seleccion["foto_grande"], seleccion["polaroid"]
    # la foto grande puede llevar un recorte propio (por ejemplo, para quitar un borde negro); el original no se toca
    tareas[(g["serie"], g["foto"].lower() + "-portada")] = (g["serie"], g["foto"], g.get("recorte"))
    tareas.setdefault((p["serie"], p["foto"].lower()), (p["serie"], p["foto"], None))
    with ThreadPoolExecutor(max_workers=os.cpu_count() or 2) as pool:
        resultados = list(pool.map(procesar, tareas.values()))
    info = {k: r for k, r in zip(tareas.keys(), resultados)}

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
        r, p = seleccion["foto_grande"], seleccion["polaroid"]
        texto = reemplazar(texto, "PORTADA", bloque_portada(info[(r["serie"], r["foto"].lower() + "-portada")]))
        texto = reemplazar(texto, "POLAROID", bloque_polaroid(info[(p["serie"], p["foto"].lower())]))
        texto = reemplazar(texto, "GALERIA", bloque_galeria(seleccion, info))
        open(INDEX, "w", encoding="utf-8").write(texto)

    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(SALIDA) for f in fs)
    print(f"{len(resultados)} fotos, {sum(len(r['tamanos']) for r in resultados)} archivos, "
          f"{total/1e6:.1f} MB en site/img")


if __name__ == "__main__":
    main()
