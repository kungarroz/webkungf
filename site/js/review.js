/* Páginas de reviews: recuerda el idioma en el que estás para que la portada se abra igual. */
(function () {
  var l = document.documentElement.getAttribute('lang');
  var codigo = l === 'zh-Hans' ? 'zh' : (l === 'en' ? 'en' : 'es');
  try { localStorage.setItem('sv-idioma', codigo); } catch (e) {}
})();

/* Buscador del catálogo: sin JavaScript se ve la lista entera y el campo no aparece */
(function () {
  var caja = document.querySelector('.buscador');
  var campo = document.getElementById('buscar-review');
  if (!caja || !campo) { return; }
  caja.hidden = false;
  var filas = Array.prototype.slice.call(document.querySelectorAll('[data-buscar]'));
  var grupos = Array.prototype.slice.call(document.querySelectorAll('.catalogo .marca-grupo'));
  var aviso = document.querySelector('.sin-resultados');
  campo.addEventListener('input', function () {
    var q = campo.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var visibles = 0;
    filas.forEach(function (li) {
      var texto = li.getAttribute('data-buscar') || '';
      var ok = q.every(function (p) { return texto.indexOf(p) !== -1; });
      li.hidden = !ok;
      if (ok) { visibles++; }
    });
    grupos.forEach(function (g) { g.hidden = !g.querySelector('li:not([hidden])'); });
    if (aviso) { aviso.hidden = visibles !== 0; }
  });
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

/* Visor de fotos: todas las fotos de la review se amplían y se recorren con flechas, teclado o deslizando */
(function () {
  var visor = document.getElementById('visor');
  var enlaces = Array.prototype.slice.call(document.querySelectorAll('a.zoom'));
  if (!visor || typeof visor.showModal !== 'function' || !enlaces.length) { return; }
  var raiz = document.documentElement;
  var img = document.getElementById('visor-img');
  var cuenta = document.getElementById('visor-cuenta');
  var texto = document.getElementById('visor-texto');
  var i = 0, lista = enlaces;
  function mostrar() {
    var a = lista[i], mini = a.querySelector('img');
    img.setAttribute('sizes', '100vw');
    img.setAttribute('srcset', a.getAttribute('data-srcset'));
    img.src = a.getAttribute('href');
    img.width = +a.getAttribute('data-w');
    img.height = +a.getAttribute('data-h');
    img.alt = mini ? mini.alt : '';
    texto.textContent = a.getAttribute('data-pie') || '';
    cuenta.textContent = (i + 1) + ' / ' + lista.length;
    var vecina = lista[(i + 1) % lista.length];
    if (vecina) { (new Image()).src = vecina.getAttribute('href'); }
  }
  function mover(d) { i = (i + d + lista.length) % lista.length; mostrar(); }
  enlaces.forEach(function (a, n) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // solo las fotos visibles (el portfolio las filtra)
      lista = enlaces.filter(function (x) { return !x.closest('[hidden]'); });
      i = lista.indexOf(a); mostrar();
      raiz.classList.add('visor-abierto');
      visor.showModal();
    });
  });
  visor.addEventListener('close', function () { raiz.classList.remove('visor-abierto'); img.removeAttribute('src'); });
  visor.querySelector('.visor-cerrar').addEventListener('click', function () { visor.close(); });
  visor.querySelector('.visor-ant').addEventListener('click', function () { mover(-1); });
  visor.querySelector('.visor-sig').addEventListener('click', function () { mover(1); });
  visor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { mover(-1); } else if (e.key === 'ArrowRight') { mover(1); }
  });
  visor.addEventListener('click', function (e) {
    if (e.target === visor || e.target.classList.contains('visor-foto')) { visor.close(); }
  });
  var x0 = null, zona = visor.querySelector('.visor-foto');
  zona.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
  zona.addEventListener('pointerup', function (e) {
    if (x0 === null) { return; }
    var dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { mover(dx < 0 ? 1 : -1); }
  });
  zona.addEventListener('pointercancel', function () { x0 = null; });
})();
