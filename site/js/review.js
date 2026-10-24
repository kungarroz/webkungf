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
  var filas = Array.prototype.slice.call(document.querySelectorAll('.catalogo .filas li'));
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
