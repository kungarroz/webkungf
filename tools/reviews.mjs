// Genera las páginas de reviews a partir de reviews/<slug>/{es,en,zh}.md  (sin dependencias).
//   es → site/reviews/…      en → site/en/reviews/…      zh → site/zh/reviews/…
// Las fotos las prepara tools/optimizar_reviews.py (reviews/<slug>/imagenes.json). Lo llama build.mjs.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = 'https://shandevilla.com';
const VERSION_ARCHIVOS = ['css/estilo.css', 'js/review.js'];

const IDIOMAS = {
  es: { prefijo: '', html: 'es', og: 'es_ES', fecha: 'es-ES', etiquetaIdioma: 'Español', boton: 'ES' },
  zh: { prefijo: '/zh', html: 'zh-Hans', og: 'zh_CN', fecha: 'zh-CN', etiquetaIdioma: '中文', boton: '中文' },
  en: { prefijo: '/en', html: 'en', og: 'en_GB', fecha: 'en-GB', etiquetaIdioma: 'English', boton: 'EN' },
};
const ORDEN = ['es', 'zh', 'en'];

// Textos de la interfaz de estas páginas (traducciones mías: están en REVISAR.md)
const UI = {
  es: {
    inicio: 'Inicio', reviews: 'Reviews', menu: 'Menú', idioma: 'Idioma', saltar: 'Saltar al contenido',
    tituloIndice: 'Reviews', intro: 'Pruebas de objetivos y cámaras hechas en la calle: para qué sirven, qué dice la ficha técnica y qué opino después de usarlos.',
    metaIndice: 'Reviews de objetivos y cámaras para fotografía de calle — Shande Villa',
    descIndice: 'Reviews de objetivos y cámaras hechas en la calle: ficha técnica, resultados y mi opinión después de semanas de uso.',
    volver: 'Todas las reviews', leer: 'Leer la review', vacio: 'Todavía no hay reviews en este idioma.',
    pie: 'Todas las fotos son mías. Si quieres usar alguna, escríbeme antes.', sufijo: 'Shande Villa',
  },
  zh: {
    inicio: '首页', reviews: '评测', menu: '菜单', idioma: '语言', saltar: '跳到内容',
    tituloIndice: '评测', intro: '在街头实际使用后的镜头和相机评测：规格参数，以及我的使用感受。',
    metaIndice: '街头摄影镜头与相机评测 — Shande Villa',
    descIndice: '在街头实际使用数周后的镜头和相机评测：规格参数、实拍结果和我的看法。',
    volver: '全部评测', leer: '阅读评测', vacio: '这个语言下还没有评测。',
    pie: '所有照片均为本人拍摄。如需使用，请先联系我。', sufijo: 'Shande Villa',
  },
  en: {
    inicio: 'Home', reviews: 'Reviews', menu: 'Menu', idioma: 'Language', saltar: 'Skip to content',
    tituloIndice: 'Reviews', intro: 'Lenses and cameras tested on the street: what they are for, what the spec sheet says and what I think after using them.',
    metaIndice: 'Lens and camera reviews for street photography — Shande Villa',
    descIndice: 'Lens and camera reviews made on the street: specs, results and my verdict after weeks of use.',
    volver: 'All reviews', leer: 'Read the review', vacio: 'There are no reviews in this language yet.',
    pie: 'All photos are mine. If you’d like to use one, please ask me first.', sufijo: 'Shande Villa',
  },
};

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ───────── Front matter ─────────
function separar(texto) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texto);
  if (!m) throw new Error('falta el front matter (--- … ---)');
  const meta = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const k = /^([A-Za-z]+):\s*(.*)$/.exec(linea);
    if (!k) continue;
    let v = k[2].trim();
    if (v.startsWith('[')) v = JSON.parse(v);
    else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1).replace(/''/g, "'");
    meta[k[1]] = v;
  }
  return { meta, cuerpo: m[2] };
}

// ───────── Markdown (el subconjunto que usan las reviews) ─────────
function inline(t, enlaceExterno = true) {
  const guardado = [];
  let s = t.replace(/`([^`]+)`/g, (_, c) => { guardado.push(`<code>${esc(c)}</code>`); return `\u0000${guardado.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => {
    const externo = /^https?:/.test(url);
    if (!/^(https?:|\/|#|mailto:)/.test(url)) return txt;
    return `<a href="${url}"${externo && enlaceExterno ? ' rel="noopener"' : ''}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => guardado[i]);
}

function celdas(linea) {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function tabla(lineas) {
  const cab = celdas(lineas[0]);
  const alin = celdas(lineas[1]).map((a) => (/^:-+:$/.test(a) ? 'center' : /-+:$/.test(a) ? 'right' : ''));
  const attr = (i) => (alin[i] ? ` style="text-align:${alin[i]}"` : '');
  const vacia = cab.every((c) => c === '');
  let h = '<div class="tabla"><table>';
  if (!vacia) h += `<thead><tr>${cab.map((c, i) => (c ? `<th scope="col"${attr(i)}>${inline(c)}</th>` : '<td></td>')).join('')}</tr></thead>`;
  h += '<tbody>';
  for (const l of lineas.slice(2)) {
    const f = celdas(l);
    h += `<tr>${f.map((c, i) => (i === 0 ? `<th scope="row"${attr(i)}>${inline(c)}</th>` : `<td${attr(i)}>${inline(c)}</td>`)).join('')}</tr>`;
  }
  return h + '</tbody></table></div>';
}

function bloques(md) {
  const L = md.replace(/\r/g, '').split('\n');
  const salida = [];
  let i = 0;
  while (i < L.length) {
    const l = L[i];
    if (!l.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{2,4})\s+(.+)$/.exec(l))) { salida.push({ t: 'h', n: m[1].length, texto: m[2] }); i++; continue; }
    if (/^-{3,}\s*$/.test(l)) { salida.push({ t: 'hr' }); i++; continue; }
    if ((m = /^!\[([^\]]*)\]\(\.\/([^)\s]+)\)\s*$/.exec(l))) {
      let pie = '';
      let j = i + 1;
      while (j < L.length && !L[j].trim()) j++;
      const c = j < L.length ? /^\*([^*].*)\*\s*$/.exec(L[j]) : null;
      if (c) { pie = c[1]; i = j; }
      salida.push({ t: 'img', alt: m[1], archivo: m[2], pie });
      i++; continue;
    }
    if (/^\|/.test(l) && i + 1 < L.length && /^\|?\s*:?-+/.test(L[i + 1])) {
      const bloque = [];
      while (i < L.length && /^\|/.test(L[i])) bloque.push(L[i++]);
      salida.push({ t: 'tabla', lineas: bloque }); continue;
    }
    if (/^[*-]\s+/.test(l)) {
      const items = [];
      while (i < L.length && /^[*-]\s+/.test(L[i])) items.push(L[i++].replace(/^[*-]\s+/, ''));
      salida.push({ t: 'ul', items }); continue;
    }
    if (/^\d+\.\s+/.test(l)) {
      const items = [];
      while (i < L.length && /^\d+\.\s+/.test(L[i])) items.push(L[i++].replace(/^\d+\.\s+/, ''));
      salida.push({ t: 'ol', items }); continue;
    }
    if (/^>\s?/.test(l)) {
      const partes = [];
      while (i < L.length && /^>\s?/.test(L[i])) partes.push(L[i++].replace(/^>\s?/, ''));
      salida.push({ t: 'cita', texto: partes.join(' ') }); continue;
    }
    const p = [L[i++].trim()];
    while (i < L.length && L[i].trim() && !/^(#{2,4}\s|-{3,}\s*$|!\[|\||[*-]\s+|\d+\.\s+|>)/.test(L[i])) p.push(L[i++].trim());
    salida.push({ t: 'p', texto: p.join(' ') });
  }
  return salida;
}

// ───────── Imágenes ─────────
function imagen(manifiesto, slug, archivo, alt, { eager = false, sizes = '(min-width: 760px) 720px, 100vw' } = {}) {
  const d = manifiesto[archivo];
  if (!d) throw new Error(`la imagen ${archivo} no está en imagenes.json (ejecuta python3 tools/optimizar_reviews.py)`);
  const url = (a) => `/img/reviews/${slug}/${d.base}-${a}.webp`;
  const mayor = d.anchos[d.anchos.length - 1];
  const alto = Math.round((d.h * mayor) / d.w);
  const srcset = d.anchos.map((a) => `${url(a)} ${a}w`).join(', ');
  return `<img src="${url(d.anchos[0])}" srcset="${srcset}" sizes="${sizes}" width="${mayor}" height="${alto}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

function cuerpoHtml(md, ctx) {
  let primeraImagen = true;
  return bloques(md).map((b) => {
    switch (b.t) {
      case 'h': return `<h${b.n}>${inline(b.texto)}</h${b.n}>`;
      case 'hr': return '<hr>';
      case 'p': return `<p>${inline(b.texto)}</p>`;
      case 'ul': return `<ul>${b.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>`;
      case 'ol': return `<ol>${b.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ol>`;
      case 'cita': return `<blockquote><p>${inline(b.texto)}</p></blockquote>`;
      case 'tabla': return tabla(b.lineas);
      case 'img': {
        // la portada ya se enseña arriba: si la review empieza repitiéndola, se omite
        if (primeraImagen && b.archivo === ctx.cover) { primeraImagen = false; return ''; }
        primeraImagen = false;
        return `<figure class="foto-review"><div class="ventana">${imagen(ctx.manifiesto, ctx.slug, b.archivo, b.alt)}</div>${b.pie ? `<figcaption>${inline(b.pie)}</figcaption>` : ''}</figure>`;
      }
      default: return '';
    }
  }).filter(Boolean).join('\n');
}

// ───────── Plantillas ─────────
function versiones(v) { return v ? `?v=${v}` : ''; }

function cabeza({ l, titulo, descripcion, canonico, alternativas, imagenOg, jsonld, tipo }) {
  const I = IDIOMAS[l];
  const alt = alternativas.map(({ idioma, url }) => `<link rel="alternate" hreflang="${idioma === 'zh' ? 'zh-Hans' : idioma}" href="${SITIO}${url}">`).join('\n');
  const xdef = alternativas.find((a) => a.idioma === 'es');
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${SITIO}${canonico}">
${alt}${xdef ? `\n<link rel="alternate" hreflang="x-default" href="${SITIO}${xdef.url}">` : ''}
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#15110D">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="Shande Villa">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${SITIO}${canonico}">
<meta property="og:locale" content="${I.og}">
<meta property="og:image" content="${SITIO}${imagenOg}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${SITIO}${imagenOg}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-serif-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/estilo.css${versiones(globalThis.__v?.css)}">
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld, null, 2)}\n</script>` : ''}`;
}

function marco({ l, cuerpo, head, actual, enlacesIdioma, rutaIndice }) {
  const I = IDIOMAS[l];
  const t = UI[l];
  const botones = ORDEN.map((i) => {
    const e = enlacesIdioma.find((x) => x.idioma === i);
    const k = IDIOMAS[i];
    if (!e) return `<span class="idioma-no" lang="${k.html}" aria-label="${k.etiquetaIdioma}" aria-disabled="true">${k.boton}</span>`;
    return `<a data-idioma="${i}" href="${e.url}" lang="${k.html}" aria-label="${k.etiquetaIdioma}"${i === l ? ' aria-current="true"' : ''}>${k.boton}</a>`;
  }).join('\n    ');
  return `<!doctype html>
<html lang="${I.html}" class="pagina-review">
<head>
${head}
</head>
<body>
<a class="saltar" href="#contenido">${t.saltar}</a>
<header class="cabecera">
  <p class="marca"><a href="${I.prefijo || ''}/" data-inicio>Shande Villa</a></p>
  <div class="idioma" role="group" aria-label="${t.idioma}">
    ${botones}
  </div>
</header>
<nav class="menu" aria-label="${t.menu}">
  <div class="menu-in">
    <a href="/" data-inicio>${t.inicio}</a>
    <a href="${rutaIndice}"${actual === 'indice' ? ' aria-current="true"' : ''}>${t.reviews}</a>
  </div>
</nav>
<main id="contenido">
<div class="pagina">
${cuerpo}
</div>
</main>
<footer class="pie">
  <p>© ${new Date().getFullYear()} Shande Villa</p>
  <p>${t.pie}</p>
</footer>
<script src="/js/review.js${versiones(globalThis.__v?.js)}" defer></script>
</body>
</html>
`;
}

// ───────── Programa ─────────
function fechaLarga(iso, l) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat(IDIOMAS[l].fecha, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function generarReviews({ versionCss = '', versionJs = '' } = {}) {
  globalThis.__v = { css: versionCss, js: versionJs };
  const dirReviews = join(RAIZ, 'reviews');
  if (!existsSync(dirReviews)) return { paginas: [] };

  // limpiar lo generado antes
  for (const d of ['reviews', 'en/reviews', 'zh/reviews']) rmSync(join(RAIZ, 'site', d), { recursive: true, force: true });

  const reviews = [];
  for (const slug of readdirSync(dirReviews, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()) {
    const carpeta = join(dirReviews, slug);
    const manifiestoRuta = join(carpeta, 'imagenes.json');
    if (!existsSync(manifiestoRuta)) throw new Error(`reviews/${slug}: falta imagenes.json (ejecuta python3 tools/optimizar_reviews.py)`);
    const manifiesto = JSON.parse(readFileSync(manifiestoRuta, 'utf8'));
    const porIdioma = {};
    for (const l of ORDEN) {
      const f = join(carpeta, `${l}.md`);
      if (!existsSync(f)) continue;
      const { meta, cuerpo } = separar(readFileSync(f, 'utf8'));
      if (!meta.title || !meta.description || !meta.pubDate) throw new Error(`reviews/${slug}/${l}.md: faltan title, description o pubDate`);
      const cover = String(meta.cover || '').replace(/^\.\//, '');
      porIdioma[l] = { meta, cuerpo, cover };
    }
    if (!Object.keys(porIdioma).length) continue;
    reviews.push({ slug, manifiesto, porIdioma, fecha: Object.values(porIdioma)[0].meta.pubDate });
  }
  reviews.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

  const paginas = [];
  const escribir = (ruta, html) => {
    const f = join(RAIZ, 'site', ruta, 'index.html');
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, html);
  };

  for (const l of ORDEN) {
    const I = IDIOMAS[l];
    const t = UI[l];
    const enEste = reviews.filter((r) => r.porIdioma[l]);
    const urlIndice = (x) => `${IDIOMAS[x].prefijo}/reviews/`;
    const urlReview = (x, slug) => `${IDIOMAS[x].prefijo}/reviews/${slug}/`;
    const indicesEn = ORDEN.filter((x) => reviews.some((r) => r.porIdioma[x]));

    // índice
    const tarjetas = enEste.map((r) => {
      const d = r.porIdioma[l];
      return `<li><a class="tarjeta-review" href="${urlReview(l, r.slug)}">
  <span class="ventana">${imagen(r.manifiesto, r.slug, d.cover, '', { sizes: '(min-width: 760px) 280px, 100vw' })}</span>
  <span class="tarjeta-texto">
    <span class="review-meta">${fechaLarga(d.meta.pubDate, l)}</span>
    <span class="tarjeta-titulo">${esc(d.meta.title)}</span>
    <span class="tarjeta-desc">${esc(d.meta.description)}</span>
    <span class="tarjeta-leer">${t.leer} <span class="flecha" aria-hidden="true"></span></span>
  </span>
</a></li>`;
    }).join('\n');
    const cuerpoIndice = `<section class="reviews-indice" aria-labelledby="h-reviews">
  <h1 id="h-reviews" class="titulo-pagina">${t.tituloIndice}</h1>
  <p class="entradilla">${t.intro}</p>
  ${enEste.length ? `<ul class="lista-reviews">\n${tarjetas}\n</ul>` : `<p>${t.vacio}</p>`}
</section>`;
    const primera = enEste[0];
    const ogIndice = primera ? `/img/reviews/${primera.slug}/${primera.manifiesto[primera.porIdioma[l].cover].base}-${primera.manifiesto[primera.porIdioma[l].cover].anchos.at(-1)}.webp` : '/og.jpg';
    const altIndice = indicesEn.map((x) => ({ idioma: x, url: urlIndice(x) }));
    escribir(`${I.prefijo}/reviews`.replace(/^\//, ''), marco({
      l, cuerpo: cuerpoIndice, actual: 'indice', rutaIndice: urlIndice(l), enlacesIdioma: altIndice,
      head: cabeza({ l, titulo: t.metaIndice, descripcion: t.descIndice, canonico: urlIndice(l), alternativas: altIndice, imagenOg: ogIndice, tipo: 'website' }),
    }));
    paginas.push({ url: urlIndice(l), idiomas: altIndice, imagen: ogIndice });

    // cada review
    for (const r of enEste) {
      const d = r.porIdioma[l];
      const ctx = { manifiesto: r.manifiesto, slug: r.slug, cover: d.cover };
      const alternativas = ORDEN.filter((x) => r.porIdioma[x]).map((x) => ({ idioma: x, url: urlReview(x, r.slug) }));
      const m = r.manifiesto[d.cover];
      const og = `/img/reviews/${r.slug}/${m.base}-${m.anchos.at(-1)}.webp`;
      const etiquetas = Array.isArray(d.meta.tags) ? d.meta.tags : [];
      const cuerpo = `<article class="review" lang="${I.html}">
  <p class="migas"><a href="${urlIndice(l)}"><span aria-hidden="true">←</span> ${t.volver}</a></p>
  <header class="review-cab">
    <p class="review-meta"><time datetime="${esc(d.meta.pubDate)}">${fechaLarga(d.meta.pubDate, l)}</time></p>
    <h1>${inline(d.meta.title)}</h1>
    <p class="entradilla">${inline(d.meta.description)}</p>
    ${etiquetas.length ? `<ul class="etiquetas" aria-label="Tags">${etiquetas.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
  </header>
  <figure class="portada-review"><div class="ventana">${imagen(r.manifiesto, r.slug, d.cover, d.meta.title, { eager: true })}</div></figure>
  <div class="review-cuerpo">
${cuerpoHtml(d.cuerpo, ctx)}
  </div>
  <p class="migas migas-pie"><a href="${urlIndice(l)}"><span aria-hidden="true">←</span> ${t.volver}</a></p>
</article>`;
      const jsonld = {
        '@context': 'https://schema.org', '@type': 'Review', name: d.meta.title, description: d.meta.description,
        datePublished: String(d.meta.pubDate), inLanguage: I.html, image: `${SITIO}${og}`,
        author: { '@type': 'Person', name: 'Shande Villa', url: `${SITIO}/` },
        url: `${SITIO}${urlReview(l, r.slug)}`,
      };
      escribir(`${I.prefijo}/reviews/${r.slug}`.replace(/^\//, ''), marco({
        l, cuerpo, actual: 'review', rutaIndice: urlIndice(l), enlacesIdioma: alternativas,
        head: cabeza({ l, titulo: `${d.meta.title} — ${t.sufijo}`, descripcion: d.meta.description, canonico: urlReview(l, r.slug), alternativas, imagenOg: og, jsonld, tipo: 'article' }),
      }));
      paginas.push({ url: urlReview(l, r.slug), idiomas: alternativas, imagen: og, fecha: String(d.meta.pubDate) });
    }
  }
  return { paginas, reviews: reviews.length };
}

// Texto chino de las reviews, para recortar la fuente china (lo lee tools/subset_zh.py)
export function textoChino() {
  const dir = join(RAIZ, 'reviews');
  if (!existsSync(dir)) return '';
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name, 'zh.md')).filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n');
}
