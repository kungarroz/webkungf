/* Portfolio: filtros plegados (serie y objetivo), sin recargar, y las fotos que «se revelan» al cargar.
   Sin JavaScript se ven todas las fotos y no aparece el botón de filtrar. */
(function () {
  var raiz = document.querySelector('.portfolio');
  if (!raiz) { return; }
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var boton = raiz.querySelector('.pf-filtrar');
  var panel = raiz.querySelector('.pf-panel');
  var items = Array.prototype.slice.call(raiz.querySelectorAll('.mosaico li'));
  var cuenta = raiz.querySelector('.filtro-cuenta');
  var numero = raiz.querySelector('.pf-n');
  var activos = raiz.querySelector('.pf-activos');
  var vacio = raiz.querySelector('.sin-fotos');
  var opciones = Array.prototype.slice.call(raiz.querySelectorAll('.pf-panel button[data-f]'));
  var estado = {};
  opciones.forEach(function (c) { estado[c.getAttribute('data-f')] = 'todas'; });
  var grupos = Object.keys(estado);

  /* revelado: cada foto aparece como en la cubeta, de clara y velada a nítida */
  if (!quieto) {
    raiz.classList.add('revelando');
    Array.prototype.forEach.call(raiz.querySelectorAll('.mosaico img'), function (img) {
      var listo = function () { img.classList.add('revelada'); };
      if (img.complete && img.naturalWidth) { img.classList.add('revelada', 'sin-transicion'); }
      else { img.addEventListener('load', listo); img.addEventListener('error', listo); }
    });
  }

  function abrir(si) {
    boton.setAttribute('aria-expanded', si ? 'true' : 'false');
    boton.querySelector('.pf-filtrar-txt').textContent = boton.getAttribute(si ? 'data-cerrar' : 'data-abrir');
    panel.hidden = !si;
  }

  function aplicar(animar) {
    var n = 0;
    items.forEach(function (li) {
      var ok = grupos.every(function (g) { return estado[g] === 'todas' || li.getAttribute('data-' + g) === estado[g]; });
      li.hidden = !ok;
      li.classList.remove('entra');
      if (ok) {
        if (animar && !quieto && n < 24) { li.style.setProperty('--i', n); void li.offsetWidth; li.classList.add('entra'); }
        n++;
      }
    });
    var nombres = [];
    opciones.forEach(function (c) {
      var activo = estado[c.getAttribute('data-f')] === c.getAttribute('data-v');
      c.setAttribute('aria-pressed', activo ? 'true' : 'false');
      if (activo && c.getAttribute('data-v') !== 'todas') { nombres.push(c.querySelector('.op-nombre').textContent); }
    });
    numero.textContent = n === 1 ? cuenta.getAttribute('data-uno') : cuenta.getAttribute('data-plantilla').replace('{n}', n);
    activos.textContent = nombres.length ? ' · ' + nombres.join(' · ') : '';
    vacio.hidden = n !== 0;
    try { history.replaceState(null, '', estado.serie && estado.serie !== 'todas' ? '#' + estado.serie : location.pathname + location.search); } catch (e) {}
  }

  boton.hidden = false;
  boton.addEventListener('click', function () { abrir(panel.hidden); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { abrir(false); boton.focus(); } });
  opciones.forEach(function (c) {
    c.addEventListener('click', function () {
      estado[c.getAttribute('data-f')] = c.getAttribute('data-v');
      aplicar(true);
    });
  });
  var quitar = raiz.querySelector('[data-quitar]');
  if (quitar) { quitar.addEventListener('click', function () { grupos.forEach(function (g) { estado[g] = 'todas'; }); aplicar(true); }); }

  var inicial = (location.hash || '').replace('#', '');
  if (inicial && opciones.some(function (c) { return c.getAttribute('data-f') === 'serie' && c.getAttribute('data-v') === inicial; })) { estado.serie = inicial; }
  aplicar(false);
})();
