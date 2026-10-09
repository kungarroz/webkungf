# Traducciones por revisar

El español es tuyo (lo he mejorado a partir del texto que ya tenías). **Todo el chino y todo el inglés de la web es traducción mía**: están en `site/i18n/zh.json` y `site/i18n/en.json`, y cada archivo lleva una clave `_revisar` que lo recuerda. Esto es lo más delicado.

## Prioridad alta (la primera impresión)

| Clave | Español | Inglés | Chino | Duda |
|---|---|---|---|---|
| `portada.frase` | Antes de que todo cambie | Before everything changes | 在一切改变之前 | Alternativa china más urgente y más coloquial: 趁一切还没改变 («mientras todo aún no ha cambiado»). La que he puesto es más literal y más poética. |
| `portada.bio` | Soy fotógrafo de calle, español, y vivo en Guangzhou… | I'm a street photographer from Spain… | 我是一名来自西班牙的街头摄影师… | Revisa el tono: en español usa «fotógrafo» en masculino; en chino e inglés no marca género. |
| `meta.title` / `meta.description` | — | — | — | Es lo que se ve en el buscador y en las vistas previas. |

## Nombres de plataformas y glosas

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `enlaces.xhs.gloss` | Xiaohongshu · «Librito Rojo» | Xiaohongshu · “Little Red Book” | (oculta en chino) |
| `enlaces.douyin.gloss` | Douyin · el TikTok chino | Douyin · China’s TikTok | (oculta en chino) |

Según tu petición, el texto chino de los enlaces (小红书, 抖音) lleva debajo su traducción al español. Cuando la web está en chino la quito, porque ya todo está en chino; si prefieres que se vea siempre, hay que borrar una línea de CSS (`html[lang="zh-Hans"] .enlace .glosa`).

## Resto

El resto de claves (enlaces, galería, rollos, visor, entradas, contacto, pie) son frases cortas. El nombre de cada rollo en chino (街头, 夜晚, 城市人像, 香港, 澳门, 建筑, 细节, 人像) y «接触印样» para «hoja de contactos» son las elecciones que más conviene que mires.

## Añadido en el rediseño analógico

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `galeria.titulo` | Carretes | Rolls | 胶卷 |
| `galeria.intro` | Elige un carrete y desliza para recorrerlo. Toca una foto para verla grande. | Pick a roll and swipe through it. Tap a photo to see it bigger. | 选一卷，左右滑动浏览。点一下照片可以看大图。 |
| `portada.retrato` (texto alternativo) | Shande Villa con gorra naranja y la correa de la cámara cruzada al pecho… | Shande Villa wearing an orange cap and a camera strap across his chest… | Shande Villa 戴着橙色帽子，相机背带斜挎在胸前… |
| `portada.polaroid` (texto alternativo) | Gente de pie, apretada, dentro de un vagón de metro casi a oscuras | People standing packed together inside a subway car, almost in the dark | 人们紧紧挨着站在几乎全黑的地铁车厢里 |

En chino, «胶卷» es el rollo de película; si prefieres «底片» (negativo) para el aire más analógico, es un cambio de una línea en `zh.json`. Los textos alternativos de la polaroid y del retrato son descripciones mías de las fotos: corrígelas si la polaroid no es un vagón de metro o si prefieres otra descripción.
