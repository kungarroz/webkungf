/* Shande Villa · selector de idioma y visor de fotos. Sin dependencias.
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

  /* ───────── Carretes: pestañas, flechas, arrastre y contador ───────── */
  var pestanas = Array.prototype.slice.call(document.querySelectorAll('.selector-carrete [role="tab"]'));
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.rollo'));
  var sinMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function marco(carrete) { // tamaños de cada fotograma, para el contador y las flechas
    return Array.prototype.slice.call(carrete.querySelectorAll('.foto'));
  }
  function actualizarCuenta(panel) {
    var carrete = panel.querySelector('.carrete'), fotos = marco(carrete);
    var centro = carrete.scrollLeft + carrete.clientWidth / 2, mejor = 0, d = Infinity;
    fotos.forEach(function (f, i) {
      var dist = Math.abs(f.offsetLeft + f.offsetWidth / 2 - centro);
      if (dist < d) { d = dist; mejor = i; }
    });
    if (carrete.scrollLeft < 8) { mejor = 0; }
    if (carrete.scrollLeft + carrete.clientWidth >= carrete.scrollWidth - 8) { mejor = fotos.length - 1; }
    panel.querySelector('.cuenta').textContent = (mejor + 1) + ' / ' + fotos.length;
  }
  function avanzar(panel, sentido) {
    var carrete = panel.querySelector('.carrete'), fotos = marco(carrete), x = carrete.scrollLeft, destino = null;
    if (sentido > 0) {
      for (var i = 0; i < fotos.length; i++) { if (fotos[i].offsetLeft - 16 > x + 6) { destino = fotos[i].offsetLeft - 16; break; } }
      if (destino === null) { destino = carrete.scrollWidth; }
    } else {
      for (var j = fotos.length - 1; j >= 0; j--) { if (fotos[j].offsetLeft - 16 < x - 6) { destino = fotos[j].offsetLeft - 16; break; } }
      if (destino === null) { destino = 0; }
    }
    carrete.scrollTo({ left: destino, behavior: sinMovimiento ? 'auto' : 'smooth' });
  }
  function elegir(id, enfocar, desplazar, animar) {
    pestanas.forEach(function (b) {
      var activa = b.id === 'tab-' + id;
      b.setAttribute('aria-selected', activa ? 'true' : 'false');
      b.tabIndex = activa ? 0 : -1;
      if (activa) { if (enfocar) { b.focus(); } if (desplazar && b.scrollIntoView) { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } }
    });
    paneles.forEach(function (p) {
      var es = p.id === 'panel-' + id;
      p.hidden = !es;
      if (es) {
        p.querySelector('.carrete').scrollLeft = 0;
        p.classList.remove('entra');
        if (animar) { void p.offsetWidth; p.classList.add('entra'); }
        actualizarCuenta(p);
      }
    });
  }
  if (pestanas.length) {
    elegir(pestanas[0].id.replace('tab-', ''), false, false, false);
    pestanas.forEach(function (b, i) {
      b.addEventListener('click', function () { elegir(b.id.replace('tab-', ''), false, true, true); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') { n = (i + 1) % pestanas.length; }
        else if (e.key === 'ArrowLeft') { n = (i - 1 + pestanas.length) % pestanas.length; }
        else if (e.key === 'Home') { n = 0; } else if (e.key === 'End') { n = pestanas.length - 1; }
        if (n !== null) { e.preventDefault(); elegir(pestanas[n].id.replace('tab-', ''), true, false, true); }
      });
    });
  }
  paneles.forEach(function (panel) {
    var carrete = panel.querySelector('.carrete'), ticking = false;
    carrete.addEventListener('scroll', function () {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; actualizarCuenta(panel); });
    }, { passive: true });
    panel.querySelector('.ant').addEventListener('click', function () { avanzar(panel, -1); });
    panel.querySelector('.sig').addEventListener('click', function () { avanzar(panel, 1); });
    carrete.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); avanzar(panel, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); avanzar(panel, -1); }
    });
    // con ratón se arrastra el carrete; con el dedo ya se desliza solo
    var x0 = null, s0 = 0, movido = false;
    carrete.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) { return; }
      x0 = e.clientX; s0 = carrete.scrollLeft; movido = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (x0 === null) { return; }
      var dx = e.clientX - x0;
      if (!movido && Math.abs(dx) > 5) { movido = true; carrete.classList.add('arrastrando'); }
      if (movido) { carrete.scrollLeft = s0 - dx; }
    });
    window.addEventListener('pointerup', function () {
      if (x0 === null) { return; }
      x0 = null; carrete.classList.remove('arrastrando');
    });
    carrete.addEventListener('click', function (e) {
      if (movido) { e.preventDefault(); e.stopPropagation(); movido = false; }
    }, true);
  });

  /* El carrete entra deslizándose la primera vez que se ve (el único movimiento de la página) */
  var galeria = document.getElementById('fotos');
  if (galeria && !sinMovimiento && 'IntersectionObserver' in window) {
    var primera = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        primera.disconnect();
        var activo = paneles.filter(function (p) { return !p.hidden; })[0];
        if (activo) { activo.classList.remove('entra'); void activo.offsetWidth; activo.classList.add('entra'); }
      });
    }, { threshold: 0.25 });
    primera.observe(galeria);
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
      enviando: 'Enviando…', ok: 'Recibido. Te responderé yo.', captcha: 'Marca primero la verificación.',
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

  /* ───────── Visor de fotos ───────── */
  var visor = document.getElementById('visor');
  if (!visor || typeof visor.showModal !== 'function') { return; } // sin <dialog>: los enlaces abren la imagen

  var img = document.getElementById('visor-img');
  var cuenta = document.getElementById('visor-cuenta');
  var lista = [], i = 0;

  function mostrar() {
    var a = lista[i];
    var miniatura = a.querySelector('img');
    img.removeAttribute('srcset');
    img.setAttribute('sizes', '100vw');
    img.setAttribute('srcset', a.getAttribute('data-srcset'));
    img.src = a.getAttribute('href');
    img.width = +a.getAttribute('data-w');
    img.height = +a.getAttribute('data-h');
    img.alt = miniatura ? miniatura.alt : '';
    cuenta.textContent = (i + 1) + ' / ' + lista.length;
    var vecina = lista[(i + 1) % lista.length];
    if (vecina) { (new Image()).src = vecina.getAttribute('href'); }
  }
  function mover(d) { i = (i + d + lista.length) % lista.length; mostrar(); }
  function cerrar() { visor.close(); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.carrete a') : null;
    if (!a) { return; }
    e.preventDefault();
    lista = Array.prototype.slice.call(a.closest('.cinta').querySelectorAll('a'));
    i = lista.indexOf(a);
    mostrar();
    raiz.classList.add('visor-abierto');
    visor.showModal();
  });
  visor.addEventListener('close', function () { raiz.classList.remove('visor-abierto'); img.removeAttribute('src'); });
  visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
  visor.querySelector('.visor-ant').addEventListener('click', function () { mover(-1); });
  visor.querySelector('.visor-sig').addEventListener('click', function () { mover(1); });
  visor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { mover(-1); } else if (e.key === 'ArrowRight') { mover(1); }
  });
  visor.addEventListener('click', function (e) {          // clic fuera de la foto = cerrar
    if (e.target === visor || e.target.classList.contains('visor-foto')) { cerrar(); }
  });

  var x0 = null;
  var zona = visor.querySelector('.visor-foto');
  zona.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  zona.addEventListener('pointerup', function (e) {
    if (x0 === null) { return; }
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { mover(dx < 0 ? 1 : -1); }
  });
  zona.addEventListener('pointercancel', function () { x0 = null; });
})();
