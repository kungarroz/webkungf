/* Portfolio: filtros por serie y formato (sin recargar). Sin JavaScript se ven todas las fotos. */
(function () {
  var raiz = document.querySelector('.portfolio');
  if (!raiz) { return; }
  var filtros = raiz.querySelector('.filtros');
  var items = Array.prototype.slice.call(raiz.querySelectorAll('.mosaico li'));
  var cuenta = raiz.querySelector('.filtro-cuenta');
  var vacio = raiz.querySelector('.sin-fotos');
  var chips = Array.prototype.slice.call(raiz.querySelectorAll('.chip'));
  var estado = { serie: 'todas', formato: 'todas' };
  filtros.hidden = false;

  function aplicar() {
    var n = 0;
    items.forEach(function (li) {
      var ok = (estado.serie === 'todas' || li.getAttribute('data-serie') === estado.serie) &&
               (estado.formato === 'todas' || li.getAttribute('data-formato') === estado.formato);
      li.hidden = !ok;
      if (ok) { n++; }
    });
    chips.forEach(function (c) {
      c.setAttribute('aria-pressed', estado[c.getAttribute('data-f')] === c.getAttribute('data-v') ? 'true' : 'false');
    });
    cuenta.textContent = n === 1 ? cuenta.getAttribute('data-uno') : cuenta.getAttribute('data-plantilla').replace('{n}', n);
    vacio.hidden = n !== 0;
    try {
      var h = estado.serie === 'todas' ? location.pathname + location.search : '#' + estado.serie;
      history.replaceState(null, '', h);
    } catch (e) {}
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      estado[c.getAttribute('data-f')] = c.getAttribute('data-v');
      aplicar();
    });
  });
  var quitar = raiz.querySelector('[data-quitar]');
  if (quitar) { quitar.addEventListener('click', function () { estado.serie = 'todas'; estado.formato = 'todas'; aplicar(); }); }

  var inicial = (location.hash || '').replace('#', '');
  if (inicial && chips.some(function (c) { return c.getAttribute('data-f') === 'serie' && c.getAttribute('data-v') === inicial; })) { estado.serie = inicial; }
  aplicar();
})();
