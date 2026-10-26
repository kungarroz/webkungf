/* Shande Villa · selector de idioma, menú, formulario y animaciones. Sin dependencias.
   El español vive en el HTML; chino e inglés se leen de i18n/zh.json e i18n/en.json. */
(function () {
  'use strict';

  // la misma huella que lleva este script (?v=…) para no leer un JSON viejo de la caché
  var VERSION = '';
  try { var m = /[?&]v=([0-9a-f]+)/.exec(document.currentScript.src); VERSION = m ? '?v=' + m[1] : ''; } catch (e) {}
  var LANG_HTML = { es: 'es', zh: 'zh-Hans', en: 'en' };
  var LANG_FECHA = { es: 'es-ES', zh: 'zh-CN', en: 'en-GB' };
  var raiz = document.documentElement;
  var originales = [];           // texto y atributos en español de cada nodo traducible
  var diccionarios = {};         // idioma -> {clave: texto}
  var actual = 'es';
  var meta = document.querySelector('meta[name="description"]');
  var tituloEs = document.title;
  var descripcionEs = meta ? meta.getAttribute('content') : '';

  function guardarOriginales() {
    var nodos = document.querySelectorAll('[data-i18n], [data-i18n-attr]');
    Array.prototype.forEach.call(nodos, function (el) {
      var registro = { el: el, texto: null, attrs: [] };
      if (el.hasAttribute('data-i18n')) { registro.texto = el.textContent; }
      if (el.hasAttribute('data-i18n-attr')) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (par) {
          var p = par.split(':');
          if (p.length === 2) { registro.attrs.push({ attr: p[0].trim(), clave: p[1].trim(), es: el.getAttribute(p[0].trim()) }); }
        });
      }
      originales.push(registro);
    });
    Array.prototype.forEach.call(document.querySelectorAll('img[data-rollo]'), function (img) {
      originales.push({ el: img, texto: null, attrs: [{ attr: 'alt', clave: null, es: img.getAttribute('alt') }] });
    });
  }

  function cargar(l) {
    if (l === 'es') { return Promise.resolve(null); }
    if (diccionarios[l]) { return Promise.resolve(diccionarios[l]); }
    return fetch('i18n/' + l + '.json' + VERSION).then(function (r) {
      if (!r.ok) { throw new Error('HTTP ' + r.status); }
      return r.json();
    }).then(function (d) { diccionarios[l] = d; return d; });
  }

  function fuenteChina(l) {
    // Con chino se espera (máx. 1,2 s) a la fuente para no enseñar el texto con otra tipografía y cambiarla luego
    if (l !== 'zh' || !document.fonts || !document.fonts.load) { return Promise.resolve(); }
    var limite = new Promise(function (ok) { setTimeout(ok, 1200); });
    raiz.setAttribute('lang', LANG_HTML.zh); // activa la familia "SV Han" antes de pedirla
    return Promise.race([document.fonts.load('400 1em "SV Han"', '在'), limite]).catch(function () {});
  }

  function fechas(l) {
    var formato;
    try { formato = new Intl.DateTimeFormat(LANG_FECHA[l], { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return; }
    Array.prototype.forEach.call(document.querySelectorAll('time.fecha[datetime]'), function (t) {
      var d = new Date(t.getAttribute('datetime'));
      if (!isNaN(d)) { t.textContent = formato.format(d); }
    });
  }

  function aplicar(l, dic) {
    raiz.setAttribute('lang', LANG_HTML[l]);
    originales.forEach(function (o) {
      if (o.texto !== null) {
        var t = dic ? dic[o.el.getAttribute('data-i18n')] : o.texto;
        if (typeof t === 'string') { o.el.textContent = t; }
      }
      o.attrs.forEach(function (a) {
        var valor = a.es;
        if (dic) {
          if (a.clave) { valor = dic[a.clave] || a.es; }
          else if (o.el.hasAttribute('data-rollo')) {            // alt de la hoja de contactos: «Rollo · n»
            valor = (dic[o.el.getAttribute('data-rollo')] || '') + ' · ' + o.el.getAttribute('data-n');
          }
        }
        if (valor !== null) { o.el.setAttribute(a.attr, valor); }
      });
    });
    document.title = dic && dic['meta.title'] ? dic['meta.title'] : tituloEs;
    if (meta) { meta.setAttribute('content', dic && dic['meta.description'] ? dic['meta.description'] : descripcionEs); }
    fechas(l);
    var rv = document.querySelector('a[data-reviews]');
    if (rv) { rv.setAttribute('href', l === 'es' ? '/reviews/' : '/' + l + '/reviews/'); }
    var pf = document.querySelector('a[data-portfolio]');
    if (pf) { pf.setAttribute('href', l === 'es' ? '/portfolio/' : '/' + l + '/portfolio/'); }
    Array.prototype.forEach.call(document.querySelectorAll('.idioma button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-idioma') === l ? 'true' : 'false');
    });
    actual = l;
    raiz.classList.remove('i18n-espera');
  }

  function cambiar(l, recordar) {
    return cargar(l).then(function (dic) {
      return fuenteChina(l).then(function () { aplicar(l, dic); });
    }).then(function () {
      if (recordar) { try { localStorage.setItem('sv-idioma', l); } catch (e) {} }
    }).catch(function () {
      // si no se puede cargar el idioma, la página sigue en el que estaba
      raiz.setAttribute('lang', LANG_HTML[actual]);
      raiz.classList.remove('i18n-espera');
    });
  }

  guardarOriginales();
  Array.prototype.forEach.call(document.querySelectorAll('.idioma button'), function (b) {
    b.addEventListener('click', function () {
      var l = b.getAttribute('data-idioma');
      if (l !== actual) { cambiar(l, true); }
    });
  });
  fechas('es');
  var inicial = window.__svIdioma || 'es';
  if (inicial !== 'es') { cambiar(inicial, false); }

  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lo que está más abajo aparece al llegar a ello */
  if (!sinMovimiento && 'IntersectionObserver' in window) {
    var aparecen = Array.prototype.slice.call(document.querySelectorAll('.pagina > section:not(.portada) > .titulo, .enlaces .grupo, .contacto > p'));
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); vigia.unobserve(e.target); }
      });
    }, { threshold: 0 });
    aparecen.forEach(function (el, i) { el.classList.add('revela'); el.style.transitionDelay = (i % 3) * 80 + 'ms'; vigia.observe(el); });
  }

  /* Menú: marca la sección en la que estás */
  var enlacesMenu = Array.prototype.slice.call(document.querySelectorAll('.menu a[href^="#"]'));
  function marcar(id) {
    enlacesMenu.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
  }
  if ('IntersectionObserver' in window) {
    var espia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { marcar(e.target.id); } });
    }, { rootMargin: '-30% 0px -60% 0px' });
    enlacesMenu.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) { espia.observe(s); }
    });
  }
  enlacesMenu.forEach(function (a) { a.addEventListener('click', function () { marcar(a.getAttribute('href').slice(1)); }); });

  /* ───────── Formulario de contacto ─────────
     El mensaje va a /api/contacto (una función de Cloudflare que comprueba el captcha y reenvía a tu correo).
     El script del captcha (Cloudflare Turnstile) NO se carga hasta que alguien abre la ventana. */
  var ventana = document.getElementById('formulario');
  var abrirForm = document.getElementById('abrir-contacto');
  if (ventana && abrirForm && typeof ventana.showModal === 'function') {
    var formu = document.getElementById('f-form');
    var estado = document.getElementById('f-estado');
    var alternativa = document.getElementById('f-alt');
    var zonaCaptcha = document.getElementById('f-captcha');
    var botonEnviar = formu.querySelector('.f-enviar');
    var claveSitio = zonaCaptcha.getAttribute('data-sitekey') || '';
    var configurado = /^[0-9A-Za-z_-]{8,}$/.test(claveSitio) && claveSitio.indexOf('TU_') !== 0;
    var MSG = {
      enviando: 'Enviando…', ok: 'Mensaje recibido. Te responderé lo antes posible; también puedes escribirme por mis redes sociales.', captcha: 'Marca primero la verificación.',
      campos: 'Revisa el email y rellena todos los campos.', servidor: 'No se ha podido enviar. Inténtalo de nuevo en un rato.',
      config: 'El formulario todavía no está activado.', carga: 'No se ha podido cargar la verificación.'
    };
    var tokenCaptcha = '', widget = null, scriptCaptcha = null, enviando = false;
    var IDIOMA_CAPTCHA = { es: 'es', zh: 'zh-cn', en: 'en' };

    var mensaje = function (clave) {
      var d = diccionarios[actual];
      return (actual !== 'es' && d && d['form.msg.' + clave]) || MSG[clave];
    };
    var decir = function (clave, error) {
      estado.textContent = clave ? mensaje(clave) : '';
      estado.classList.toggle('error', !!error);
      alternativa.hidden = !error;
    };
    var cargarCaptcha = function () {
      if (window.turnstile) { return Promise.resolve(); }
      if (scriptCaptcha) { return scriptCaptcha; }
      scriptCaptcha = new Promise(function (ok, fallo) {
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        s.async = true; s.onload = ok;
        s.onerror = function () { scriptCaptcha = null; fallo(new Error('turnstile')); };
        document.head.appendChild(s);
      });
      return scriptCaptcha;
    };
    var reiniciarCaptcha = function () { tokenCaptcha = ''; if (widget !== null && window.turnstile) { window.turnstile.reset(widget); } };
    var pintarCaptcha = function () {
      if (!configurado) { decir('config', true); return; }
      cargarCaptcha().then(function () {
        if (widget !== null) { window.turnstile.reset(widget); return; }
        widget = window.turnstile.render(zonaCaptcha, {
          sitekey: claveSitio, theme: 'dark', size: 'flexible', language: IDIOMA_CAPTCHA[actual] || 'es',
          callback: function (t) { tokenCaptcha = t; decir(''); },
          'expired-callback': function () { tokenCaptcha = ''; },
          'error-callback': function () { tokenCaptcha = ''; decir('carga', true); }
        });
      }).catch(function () { decir('carga', true); });
    };

    abrirForm.addEventListener('click', function () {
      decir('');
      raiz.classList.add('formulario-abierto');
      ventana.showModal();
      pintarCaptcha();
    });
    ventana.addEventListener('close', function () { raiz.classList.remove('formulario-abierto'); });
    ventana.querySelector('.f-cerrar').addEventListener('click', function () { ventana.close(); });
    ventana.addEventListener('click', function (e) { if (e.target === ventana) { ventana.close(); } }); // clic fuera = cerrar

    formu.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enviando) { return; }
      if (!formu.checkValidity()) {
        decir('campos', true);
        var invalido = formu.querySelector(':invalid');
        if (invalido) { invalido.focus(); }
        return;
      }
      if (!configurado) { decir('config', true); return; }
      if (!tokenCaptcha) { decir('captcha', true); return; }
      enviando = true; botonEnviar.setAttribute('aria-disabled', 'true'); decir('enviando', false);
      fetch('/api/contacto', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: formu.elements.email.value, asunto: formu.elements.asunto.value, mensaje: formu.elements.mensaje.value,
          web: formu.elements.web.value, token: tokenCaptcha
        })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok === true, error: j.error, http: r.status }; });
      }).then(function (r) {
        if (r.ok) { formu.reset(); decir('ok', false); }
        else {
          var clave = r.error === 'captcha' || r.error === 'campos' || r.error === 'config' ? r.error : 'servidor';
          decir(clave, true);
          if (clave === 'servidor') { estado.textContent += ' [' + (r.error || 'error') + ' ' + r.http + ']'; }
        }
        reiniciarCaptcha();
      }).catch(function () { decir('servidor', true); estado.textContent += ' [red]'; reiniciarCaptcha(); })
        .then(function () { enviando = false; botonEnviar.removeAttribute('aria-disabled'); });
    });
  }
})();

/* Transición entre páginas: sin soporte de View Transitions, un fundido corto al salir */
(function () {
  if ('CSSViewTransitionRule' in window || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { return; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target || a.hasAttribute('download')) { return; }
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname) { return; }
    e.preventDefault();
    document.documentElement.classList.add('saliendo');
    setTimeout(function () { location.href = a.href; }, 180);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { document.documentElement.classList.remove('saliendo'); } });
})();
