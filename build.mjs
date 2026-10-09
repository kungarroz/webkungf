#!/usr/bin/env node
// Build mínimo de shandevilla.com. Sin dependencias: solo Node 18+ (y Python para la fuente china).
//
//   node build.mjs
//
// 1. Fuente china: regenera site/fonts/noto-serif-sc-zh.woff2 con los caracteres de
//    site/i18n/zh.json y site/index.html (tools/subset_zh.py).
// 2. Último post: lee el RSS de Substack AHORA, al construir, y pone el título y el enlace de tu última
//    entrada en la fila de Substack de site/index.html (entre <!--ULTIMO--> y <!--/ULTIMO-->, y en el
//    href de <a data-ultimo>). Nada se pide desde el navegador.
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
async function descargarFeed() {
  if (process.env.RSS_FILE) return readFileSync(process.env.RSS_FILE, 'utf8');
  const r = await fetch(RSS_URL, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'shandevilla.com build' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function ultimoPost() {
  try {
    const [e] = leerFeed(await descargarFeed());
    if (!e) throw new Error('el feed no trae entradas válidas');
    let html = readFileSync(INDEX, 'utf8');
    const marca = /(<!--ULTIMO-->)([\s\S]*?)(<!--\/ULTIMO-->)/;
    const enlace = /(<a data-ultimo href=")[^"]*(")/;
    if (!marca.test(html) || !enlace.test(html)) throw new Error('faltan las marcas del último post en site/index.html');
    const post = `<span class="post"><span class="post-etiqueta" data-i18n="redes.ultimo">Último post</span><span class="post-titulo">${escapar(e.titulo)}</span></span>`;
    html = html.replace(marca, (_, a, __, c) => `${a}${post}${c}`).replace(enlace, (_, a, c) => `${a}${escapar(e.enlace)}${c}`);
    writeFileSync(INDEX, html);
    ok(`Último post: «${e.titulo}» (${process.env.RSS_FILE ? process.env.RSS_FILE : RSS_URL})`);
  } catch (err) {
    aviso(`Último post: no se pudo leer el RSS (${err.message}). La fila de Substack se publica sin título y enlaza a tu perfil.`);
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

// ───────── 3b. Clave pública de Turnstile (captcha del formulario de contacto) ─────────
// La clave del sitio es pública (va en el HTML). Se pone en Pages → Variables como TURNSTILE_SITE_KEY.
export function turnstile() {
  const clave = (process.env.TURNSTILE_SITE_KEY || '').trim();
  const html = readFileSync(INDEX, 'utf8');
  const patron = /(id="f-captcha"[^>]*data-sitekey=")[^"]*(")/;
  if (!patron.test(html)) return aviso('Turnstile: falta #f-captcha en site/index.html.');
  if (!clave) return aviso('Turnstile: no hay TURNSTILE_SITE_KEY; el formulario de contacto saldrá como «no activado».');
  if (!/^[0-9A-Za-z_-]{8,64}$/.test(clave)) return aviso('Turnstile: TURNSTILE_SITE_KEY tiene caracteres raros; se ignora.');
  writeFileSync(INDEX, html.replace(patron, (_, a, c) => `${a}${clave}${c}`));
  ok('Turnstile: clave del sitio aplicada.');
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
  await ultimoPost();
  turnstile();
  versiones();
  sitemap();
}
