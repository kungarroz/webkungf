#!/usr/bin/env node
// Build mínimo de shandevilla.com. Sin dependencias: solo Node 18+ (y Python para la fuente china).
//
//   node build.mjs
//
// 1. Fuente china: regenera site/fonts/noto-serif-sc-zh.woff2 con los caracteres de
//    site/i18n/zh.json y site/index.html (tools/subset_zh.py).
// 2. Entradas: lee el RSS de Substack AHORA, al construir, y reescribe las 3 últimas entradas
//    en site/index.html entre <!--ENTRADAS--> y <!--/ENTRADAS-->. Nada se pide desde el navegador.
// 3. Versiones: añade ?v=<huella> a css/js/i18n para que ningún móvil se quede con una hoja de estilos vieja.
// 4. Sitemap: actualiza <lastmod>.
//
// Nada de esto puede romper la web: si el RSS o la fuente fallan, se avisa y se deja lo anterior.
//
// Variables opcionales:  RSS_URL (otro feed), RSS_FILE (un .xml local para probar), SKIP_FONTS=1

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const INDEX = join(RAIZ, 'site', 'index.html');
const SITEMAP = join(RAIZ, 'site', 'sitemap.xml');
const RSS_URL = process.env.RSS_URL || 'https://shandevilla.substack.com/feed';
const MAX_ENTRADAS = 3;
const MAX_EXTRACTO = 190;

const aviso = (m) => console.warn(`⚠  ${m}`);
const ok = (m) => console.log(`✓  ${m}`);

// ───────── 1. Fuente china ─────────
function fuenteChina() {
  if (process.env.SKIP_FONTS) return aviso('Fuente china: omitida (SKIP_FONTS).');
  const lanzar = () => spawnSync('python3', [join(RAIZ, 'tools', 'subset_zh.py')], { encoding: 'utf8' });
  let r = lanzar();
  if (r.status !== 0 && /No module named|ModuleNotFoundError/.test(`${r.stderr}${r.stdout}`)) {
    console.log('   Instalando fonttools (solo para el build)…');
    for (const extra of [[], ['--break-system-packages']]) {
      const p = spawnSync('python3', ['-m', 'pip', 'install', '--quiet', 'fonttools', 'brotli', ...extra], { encoding: 'utf8' });
      if (p.status === 0) break;
    }
    r = lanzar();
  }
  if (r.status === 0) ok(`Fuente china: ${r.stdout.trim()}`);
  else aviso(`Fuente china: no se pudo regenerar (${(r.stderr || r.error || '').toString().trim().split('\n').pop()}). Se mantiene la versión que ya está en el repositorio.`);
}

// ───────── 2. RSS ─────────
const entidades = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decodificar(t) {
  return t
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => entidades[n.toLowerCase()] ?? m);
}
const limpiarTexto = (html) => decodificar(
  html.replace(/<\s*(script|style)[\s\S]*?<\/\s*\1\s*>/gi, ' ').replace(/<[^>]+>/g, ' ')
).replace(/\s+/g, ' ').trim();
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function etiqueta(bloque, nombre) {
  const m = bloque.match(new RegExp(`<${nombre}(?:\\s[^>]*)?>([\\s\\S]*?)</${nombre}>`, 'i'));
  if (!m) return '';
  const cdata = m[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return cdata ? cdata[1] : decodificar(m[1]);
}
function recortar(texto, max) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max).replace(/\s+\S*$/, '');
  return `${corte}…`;
}
export function leerFeed(xml) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  const entradas = [];
  for (const it of items) {
    const titulo = limpiarTexto(etiqueta(it, 'title'));
    const enlace = etiqueta(it, 'link').trim();
    const fecha = new Date(etiqueta(it, 'pubDate').trim());
    if (!titulo || !/^https:\/\//.test(enlace) || isNaN(fecha)) continue;
    let extracto = limpiarTexto(etiqueta(it, 'description'));
    if (!extracto) {
      const cuerpo = etiqueta(it, 'content:encoded');
      const parrafo = cuerpo.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      extracto = limpiarTexto(parrafo ? parrafo[1] : cuerpo);
    }
    entradas.push({ titulo, enlace, fecha, extracto: recortar(extracto, MAX_EXTRACTO) });
  }
  return entradas.sort((a, b) => b.fecha - a.fecha).slice(0, MAX_ENTRADAS);
}
function htmlEntradas(entradas) {
  const formato = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return entradas.map((e) => {
    const iso = e.fecha.toISOString().slice(0, 10);
    return `      <li class="entrada">
        <article>
          <time class="fecha" datetime="${iso}">${formato.format(e.fecha)}</time>
          <h3><a href="${escapar(e.enlace)}" rel="noopener">${escapar(e.titulo)}</a></h3>${e.extracto ? `
          <p class="extracto">${escapar(e.extracto)}</p>` : ''}
        </article>
      </li>`;
  }).join('\n');
}
async function descargarFeed() {
  if (process.env.RSS_FILE) return readFileSync(process.env.RSS_FILE, 'utf8');
  const r = await fetch(RSS_URL, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'shandevilla.com build' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function entradas() {
  try {
    const lista = leerFeed(await descargarFeed());
    if (!lista.length) throw new Error('el feed no trae entradas válidas');
    const html = readFileSync(INDEX, 'utf8');
    const patron = /(<!--ENTRADAS-->)([\s\S]*?)(<!--\/ENTRADAS-->)/;
    if (!patron.test(html)) throw new Error('faltan las marcas <!--ENTRADAS--> en site/index.html');
    writeFileSync(INDEX, html.replace(patron, (_, a, __, c) => `${a}\n${htmlEntradas(lista)}\n${c}`));
    ok(`Entradas: ${lista.length} desde ${process.env.RSS_FILE ? process.env.RSS_FILE : RSS_URL}`);
  } catch (e) {
    aviso(`Entradas: no se pudo leer el RSS (${e.message}). La página se publica con las entradas que ya tenía.`);
  }
}

// ───────── 3. Versiones (evita que se mezcle un HTML nuevo con un CSS/JS viejo en caché) ─────────
export function versiones() {
  const ficheros = ['css/estilo.css', 'js/app.js', 'js/idioma-inicial.js', 'i18n/zh.json', 'i18n/en.json'];
  const huella = createHash('sha1');
  for (const f of ficheros) huella.update(readFileSync(join(RAIZ, 'site', f)));
  const v = huella.digest('hex').slice(0, 8);
  const html = readFileSync(INDEX, 'utf8');
  const nuevo = html.replace(/(href|src)="(css\/estilo\.css|js\/app\.js|js\/idioma-inicial\.js)(\?v=[0-9a-f]+)?"/g, (_, a, f) => `${a}="${f}?v=${v}"`);
  if (nuevo !== html) writeFileSync(INDEX, nuevo);
  ok(`Versiones: ?v=${v}`);
}

// ───────── 4. Sitemap ─────────
function sitemap() {
  if (!existsSync(SITEMAP)) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const xml = readFileSync(SITEMAP, 'utf8');
  writeFileSync(SITEMAP, xml.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${hoy}</lastmod>`));
  ok(`Sitemap: lastmod ${hoy}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fuenteChina();
  await entradas();
  versiones();
  sitemap();
}
