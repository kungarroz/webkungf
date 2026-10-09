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
  function elegir(id, enfocar, desplazar) {
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
        p.classList.remove('entra'); void p.offsetWidth; p.classList.add('entra');
        actualizarCuenta(p);
      }
    });
  }
  if (pestanas.length) {
    elegir(pestanas[0].id.replace('tab-', ''), false);
    pestanas.forEach(function (b, i) {
      b.addEventListener('click', function () { elegir(b.id.replace('tab-', ''), false, true); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') { n = (i + 1) % pestanas.length; }
        else if (e.key === 'ArrowLeft') { n = (i - 1 + pestanas.length) % pestanas.length; }
        else if (e.key === 'Home') { n = 0; } else if (e.key === 'End') { n = pestanas.length - 1; }
        if (n !== null) { e.preventDefault(); elegir(pestanas[n].id.replace('tab-', ''), true); }
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
