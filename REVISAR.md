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
| `portada.polaroid` (texto alternativo del retrato) | Shande Villa con gorra naranja y la correa de la cámara cruzada al pecho… | Shande Villa wearing an orange cap and a camera strap across his chest… | Shande Villa 戴着橙色帽子，相机背带斜挎在胸前… |
| `portada.foto` (texto alternativo de la foto grande) | Gente de pie, apretada, dentro de un vagón de metro casi a oscuras | People standing packed together inside a subway car, almost in the dark | 人们紧紧挨着站在几乎全黑的地铁车厢里 |

En chino, «胶卷» es el rollo de película; si prefieres «底片» (negativo) para el aire más analógico, es un cambio de una línea en `zh.json`. Los textos alternativos de la polaroid y del retrato son descripciones mías de las fotos: corrígelas si la polaroid no es un vagón de metro o si prefieres otra descripción.

| `portada.sub` | Fotografía de calle · Guangzhou | Street photography · Guangzhou | 街头摄影 · 广州 |

## Menú, secciones renombradas y presentación acortada

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `menu.redes` / `enlaces.titulo` | Redes | Social | 社交 |
| `menu.carretes` / `galeria.titulo` | Carretes | Rolls | 胶卷 |
| `menu.escritos` / `entradas.titulo` | Escritos | Writing | 文字 |
| `menu.contacto` | Contacto | Contact | 联系 |
| `entradas.todas` | Leer más en Substack | Read more on Substack | 在 Substack 阅读更多 |
| `portada.bio` (más corta) | Soy fotógrafo de calle, español, y vivo en Guangzhou. Salgo a caminar con la cámara y fotografío lo que me cruzo: la gente, la luz, lo que quizá mañana ya no esté. | I'm a street photographer from Spain and I live in Guangzhou. I go out walking with my camera and photograph whatever crosses my path: people, light, things that may not be there tomorrow. | 我是一名住在广州的西班牙街头摄影师。我带着相机出门散步，拍下路上遇到的一切：人、光线，还有也许明天就不在了的东西。 |

**山德** (la firma de la polaroid) lo he tratado como un nombre, no como un texto que traducir, así que no lleva traducción debajo. Si prefieres que la lleve, o si tu nombre en chino se escribe de otra forma, dímelo.

## Fotos (antes «Carretes») y menú numerado

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `menu.fotos` / `galeria.titulo` | Fotos | Photos | 照片 |
| `galeria.categorias` (etiqueta para lectores de pantalla) | Categorías de fotos | Photo categories | 照片分类 |

Las entradas anteriores sobre «Carretes» / «Rolls» / «胶卷» (`menu.carretes`, `galeria.carretes`) ya no se usan.

## Título nuevo, redes en dos grupos y contacto

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `portada.frase` (el título; sustituye a «Antes de que todo cambie») | Fotografía de calle en China | Street photography in China | 中国街头摄影 |
| `redes.fuera` | Fuera de China | Outside China | 中国以外 |
| `redes.china` | En China | In China | 中国 |
| `redes.ultimo` (antes del título de tu último post) | Último post | Latest post | 最新文章 |
| `contacto.cta` | Escríbeme por Instagram | Message me on Instagram | 在 Instagram 上给我发私信 |

Ya no se usan `portada.sub`, `menu.escritos` ni `entradas.*` (la sección Escritos desapareció: el último post va dentro de la fila de Substack).

## Presentación nueva y redes más sobrias

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `portada.bio` (la frase de presentación) | Desde 2008 en China. Fotografío lo que quizá no exista dentro de diez años. | In China since 2008. I photograph what may not exist ten years from now. | 自2008年起生活在中国。我拍下那些十年后也许已不复存在的东西。 |
| `meta.description` (lo que sale en el buscador) | Fotógrafo de calle en China desde 2008. Mis fotos, mis enlaces (…) y mi contacto para colaboraciones con marcas. | Street photographer in China since 2008. My photos, my links (…) and how to reach me for brand collaborations. | 2008年起在中国拍摄街头。这里有我的照片、各平台的链接（…），以及品牌合作的联系方式。 |

Debajo de 小红书 y 抖音 solo queda su nombre en letras latinas (**Xiaohongshu**, **Douyin**), sin descripción; ya no existen las claves `enlaces.xhs.gloss` ni `enlaces.douyin.gloss`. Tampoco hay «ISO 400 / ISO 200» en las franjas.

La imagen para redes (`og.jpg`) ahora dice «Fotografía de calle en China» y «Desde 2008».

La foto grande de la portada usa una versión recortada de `calle20` (se quita el borde negro de arriba, 1086×620). El original en `originales/` no se toca. El recorte está en `tools/seleccion.json` (`"recorte": "1086x620+0+104"`); si cambias la foto grande, quítalo o ajústalo.

## Formulario de contacto

| Clave | Español | Inglés | Chino |
|---|---|---|---|
| `contacto.texto` (sustituye a «Si tienes una marca…») | Para colaboraciones con marcas, prints o cualquier otra consulta, utiliza el formulario de contacto. Te respondo yo. | For brand collaborations, prints or anything else, use the contact form. I'll reply myself. | 品牌合作、印制作品或其他事宜，请使用联系表单。我会亲自回复。 |
| `contacto.cta` | Abrir el formulario | Open the form | 打开表单 |
| `form.titulo` / `form.intro` | Escríbeme / Tu mensaje me llega solo a mí… | Write to me / … | 给我写信 / … |
| `form.email` / `form.asunto` / `form.mensaje` | Email / Asunto / Descripción | Email / Subject / Description | 邮箱 / 主题 / 说明 |
| `form.msg.*` (enviando, ok, captcha, campos, servidor, config, carga) | Mensajes de estado | idem | idem |

El español de `contacto.texto` es mi forma de rellenar tu «blablabla»: cámbialo en `site/index.html` (y en los dos JSON) si quieres otra redacción. Todo el chino y el inglés del formulario es traducción mía.

## Reviews (nueva sección)

Las dos reviews de TTArtisan (23 mm y 56 mm) son tus textos del blog antiguo en español, inglés y chino, tal como estaban (`reviews/*/*.md`); no he cambiado su contenido. Lo nuevo y mío es la interfaz de estas páginas (`tools/reviews.mjs`, objeto `UI`) y los textos de la portada:

| Texto | Español | Inglés | Chino |
|---|---|---|---|
| Sección de la portada (`reviews.texto`) | Objetivos y cámaras probados en la calle: ficha técnica, fotos reales y mi opinión después de usarlos. | Lenses and cameras tested on the street: spec sheet, real photos and my verdict after using them. | 在街头实际使用过的镜头和相机：规格参数、实拍照片，以及使用后的看法。 |
| Botón | Ver las reviews | See the reviews | 查看评测 |
| Introducción del listado | Pruebas de objetivos y cámaras hechas en la calle… | Lenses and cameras tested on the street… | 在街头实际使用后的镜头和相机评测… |
| Menú / «volver» / «leer» | Reviews / Todas las reviews / Leer la review | Reviews / All reviews / Read the review | 评测 / 全部评测 / 阅读评测 |

## Portfolio

Todos los textos de `/portfolio/` en chino e inglés son traducción mía (están en `tools/portfolio.mjs`, objeto `PF`), igual que el botón de la portada:

| Texto | Español | Inglés | Chino |
|---|---|---|---|
| Introducción | Una selección de mi trabajo en la calle de Guangzhou, Hong Kong y Macao. Filtra por serie o por objetivo y toca una foto para verla grande. | A selection of my street work in Guangzhou, Hong Kong and Macao. Filter by series or lens and tap a photo to see it bigger. | 我在广州、香港和澳门街头拍摄的作品精选。可以按系列或镜头筛选，点一下照片可看大图。 |
| Filtros | Serie / Objetivo / Todas / Todos | Series / Lens / All | 系列 / 镜头 / 全部 |
| Botón de la portada (`portfolio.cta`) | Ver el portfolio completo | See the full portfolio | 查看完整作品集 |

**Nombres de objetivos (`tools/objetivos.json`).** Los he deducido del texto que escribe tu cámara en cada foto; los que no estoy seguro de la marca los he dejado sin marca: «AF 27mm F2.8» y «AF 14mm F3.5». «Meike 33mm F1.4», «TTArtisan AF 23mm F1.8» y «TTArtisan AF 56mm F1.8» también son deducidos. Corrígelos ahí y dímelo.
