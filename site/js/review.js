/* Páginas de reviews: recuerda el idioma en el que estás para que la portada se abra igual. */
(function () {
  var l = document.documentElement.getAttribute('lang');
  var codigo = l === 'zh-Hans' ? 'zh' : (l === 'en' ? 'en' : 'es');
  try { localStorage.setItem('sv-idioma', codigo); } catch (e) {}
})();
