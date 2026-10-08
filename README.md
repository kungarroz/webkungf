# shandevilla.com

Web personal de Shande Villa, fotógrafo de calle que vive en Guangzhou. Sirve también como enlace de la bio de Instagram.

HTML y CSS estáticos, sin frameworks, sin dependencias en el navegador, sin cookies ni scripts de terceros. Pensada para **Cloudflare Pages** (sin servidor).

## Qué hay en el repositorio

```
site/                 ← lo único que se despliega (directorio de salida)
  index.html          texto en español (funciona sin JavaScript y es lo que ve Google)
  css/estilo.css      todo el diseño
  js/                 selector de idioma y visor de fotos (sin dependencias)
  i18n/zh.json, en.json   textos en chino e inglés
  img/                fotos optimizadas (WebP, varios tamaños)
  fonts/              fuentes autoalojadas (+ sus licencias)
  og.jpg, favicon.svg, apple-touch-icon.png
  sitemap.xml, robots.txt, _redirects, _headers
originales/           fotos originales, FUERA del despliegue
tools/                herramientas para quien edita (no se despliegan)
build.mjs             único script de build: RSS de Substack + fuente china
REVISAR.md            traducciones al chino y al inglés pendientes de revisar
```

## Ver la web en tu ordenador

```bash
node build.mjs                      # (opcional) trae las últimas entradas de Substack
python3 -m http.server -d site 8000
# abre http://localhost:8000
```

Hace falta Node 18 o superior. Para la fuente china, `build.mjs` usa Python 3 y la librería `fonttools` (se instala sola en el build; si no se puede, se queda la fuente que ya está en el repositorio).

## Desplegar en Cloudflare Pages

1. En el panel de Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** y elige este repositorio.
2. Rama de producción: `main` (o `rediseno` mientras la pruebas).
3. Ajustes de build:
   - **Framework preset:** None
   - **Build command:** `node build.mjs`
   - **Build output directory:** `site`
4. En **Environment variables** añade `NODE_VERSION` = `22`.
5. **Save and deploy.** Cloudflare te da una URL `*.pages.dev` para probar.
6. **Dominio:** en el proyecto, **Custom domains → Set up a custom domain** → `shandevilla.com` (y `www.shandevilla.com` si lo quieres).
7. **Redirigir kungfundidos.com a shandevilla.com:** con el dominio antiguo en Cloudflare, ve a **Rules → Redirect Rules → Create rule**:
   - Si *Hostname* es `kungfundidos.com` o `www.kungfundidos.com`
   - Entonces *Dynamic redirect* con expresión `concat("https://shandevilla.com", http.request.uri.path)`, estado **301**, conservando la cadena de consulta.
   - Para que la regla se ejecute, el dominio antiguo necesita un registro DNS con proxy naranja (por ejemplo un registro `A` a `192.0.2.1`).

Las URLs antiguas del blog (`/blog`, `/es/blog/…`, `/en/blog/…`, `/zh-cn/blog/…`) y las páginas sueltas (`/obra`, `/sobre-mi`, `/contacto`) llevan a la portada con un 301 gracias a `site/_redirects`.

## Mientras tanto en Vercel (puente temporal)

`vercel.json` permite que el proyecto de Vercel que ya existía publique esta web sin cambiar nada en su panel: usa la carpeta `site`, ejecuta `node build.mjs` y repite las redirecciones y cabeceras de `_redirects` y `_headers` (Vercel no lee esos dos archivos). **Cuando pases a Cloudflare Pages, borra `vercel.json`**; es lo único de Vercel que queda en el repositorio.

### Que las entradas de Substack se actualicen solas

Las 3 últimas entradas se leen del RSS **al construir la web**, no desde el navegador. Para que aparezcan sin tocar nada:

1. En el proyecto de Pages: **Settings → Builds & deployments → Deploy hooks → Add deploy hook** (rama `main`).
2. Llama a esa URL con un `POST` cada día, por ejemplo con un trabajo programado gratuito en cron-job.org o con un Worker con Cron Trigger de Cloudflare.

Si Substack no responde el día del build, la web se publica igual con las entradas que ya tenía.

### Cloudflare Web Analytics (sin cookies)

En `site/index.html`, justo antes del final, hay el snippet comentado. Crea el sitio en **Analytics & Logs → Web Analytics**, pon tu token, descomenta la línea y amplía la política CSP de `site/_headers` (las dos líneas que hay que cambiar están anotadas al principio de ese archivo).

## Cómo cambiar cosas

### Textos
- **Español:** edita `site/index.html` (los textos con `data-i18n="…"`).
- **Chino e inglés:** edita `site/i18n/zh.json` y `site/i18n/en.json` con la misma clave. Todas las traducciones actuales son mías y están marcadas en `REVISAR.md`.
- Si añades un texto con `data-i18n`, añade su clave en los dos JSON.
- La fuente china se regenera sola con los caracteres que aparezcan en `zh.json` y en `index.html` (lo hace `build.mjs`). Si un carácter chino sale con otra tipografía, falta volver a construir.

### Enlaces y numeración de los fotogramas
Cada enlace es un `<li class="enlace">` de `index.html`. La numeración sale sola, así que si añades o quitas uno, el resto se renumera. **YouTube** está comentado en el HTML: cuando tengas canal, descomenta el bloque, pon la URL y añade `enlaces.youtube.desc` a los dos JSON.

### Fotos
1. Deja los originales en `originales/<serie>/`.
2. Edita `tools/seleccion.json`: de 8 a 12 fotos por rollo, en el orden en que se ven. La foto de portada está en `"portada"`.
3. Ejecuta `python3 tools/optimizar_fotos.py` (necesita ImageMagick con WebP). Crea las versiones WebP de 480, 960 y 1600 px (y el ancho nativo si es otro; nunca amplía), borra de `site/img` las que ya no se usan y reescribe la portada y la hoja de contactos en `index.html`.

Los originales **nunca** se despliegan: solo se publica `site/`.

### Imagen para redes (og.jpg)
Se genera con `tools/generar_og.py` (necesita las TTF de Source Serif 4 y DM Mono; las que hay en `site/fonts` están recortadas). Hay que repetirlo solo si cambia la portada.

## Tipografías

| Uso | Fuente | Dónde |
|---|---|---|
| Texto y títulos | Source Serif 4 (redonda y cursiva) | `site/fonts/`, recortada a latín |
| Texto impreso en el borde de la tira | DM Mono | `site/fonts/` |
| Chino simplificado | Noto Serif SC, peso variable 400–600 | se recorta en cada build desde `tools/fuentes-origen/` |

La fuente china **solo se descarga cuando el visitante elige chino**. Todas son SIL Open Font License; las licencias están junto a los archivos. Los archivos de `site/fonts` son recortes técnicos (solo los caracteres necesarios) de las fuentes originales.

## Accesibilidad y rendimiento
- Contraste: papel `#EEEAE1` sobre `#15110D` 15,6:1; texto secundario `#A89F92` 7,2:1; acento `#E8871E` 7,1:1.
- Foco visible, enlace «Saltar al contenido», HTML semántico y `lang` que cambia con el idioma.
- `prefers-reduced-motion`: sin el avance de la tira al cargar.
- Imágenes con `width` y `height`, `srcset` y carga diferida (salvo la portada).

## Limitaciones conocidas
- Los textos alternativos de la hoja de contactos son genéricos («Calle · 3»). Mejorarlos con una descripción de cada foto está pendiente.
- Casi todas las fotos originales miden unos 1086 px de lado largo, así que ese es el máximo al ampliar.
