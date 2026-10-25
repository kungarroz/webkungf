/* Portfolio: filtros por serie y objetivo (sin recargar). Sin JavaScript se ven todas las fotos. */
(function () {
  var raiz = document.querySelector('.portfolio');
  if (!raiz) { return; }
  var filtros = raiz.querySelector('.filtros');
  var items = Array.prototype.slice.call(raiz.querySelectorAll('.mosaico li'));
  var cuenta = raiz.querySelector('.filtro-cuenta');
  var vacio = raiz.querySelector('.sin-fotos');
  var chips = Array.prototype.slice.call(raiz.querySelectorAll('.chip'));
  var estado = {};
  chips.forEach(function (c) { estado[c.getAttribute('data-f')] = 'todas'; });
  var grupos = Object.keys(estado);
  filtros.hidden = false;

  function aplicar() {
    var n = 0;
    items.forEach(function (li) {
      var ok = grupos.every(function (g) { return estado[g] === 'todas' || li.getAttribute('data-' + g) === estado[g]; });
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
  if (quitar) { quitar.addEventListener('click', function () { grupos.forEach(function (g) { estado[g] = 'todas'; }); aplicar(); }); }

  var inicial = (location.hash || '').replace('#', '');
  if (inicial && chips.some(function (c) { return c.getAttribute('data-f') === 'serie' && c.getAttribute('data-v') === inicial; })) { estado.serie = inicial; }
  aplicar();
})();
