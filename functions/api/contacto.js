// Formulario de contacto · Cloudflare Pages Function  →  POST /api/contacto
//
// Recibe {email, asunto, mensaje, web, token}, comprueba el captcha de Cloudflare (Turnstile) EN EL SERVIDOR
// y reenvía el mensaje a tu correo con Resend. Tu dirección NUNCA está en el código ni en la web:
// vive solo en variables secretas del panel de Cloudflare Pages.
//
// Variables (Settings → Variables and Secrets del proyecto de Pages; las tres, como «Secret»):
//   TURNSTILE_SECRET   clave secreta del widget de Turnstile
//   RESEND_API_KEY     clave de API de Resend
//   CONTACT_TO         correo donde quieres recibir los mensajes (varios, separados por comas)
// Opcional:
//   CONTACT_FROM       remitente, p. ej.  Shande Villa <contacto@tudominio.com>  (por defecto, el de pruebas de Resend,
//                      que solo entrega al correo con el que abriste la cuenta de Resend)

const LIMITES = { email: 254, asunto: 120, mensaje: 4000 };
const EMAIL = /^[^\s@<>"',;:\\]+@[^\s@<>"',;:\\]+\.[^\s@<>"',;:\\]{2,}$/;

const responder = (cuerpo, estado = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Se construyen con RegExp y secuencias escapadas para que ningún editor las convierta en caracteres reales
const CONTROL_UNA_LINEA = new RegExp('[\\u0000-\\u001f\\u007f\\u2028\\u2029]+', 'g');
const CONTROL_VARIAS_LINEAS = new RegExp('[\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]', 'g');

const limpiar = (texto, max, unaLinea) => {
  let t = typeof texto === 'string' ? texto.normalize('NFC') : '';
  // fuera caracteres de control (y saltos de línea en los campos de una sola línea)
  t = unaLinea ? t.replace(CONTROL_UNA_LINEA, ' ') : t.replace(CONTROL_VARIAS_LINEAS, '');
  return t.trim().slice(0, max + 1); // un carácter de más para poder detectar el exceso
};

export async function onRequestPost({ request, env }) {
  if (!env.TURNSTILE_SECRET || !env.RESEND_API_KEY || !env.CONTACT_TO) {
    return responder({ ok: false, error: 'config' }, 503);
  }

  // solo se aceptan peticiones que vengan de esta misma web
  try {
    const origen = request.headers.get('origin');
    if (!origen || new URL(origen).host !== new URL(request.url).host) return responder({ ok: false, error: 'origen' }, 403);
  } catch {
    return responder({ ok: false, error: 'origen' }, 403);
  }

  if (!(request.headers.get('content-type') || '').includes('application/json')) return responder({ ok: false, error: 'formato' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 20000) return responder({ ok: false, error: 'tamano' }, 413);

  let datos;
  try {
    datos = await request.json();
  } catch {
    return responder({ ok: false, error: 'formato' }, 400);
  }
  if (!datos || typeof datos !== 'object') return responder({ ok: false, error: 'formato' }, 400);

  // trampa para robots: un campo oculto que una persona no rellena. Se les dice que ha ido bien y no se envía nada.
  if (typeof datos.web === 'string' && datos.web.trim() !== '') return responder({ ok: true });

  const email = limpiar(datos.email, LIMITES.email, true);
  const asunto = limpiar(datos.asunto, LIMITES.asunto, true);
  const mensaje = limpiar(datos.mensaje, LIMITES.mensaje, false);
  if (!EMAIL.test(email) || email.length > LIMITES.email || !asunto || asunto.length > LIMITES.asunto || !mensaje || mensaje.length > LIMITES.mensaje) {
    return responder({ ok: false, error: 'campos' }, 400);
  }

  // captcha de Cloudflare
  const token = typeof datos.token === 'string' ? datos.token.slice(0, 2048) : '';
  if (!token) return responder({ ok: false, error: 'captcha' }, 400);
  let verificacion;
  try {
    const cuerpo = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
    const ip = request.headers.get('cf-connecting-ip');
    if (ip) cuerpo.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: cuerpo });
    verificacion = await r.json();
  } catch {
    return responder({ ok: false, error: 'servidor' }, 502);
  }
  if (!verificacion || verificacion.success !== true) return responder({ ok: false, error: 'captcha' }, 400);

  // envío
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM || 'Shande Villa <onboarding@resend.dev>',
        to: String(env.CONTACT_TO).split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject: `[shandevilla.com] ${asunto}`,
        text: `De: ${email}\n\n${mensaje}\n\n—\nEnviado desde el formulario de shandevilla.com. Responde a este correo para contestar a quien escribe.`,
      }),
    });
    if (!r.ok) return responder({ ok: false, error: 'servidor' }, 502);
  } catch {
    return responder({ ok: false, error: 'servidor' }, 502);
  }
  return responder({ ok: true });
}

// cualquier otro método
export const onRequest = () => responder({ ok: false, error: 'metodo' }, 405);
