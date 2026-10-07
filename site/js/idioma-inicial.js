/* Se ejecuta antes de pintar: decide el idioma inicial y evita el parpadeo del español. */
(function () {
  var raiz = document.documentElement;
  raiz.classList.add('js');
  var idioma = null;
  try { idioma = localStorage.getItem('sv-idioma'); } catch (e) {}
  if (idioma !== 'es' && idioma !== 'zh' && idioma !== 'en') {
    var n = String(navigator.language || 'es').toLowerCase();
    idioma = n.indexOf('zh') === 0 ? 'zh' : (n.indexOf('en') === 0 ? 'en' : 'es');
  }
  window.__svIdioma = idioma;
  if (idioma !== 'es') {
    raiz.classList.add('i18n-espera');
    // red de seguridad: si algo falla, el texto en español se enseña igualmente
    setTimeout(function () { raiz.classList.remove('i18n-espera'); }, 2500);
  }
})();
