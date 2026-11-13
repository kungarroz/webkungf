// Genera el blog: las notas de blog/<nombre>/ y el listado /blog/ (notas + reviews). Sin dependencias.
//   es → site/blog/…      en → site/en/blog/…      zh → site/zh/blog/…
// Las fotos de las notas las prepara tools/optimizar_reviews.py (site/img/blog/<nombre>/). Lo llama build.mjs.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS, ORDEN, SITIO, UI, cabeza, cuerpoHtml, esc, fechaCorta, fechaLarga, figura, fijarVersiones, imagen, inline, leerContenido, marco } from './reviews.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const BL = {
  es: { titulo: 'Blog', intro: 'Notas, reviews y lo que voy encontrando por la calle.', meta: 'Blog de fotografía de calle en China — Shande Villa',
    desc: 'Notas y reviews de un fotógrafo de calle en China: cámaras, objetivos y lo que se aprende caminando.', review: 'Review', nota: 'Nota', vacio: 'Todavía no hay entradas en este idioma.' },
  zh: { titulo: '博客', intro: '笔记、评测，以及我在街头遇到的一切。', meta: '中国街头摄影博客 — Shande Villa',
    desc: '一位在中国拍摄街头的摄影师的笔记与评测：相机、镜头，以及边走边学到的东西。', review: '评测', nota: '笔记', vacio: '这个语言下还没有文章。' },
  en: { titulo: 'Blog', intro: 'Notes, reviews and whatever I find on the street.', meta: 'Street photography blog in China — Shande Villa',
    desc: 'Notes and reviews from a street photographer in China: cameras, lenses and what you learn by walking.', review: 'Review', nota: 'Note', vacio: 'There are no posts in this language yet.' },
};

export function generarBlog({ versionCss = '', versionJs = '', reviews = [] } = {}) {
  fijarVersiones({ css: versionCss, js: versionJs });
  for (const d of ['blog', 'en/blog', 'zh/blog']) rmSync(join(RAIZ, 'site', d), { recursive: true, force: true });
  const notas = leerContenido('blog');
  const paginas = [];
  const escribir = (ruta, html) => {
    const f = join(RAIZ, 'site', ruta, 'index.html');
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, html);
  };
  const urlBlog = (x) => `${IDIOMAS[x].prefijo}/blog/`;
  const urlNota = (x, slug) => `${IDIOMAS[x].prefijo}/blog/${slug}/`;
  const urlReview = (x, slug) => `${IDIOMAS[x].prefijo}/reviews/${slug}/`;
  const hayEn = (x) => notas.some((n) => n.porIdioma[x]) || reviews.some((r) => r.porIdioma[x]);
  const altIndice = ORDEN.filter(hayEn).map((x) => ({ idioma: x, url: urlBlog(x) }));

  for (const l of ORDEN) {
    const I = IDIOMAS[l];
    const t = UI[l];
    const b = BL[l];
    // todo lo escrito en este idioma, de lo más nuevo a lo más viejo
    const entradas = [
      ...notas.filter((n) => n.porIdioma[l]).map((n) => ({ tipo: 'nota', slug: n.slug, manifiesto: n.manifiesto, d: n.porIdioma[l], carpeta: `blog/${n.slug}`, url: urlNota(l, n.slug) })),
      ...reviews.filter((r) => r.porIdioma[l]).map((r) => ({ tipo: 'review', slug: r.slug, manifiesto: r.manifiesto, d: r.porIdioma[l], carpeta: r.slug, url: urlReview(l, r.slug) })),
    ].sort((a, c) => String(c.d.meta.pubDate).localeCompare(String(a.d.meta.pubDate)));

    // listado
    const filas = entradas.map((e, n) => `<li data-buscar="${esc((e.d.meta.title + ' ' + (e.d.meta.producto || '') + ' ' + (e.d.meta.marca || '')).toLowerCase())}" style="--i:${n}"><a class="fila-review${e.d.cover ? '' : ' sin-foto'}" href="${e.url}">
${e.d.cover ? `  <span class="fila-foto">${imagen(e.manifiesto, e.carpeta, e.d.cover, '', { sizes: '(min-width: 960px) 240px, 120px' })}</span>\n` : ''}  <span class="fila-texto">
    <span class="review-meta">${b[e.tipo]} · ${fechaCorta(e.d.meta.pubDate, l)}</span>
    <span class="fila-titulo">${esc(e.d.meta.title)}</span>
    <span class="fila-desc">${esc(e.d.meta.description)}</span>
  </span>
</a></li>`).join('\n');
    const cuerpoIndice = `<section class="reviews-indice" aria-labelledby="h-blog">
  <h1 id="h-blog" class="titulo-pagina">${b.titulo}</h1>
  <p class="entradilla">${b.intro}</p>
${entradas.length > 8 ? `  <p class="buscador" hidden><label for="buscar-review">${t.buscar}</label><input id="buscar-review" type="search" autocomplete="off" placeholder="${t.buscarEj}"></p>\n  <p class="sin-resultados" role="status" hidden>${t.sinResultados}</p>\n` : ''}  ${entradas.length ? `<ul class="lista-reviews">\n${filas}\n</ul>` : `<p>${b.vacio}</p>`}
</section>`;
    const primera = entradas.find((e) => e.d.cover);
    const urlImg = (e) => { const m = e.manifiesto[e.d.cover]; return `/img/${e.tipo === 'nota' ? e.carpeta : `reviews/${e.carpeta}`}/${m.base}-${m.anchos.at(-1)}.webp`; };
    const ogIndice = primera ? urlImg(primera) : '/og.jpg';
    escribir(`${I.prefijo}/blog`.replace(/^\//, ''), marco({
      l, cuerpo: cuerpoIndice, actual: 'blog', menuActual: 'blog', rutaIndice: `${I.prefijo}/reviews/`, enlacesIdioma: altIndice,
      head: cabeza({ l, titulo: b.meta, descripcion: b.desc, canonico: urlBlog(l), alternativas: altIndice, imagenOg: ogIndice, tipo: 'website' }),
    }));
    paginas.push({ url: urlBlog(l), idiomas: altIndice, imagen: ogIndice });

    // cada nota
    for (const e of entradas.filter((x) => x.tipo === 'nota')) {
      const d = e.d;
      const ctx = { manifiesto: e.manifiesto, slug: e.carpeta, cover: d.cover, ids: new Set(), indice: [], t };
      const cuerpoMd = cuerpoHtml(d.cuerpo, ctx);
      const nota = notas.find((n) => n.slug === e.slug);
      const alternativas = ORDEN.filter((x) => nota.porIdioma[x]).map((x) => ({ idioma: x, url: urlNota(x, e.slug) }));
      const og = d.cover ? urlImg(e) : '/og.jpg';
      const etiquetas = Array.isArray(d.meta.tags) ? d.meta.tags : [];
      const cuerpo = `<div class="review-layout solo">
<article class="review" lang="${I.html}">
  <div class="hoja">
    <p class="migas"><a href="${urlBlog(l)}"><span aria-hidden="true">←</span> ${b.titulo}</a></p>
    <header class="review-cab">
      <p class="review-meta"><time datetime="${esc(d.meta.pubDate)}">${fechaLarga(d.meta.pubDate, l)}</time></p>
      <h1>${inline(d.meta.title)}</h1>
      <p class="entradilla">${inline(d.meta.description)}</p>
      ${etiquetas.length ? `<p class="etiquetas">${etiquetas.map((x) => esc(x)).join(' · ')}</p>` : ''}
    </header>
    ${d.cover ? figura(e.manifiesto, e.carpeta, d.cover, d.meta.title, '', t, { eager: true, portada: true }) : ''}
    ${ctx.indice.length > 3 ? `<details class="indice-review"><summary>${t.contenido}</summary><ol>${ctx.indice.map((x) => `<li><a href="#${x.id}">${inline(x.texto, false)}</a></li>`).join('')}</ol></details>` : ''}
    <div class="review-cuerpo">
${cuerpoMd}
    </div>
    <p class="migas migas-pie"><a href="${urlBlog(l)}"><span aria-hidden="true">←</span> ${b.titulo}</a></p>
  </div>
</article>
</div>`;
      const jsonld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: d.meta.title, description: d.meta.description,
        datePublished: String(d.meta.pubDate), inLanguage: I.html, image: `${SITIO}${og}`,
        author: { '@type': 'Person', name: 'Shande Villa', url: `${SITIO}/` }, url: `${SITIO}${urlNota(l, e.slug)}`,
      };
      escribir(`${I.prefijo}/blog/${e.slug}`.replace(/^\//, ''), marco({
        l, cuerpo, actual: 'nota', menuActual: 'blog', rutaIndice: `${I.prefijo}/reviews/`, enlacesIdioma: alternativas,
        head: cabeza({ l, titulo: `${d.meta.title} — ${t.sufijo}`, descripcion: d.meta.description, canonico: urlNota(l, e.slug), alternativas, imagenOg: og, jsonld, tipo: 'article' }),
      }));
      paginas.push({ url: urlNota(l, e.slug), idiomas: alternativas, imagen: og, fecha: String(d.meta.pubDate) });
    }
  }
  return { paginas, notas: notas.length };
}
