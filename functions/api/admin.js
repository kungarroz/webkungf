// Panel de publicación · API privada  →  /api/admin/*
//
// Lo usa la página /admin/ para crear y editar reviews y notas del blog sin pasar por GitHub:
//   GET  /api/admin/lista                    entradas que ya existen
//   GET  /api/admin/entrada?tipo=&slug=      el contenido de una entrada, para editarla
//   POST /api/admin/traducir                 traduce un texto con Claude (opcional)
//   POST /api/admin/publicar                 guarda la entrada y sus fotos en GitHub (un solo commit)
// GitHub avisa a Cloudflare y la web se vuelve a desplegar sola.
//
// Variables (Settings → Variables and Secrets del Worker; las tres primeras como «Secret»):
//   ADMIN_PASSWORD     contraseña del panel (larga: 20 caracteres o más)
//   GITHUB_TOKEN       token de GitHub (fine-grained) con permiso «Contents: Read and write» solo sobre este repositorio
//   ANTHROPIC_API_KEY  opcional: clave de la API de Anthropic para el botón «Traducir»
//   GITHUB_REPO        opcional, por defecto kungarroz/webkungf
//   GITHUB_BRANCH      opcional, por defecto main
//   TRANSLATE_MODEL    opcional, por defecto claude-sonnet-5-5

const GITHUB = 'https://api.github.com';
const TIPOS = { review: 'reviews', nota: 'blog' };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOMBRE_FOTO = /^[a-z0-9][a-z0-9-]{0,60}\.jpg$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const IDIOMAS = ['es', 'en', 'zh'];
const MAX_CUERPO = 100000;
const MAX_BLOBS = 36; // el plan gratuito de Workers permite 50 llamadas externas por petición

const responder = (cuerpo, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function igual(a, b) {
  // compara dos textos sin que el tiempo que tarda delate cuántos caracteres coinciden
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}

// ───────── GitHub ─────────
const repo = (env) => env.GITHUB_REPO || 'kungarroz/webkungf';
const rama = (env) => env.GITHUB_BRANCH || 'main';

async function gh(env, ruta, opciones = {}) {
  const r = await fetch(`${GITHUB}/repos/${repo(env)}${ruta}`, {
    ...opciones,
    headers: {
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      accept: opciones.raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'shandevilla-admin',
      ...(opciones.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  return r;
}

async function ghJson(env, ruta, opciones) {
  const r = await gh(env, ruta, opciones);
  if (!r.ok) {
    let msg = '';
    try { msg = (await r.json()).message || ''; } catch { /* sin cuerpo */ }
    const e = new Error(`GitHub ${r.status}: ${msg}`.trim());
    e.estado = r.status;
    throw e;
  }
  return r.json();
}

async function leerArchivo(env, ruta) {
  const r = await gh(env, `/contents/${ruta}?ref=${encodeURIComponent(rama(env))}`, { raw: true });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status} al leer ${ruta}`);
  return r.text();
}

// ───────── Textos ─────────
const CONTROL = new RegExp('[\\u0000-\\u001f\\u007f\\u2028\\u2029]+', 'g'); // con RegExp para que ningún editor convierta los escapes en caracteres reales
const unaLinea = (t, max) => String(t ?? '').replace(CONTROL, ' ').trim().slice(0, max);
const yaml = (t) => `'${t.replace(/'/g, "''")}'`;

function cabecera({ tipo, titulo, descripcion, fecha, marca, producto, cover, tags, traducido }) {
  const l = ['---', `title: ${yaml(titulo)}`, `description: ${yaml(descripcion)}`, `pubDate: ${fecha}`];
  if (tipo === 'review') { l.push(`marca: ${yaml(marca)}`, `producto: ${yaml(producto)}`); }
  if (cover) l.push(`cover: "./${cover}"`);
  l.push(`tags: ${JSON.stringify(tags)}`);
  if (traducido) l.push("_traducido: 'claude'");
  l.push('---', '');
  return l.join('\n');
}

function limpiarTags(t) {
  return (Array.isArray(t) ? t : []).map((x) => unaLinea(x, 40)).filter(Boolean).slice(0, 12);
}

// ───────── Rutas ─────────
async function lista(env) {
  const arbol = await ghJson(env, `/git/trees/${encodeURIComponent(rama(env))}?recursive=1`);
  const mapa = new Map();
  for (const e of arbol.tree || []) {
    const m = /^(reviews|blog)\/([a-z0-9-]+)\/(es|en|zh)\.md$/.exec(e.path);
    if (!m) continue;
    const clave = `${m[1]}/${m[2]}`;
    if (!mapa.has(clave)) mapa.set(clave, { tipo: m[1] === 'reviews' ? 'review' : 'nota', slug: m[2], idiomas: [] });
    mapa.get(clave).idiomas.push(m[3]);
  }
  return responder({ ok: true, entradas: [...mapa.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || a.slug.localeCompare(b.slug)) });
}

async function entrada(env, url) {
  const tipo = url.searchParams.get('tipo');
  const slug = url.searchParams.get('slug') || '';
  if (!TIPOS[tipo] || !SLUG.test(slug)) return responder({ ok: false, error: 'campos' }, 400);
  const dir = `${TIPOS[tipo]}/${slug}`;
  const [es, en, zh, imagenes] = await Promise.all(['es.md', 'en.md', 'zh.md', 'imagenes.json'].map((f) => leerArchivo(env, `${dir}/${f}`)));
  if (es === null && en === null && zh === null) return responder({ ok: false, error: 'noexiste' }, 404);
  let manifiesto = {};
  try { manifiesto = imagenes ? JSON.parse(imagenes) : {}; } catch { /* manifiesto roto: se ignora */ }
  return responder({ ok: true, es, en, zh, imagenes: manifiesto });
}

async function traducir(env, datos) {
  if (!env.ANTHROPIC_API_KEY) return responder({ ok: false, error: 'sin_traduccion' }, 503);
  const idioma = datos.idioma;
  if (idioma !== 'en' && idioma !== 'zh') return responder({ ok: false, error: 'campos' }, 400);
  const origen = {
    titulo: unaLinea(datos.titulo, 200), descripcion: unaLinea(datos.descripcion, 400),
    etiquetas: limpiarTags(datos.etiquetas), cuerpo: String(datos.cuerpo || '').slice(0, MAX_CUERPO),
  };
  if (!origen.titulo || !origen.cuerpo) return responder({ ok: false, error: 'campos' }, 400);
  const destino = idioma === 'en' ? 'English (natural, British spelling)' : 'Simplified Chinese (简体中文, natural and idiomatic)';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.TRANSLATE_MODEL || 'claude-sonnet-5-5',
      max_tokens: 16000,
      system: `You translate blog posts of a Spanish street photographer from Spanish into ${destino}. Keep the first-person voice and the tone. Keep the Markdown structure exactly (headings, lists, tables, bold, italics, horizontal rules). Image syntax ![alt](./file.jpg) must keep the path unchanged; translate the alt text and any italic caption line that follows an image. Do not translate product, brand or model names (e.g. TTArtisan AF 23mm F1.8) and keep numbers and units. Do not add or remove content. Reply with ONLY a JSON object {"titulo": string, "descripcion": string, "etiquetas": string[], "cuerpo": string} and nothing else.`,
      messages: [{ role: 'user', content: JSON.stringify(origen) }],
    }),
  });
  if (!r.ok) return responder({ ok: false, error: 'traduccion', detalle: `Anthropic ${r.status}` }, 502);
  const j = await r.json();
  const texto = (j.content || []).map((b) => b.text || '').join('');
  const a = texto.indexOf('{'), b = texto.lastIndexOf('}');
  let t;
  try { t = JSON.parse(texto.slice(a, b + 1)); } catch { return responder({ ok: false, error: 'traduccion', detalle: 'respuesta no válida' }, 502); }
  return responder({
    ok: true, titulo: unaLinea(t.titulo, 200), descripcion: unaLinea(t.descripcion, 400),
    etiquetas: limpiarTags(t.etiquetas), cuerpo: String(t.cuerpo || '').slice(0, MAX_CUERPO),
  });
}

async function publicar(env, datos) {
  const tipo = datos.tipo;
  const slug = String(datos.slug || '');
  if (!TIPOS[tipo] || !SLUG.test(slug) || slug.length > 60) return responder({ ok: false, error: 'slug' }, 400);
  const fecha = String(datos.fecha || '');
  if (!FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) return responder({ ok: false, error: 'fecha' }, 400);
  const dir = `${TIPOS[tipo]}/${slug}`;

  // textos por idioma
  const textos = {};
  for (const l of IDIOMAS) {
    const d = datos.idiomas && datos.idiomas[l];
    if (!d || !String(d.cuerpo || '').trim()) continue;
    const t = {
      titulo: unaLinea(d.titulo, 200), descripcion: unaLinea(d.descripcion, 400),
      cuerpo: String(d.cuerpo).replace(/\r/g, '').slice(0, MAX_CUERPO + 1), tags: limpiarTags(d.etiquetas),
      marca: unaLinea(d.marca, 60), producto: unaLinea(d.producto, 100), traducido: l !== 'es' && d.traducido === true,
    };
    if (t.cuerpo.length > MAX_CUERPO) return responder({ ok: false, error: 'largo', idioma: l }, 400);
    if (!t.titulo || !t.descripcion) return responder({ ok: false, error: 'campos', idioma: l }, 400);
    if (tipo === 'review' && (!t.marca || !t.producto)) return responder({ ok: false, error: 'campos', idioma: l }, 400);
    textos[l] = t;
  }
  if (!textos.es) return responder({ ok: false, error: 'sin_es' }, 400);

  // fotos nuevas (el navegador ya las ha reducido y les ha quitado el EXIF)
  const nuevas = Array.isArray(datos.fotos) ? datos.fotos : [];
  const vistas = new Set();
  let blobs = 0;
  for (const f of nuevas) {
    if (!f || !NOMBRE_FOTO.test(f.nombre) || vistas.has(f.nombre)) return responder({ ok: false, error: 'foto' }, 400);
    vistas.add(f.nombre);
    if (!Array.isArray(f.variantes) || !f.variantes.length || !(f.w > 0) || !(f.h > 0)) return responder({ ok: false, error: 'foto' }, 400);
    for (const v of f.variantes) {
      if (!(v.ancho >= 300 && v.ancho <= 3000) || typeof v.datos !== 'string' || v.datos.length > 3.5e6 || !/^[A-Za-z0-9+/=]+$/.test(v.datos)) return responder({ ok: false, error: 'foto' }, 400);
      blobs++;
    }
  }
  if (blobs > MAX_BLOBS) return responder({ ok: false, error: 'demasiadas_fotos' }, 400);

  // ¿existe ya?
  const existente = await leerArchivo(env, `${dir}/es.md`);
  if (datos.nuevo === true && existente !== null) return responder({ ok: false, error: 'existe' }, 409);

  let manifiesto = {};
  const previo = await leerArchivo(env, `${dir}/imagenes.json`);
  if (previo) { try { manifiesto = JSON.parse(previo); } catch { manifiesto = {}; } }
  for (const f of nuevas) {
    const anchos = [...new Set(f.variantes.map((v) => Math.round(v.ancho)))].sort((a, b) => a - b);
    manifiesto[f.nombre] = { base: f.nombre.replace(/\.jpg$/, ''), w: Math.round(f.w), h: Math.round(f.h), anchos, ext: 'jpg' };
  }
  const cover = datos.cover ? String(datos.cover) : '';
  if (cover && !manifiesto[cover]) return responder({ ok: false, error: 'cover' }, 400);
  if (tipo === 'review' && !cover) return responder({ ok: false, error: 'cover' }, 400);
  // toda foto citada en un texto tiene que existir
  for (const t of Object.values(textos)) {
    for (const m of t.cuerpo.matchAll(/!\[[^\]]*\]\(\.\/([^)\s]+)\)/g)) if (!manifiesto[m[1]]) return responder({ ok: false, error: 'foto_citada', detalle: m[1] }, 400);
  }

  // un solo commit con todo
  const rm = rama(env);
  const ref = await ghJson(env, `/git/ref/heads/${encodeURIComponent(rm)}`);
  const base = await ghJson(env, `/git/commits/${ref.object.sha}`);
  const entradasArbol = [];
  for (const [l, t] of Object.entries(textos)) {
    entradasArbol.push({
      path: `${dir}/${l}.md`, mode: '100644', type: 'blob',
      content: `${cabecera({ tipo, titulo: t.titulo, descripcion: t.descripcion, fecha, marca: t.marca, producto: t.producto, cover, tags: t.tags, traducido: t.traducido })}\n${t.cuerpo.trim()}\n`,
    });
  }
  entradasArbol.push({ path: `${dir}/imagenes.json`, mode: '100644', type: 'blob', content: `${JSON.stringify(manifiesto, null, 1)}\n` });
  const subidas = [];
  for (const f of nuevas) {
    for (const v of f.variantes) {
      subidas.push(ghJson(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: v.datos, encoding: 'base64' }) }).then((b) => {
        entradasArbol.push({ path: `site/img/${dir}/${f.nombre.replace(/\.jpg$/, '')}-${Math.round(v.ancho)}.jpg`, mode: '100644', type: 'blob', sha: b.sha });
      }));
    }
  }
  await Promise.all(subidas);
  const arbol = await ghJson(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree: entradasArbol }) });
  const etiqueta = tipo === 'review' ? 'Review' : 'Nota';
  const commit = await ghJson(env, '/git/commits', {
    method: 'POST',
    body: JSON.stringify({ message: `${etiqueta}: ${textos.es.titulo} (desde el panel)`, tree: arbol.sha, parents: [ref.object.sha] }),
  });
  await ghJson(env, `/git/refs/heads/${encodeURIComponent(rm)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
  const ruta = tipo === 'review' ? `/reviews/${slug}/` : `/blog/${slug}/`;
  return responder({ ok: true, ruta, idiomas: Object.keys(textos), commit: commit.sha });
}

// ───────── Entrada ─────────
export async function manejarAdmin(request, env) {
  if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) return responder({ ok: false, error: 'config' }, 503);
  const url = new URL(request.url);
  const metodo = request.method;
  if (metodo !== 'GET' && metodo !== 'POST') return responder({ ok: false, error: 'metodo' }, 405);

  // solo desde esta misma web
  const origen = request.headers.get('origin');
  if (origen) {
    try { if (new URL(origen).host !== url.host) return responder({ ok: false, error: 'origen' }, 403); } catch { return responder({ ok: false, error: 'origen' }, 403); }
  } else if (metodo === 'POST') {
    return responder({ ok: false, error: 'origen' }, 403);
  }

  if (!(await igual(request.headers.get('x-admin-password') || '', env.ADMIN_PASSWORD))) {
    await dormir(1500); // frena los intentos de adivinar la contraseña
    return responder({ ok: false, error: 'clave' }, 401);
  }

  const ruta = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
  try {
    if (metodo === 'GET' && ruta === 'lista') return await lista(env);
    if (metodo === 'GET' && ruta === 'entrada') return await entrada(env, url);
    if (metodo === 'POST' && (ruta === 'traducir' || ruta === 'publicar')) {
      if (!(request.headers.get('content-type') || '').includes('application/json')) return responder({ ok: false, error: 'formato' }, 415);
      if (Number(request.headers.get('content-length') || 0) > 40e6) return responder({ ok: false, error: 'tamano' }, 413);
      let datos;
      try { datos = await request.json(); } catch { return responder({ ok: false, error: 'formato' }, 400); }
      if (!datos || typeof datos !== 'object') return responder({ ok: false, error: 'formato' }, 400);
      return ruta === 'traducir' ? await traducir(env, datos) : await publicar(env, datos);
    }
    return responder({ ok: false, error: 'ruta' }, 404);
  } catch (e) {
    return responder({ ok: false, error: 'servidor', detalle: String(e && e.message ? e.message : e).slice(0, 300) }, 502);
  }
}
