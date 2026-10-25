// Genera la página del portfolio (con filtros) en los tres idiomas, sin dependencias.
//   es → site/portfolio/      en → site/en/portfolio/      zh → site/zh/portfolio/
// Usa las mismas fotos que el carrete de la portada (las elige tools/seleccion.json y las optimiza tools/optimizar_fotos.py).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IDIOMAS, ORDEN, UI, cabeza, esc, etiquetasMenu, fijarVersiones, marco } from './reviews.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITIO = 'https://shandevilla.com';

const PF = {
  es: { titulo: 'Portfolio', intro: 'Una selección de mi trabajo en la calle de Guangzhou, Hong Kong y Macao. Filtra por serie o por objetivo y toca una foto para verla grande.',
    meta: 'Portfolio de fotografía de calle en China — Shande Villa', desc: 'Fotografía de calle en Guangzhou, Hong Kong y Macao: calle, noche, retratos urbanos, arquitectura y detalles.',
    filtros: 'Filtros', serie: 'Serie', objetivo: 'Objetivo', todas: 'Todas', cuenta: (n) => `${n} ${n === 1 ? 'foto' : 'fotos'}`, vacio: 'No hay fotos con esa combinación.', quitar: 'Quitar filtros' },
  zh: { titulo: '作品集', intro: '我在广州、香港和澳门街头拍摄的作品精选。可以按系列或镜头筛选，点一下照片可看大图。',
    meta: '中国街头摄影作品集 — Shande Villa', desc: '广州、香港和澳门的街头摄影：街头、夜晚、城市人像、建筑和细节。',
    filtros: '筛选', serie: '系列', objetivo: '镜头', todas: '全部', cuenta: (n) => `${n} 张照片`, vacio: '没有符合条件的照片。', quitar: '清除筛选' },
  en: { titulo: 'Portfolio', intro: 'A selection of my street work in Guangzhou, Hong Kong and Macao. Filter by series or lens and tap a photo to see it bigger.',
    meta: 'Street photography portfolio in China — Shande Villa', desc: 'Street photography in Guangzhou, Hong Kong and Macao: street, night, urban portraits, architecture and details.',
    filtros: 'Filters', serie: 'Series', objetivo: 'Lens', todas: 'All', cuenta: (n) => `${n} ${n === 1 ? 'photo' : 'photos'}`, vacio: 'No photos match that combination.', quitar: 'Clear filters' },
};

// ───────── Fotos: todas las de las carpetas de originales (las prepara tools/optimizar_portfolio.py) ─────────
const slug = (t) => t.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function leerFotos() {
  const ruta = join(RAIZ, 'tools', 'portfolio-fotos.json');
  if (!existsSync(ruta)) throw new Error('falta tools/portfolio-fotos.json (ejecuta python3 tools/optimizar_portfolio.py)');
  const sel = JSON.parse(readFileSync(join(RAIZ, 'tools', 'seleccion.json'), 'utf8'));
  const series = sel.rollos.map((r) => ({ id: r.id, es: r.titulo }));
  const fotos = JSON.parse(readFileSync(ruta, 'utf8')).map((f) => {
    const url = (a) => `/img/portfolio/${f.serie}/${f.id}-${a}.webp`;
    return {
      serie: f.serie, w: f.w, h: f.h, a: +(f.w / f.h).toFixed(3), objetivo: f.objetivo || '',
      grande: url(f.anchos.at(-1)), pequena: url(f.anchos[0]),
      srcset: f.anchos.map((a) => `${url(a)} ${a}w`).join(', '),
    };
  });
  return { series, fotos };
}

export function generarPortfolio({ versionCss = '' } = {}) {
  const archivoJs = join(RAIZ, 'site', 'js', 'portfolio.js');
  if (!existsSync(archivoJs)) return [];
  const vJs = createHash('sha1').update(readFileSync(archivoJs)).digest('hex').slice(0, 8);
  const vRev = createHash('sha1').update(readFileSync(join(RAIZ, 'site', 'js', 'review.js'))).digest('hex').slice(0, 8);
  fijarVersiones({ css: versionCss, js: vRev });
  const { series, fotos } = leerFotos();
  for (const d of ['portfolio', 'en/portfolio', 'zh/portfolio']) rmSync(join(RAIZ, 'site', d), { recursive: true, force: true });

  const paginas = [];
  const url = (l) => `${IDIOMAS[l].prefijo}/portfolio/`;
  const alternativas = ORDEN.map((l) => ({ idioma: l, url: url(l) }));
  for (const l of ORDEN) {
    const I = IDIOMAS[l];
    const t = PF[l];
    const nombres = l === 'es' ? Object.fromEntries(series.map((s) => [s.id, s.es]))
      : Object.fromEntries(series.map((s) => [s.id, JSON.parse(readFileSync(join(RAIZ, 'site', 'i18n', `${l}.json`), 'utf8'))[`rollo.${s.id}`] || s.es]));
    const cont = Object.fromEntries(series.map((s) => [s.id, fotos.filter((f) => f.serie === s.id).length]));
    const nSerie = {};
    const chip = (grupo, valor, texto, pulsado, n) => `<button type="button" class="chip" data-f="${grupo}" data-v="${valor}" aria-pressed="${pulsado}">${esc(texto)}${n != null ? ` <span class="n">${n}</span>` : ''}</button>`;
    // objetivos: del más usado al menos; las fotos sin dato de objetivo solo salen en «Todos»
    const cuentaObj = {};
    for (const f of fotos) if (f.objetivo) cuentaObj[f.objetivo] = (cuentaObj[f.objetivo] || 0) + 1;
    const objetivos = Object.entries(cuentaObj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const filtros = `<div class="filtros" hidden>
  <div class="filtro-grupo"><p class="filtro-etiqueta" id="f-serie">${t.serie}</p><div class="chips" role="group" aria-labelledby="f-serie">
    ${chip('serie', 'todas', t.todas, 'true', fotos.length)}
    ${series.map((s) => chip('serie', s.id, nombres[s.id], 'false', cont[s.id])).join('\n    ')}
  </div></div>
  <div class="filtro-grupo"><p class="filtro-etiqueta" id="f-objetivo">${t.objetivo}</p><div class="chips" role="group" aria-labelledby="f-objetivo">
    ${chip('objetivo', 'todas', t.todas, 'true')}
    ${objetivos.map(([n, c]) => chip('objetivo', slug(n), n, 'false', c)).join('\n    ')}
  </div></div>
</div>`;
    const items = fotos.map((f, i) => {
      nSerie[f.serie] = (nSerie[f.serie] || 0) + 1;
      const alt = `${nombres[f.serie]} · ${nSerie[f.serie]}`;
      return `<li data-serie="${f.serie}" data-objetivo="${f.objetivo ? slug(f.objetivo) : ''}" style="--a:${f.a}"><a class="zoom" href="${f.grande}" data-srcset="${f.srcset}" data-w="${f.w}" data-h="${f.h}" data-pie="${esc(nombres[f.serie])}${f.objetivo ? ' · ' + esc(f.objetivo) : ''}" aria-label="${esc(UI[l].ampliar)}: ${esc(alt)}"><i></i><img src="${f.pequena}" srcset="${f.srcset}" sizes="(min-width: 960px) 28vw, 50vw" width="${f.w}" height="${f.h}" alt="${esc(alt)}"${i < 8 ? '' : ' loading="lazy"'} decoding="async"></a></li>`;
    }).join('\n');
    const cuerpo = `<section class="portfolio" aria-labelledby="h-portfolio" data-todas="${esc(t.todas)}">
  <h1 id="h-portfolio" class="titulo-pagina">${t.titulo}</h1>
  <p class="entradilla">${t.intro}</p>
${filtros}
  <p class="filtro-cuenta" role="status" aria-live="polite" data-uno="${esc(t.cuenta(1))}" data-plantilla="${esc(t.cuenta('{n}'))}">${t.cuenta(fotos.length)}</p>
  <p class="sin-fotos" hidden>${t.vacio} <button type="button" class="enlace-boton" data-quitar>${t.quitar}</button></p>
  <ul class="mosaico">
${items}
  </ul>
</section>`;
    const og = fotos[0] ? fotos[0].grande : '/og.jpg';
    const jsonld = { '@context': 'https://schema.org', '@type': 'ImageGallery', name: t.meta, description: t.desc, inLanguage: I.html, url: `${SITIO}${url(l)}`, author: { '@type': 'Person', name: 'Shande Villa', url: `${SITIO}/` } };
    const f = join(RAIZ, 'site', I.prefijo.replace(/^\//, ''), 'portfolio', 'index.html');
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, marco({
      l, cuerpo, actual: 'portfolio', menuActual: 'fotos', rutaFotos: url(l), rutaIndice: `${I.prefijo}/reviews/`, enlacesIdioma: alternativas,
      scripts: [{ src: '/js/portfolio.js', v: vJs }], clase: 'pagina-portfolio',
      head: cabeza({ l, titulo: t.meta, descripcion: t.desc, canonico: url(l), alternativas, imagenOg: og, jsonld, tipo: 'website' }),
    }));
    paginas.push({ url: url(l), idiomas: alternativas, imagen: og });
  }
  return paginas;
}
