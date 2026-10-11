// Worker de shandevilla.com: sirve la carpeta site/ (archivos estáticos, con _headers y _redirects)
// y solo ejecuta código en /api/*, donde atiende el formulario de contacto.
import { onRequestPost } from './functions/api/contacto.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/contacto') {
      if (request.method === 'POST') return onRequestPost({ request, env });
      return new Response(JSON.stringify({ ok: false, error: 'metodo' }), { status: 405, headers: { 'content-type': 'application/json', allow: 'POST' } });
    }
    return env.ASSETS.fetch(request);
  },
};
