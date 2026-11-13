/* Panel de publicación (privado). Crea y edita reviews y notas hablando con /api/admin/*.
   Las fotos se reducen y se les quitan los datos EXIF en el propio navegador antes de subirlas. Sin dependencias. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var CLAVE = 'sv-admin-clave', BORRADOR = 'sv-admin-borrador';
  var MAX_FOTOS = 14;

  var clave = '';
  try { clave = sessionStorage.getItem(CLAVE) || ''; } catch (e) {}
  var existentes = [];           // entradas que ya hay en el repositorio
  var modo = 'nueva';            // 'nueva' | 'editar'
  var editando = null;           // { tipo, slug } al editar
  var fotos = [];                // { nombre, nueva, w, h, miniatura, variantes[], ext, base, anchos }
  var portada = '';
  var ultimoTexto = $('a-cuerpo-es');
  var traducciones = { en: false, zh: false };   // ¿el texto viene de la traducción automática?

  /* ───────── utilidades ───────── */
  function limpiarNombre(t) {
    return String(t).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function hoy() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function tipo() { return document.querySelector('input[name="tipo"]:checked').value; }
  function decir(el, texto, error) { el.textContent = texto || ''; el.classList.toggle('error', !!error); }
  function mensajeError(j) {
    var m = {
      clave: 'La contraseña no es correcta.', config: 'El panel todavía no está configurado en el servidor (faltan variables).',
      origen: 'La petición no viene de esta web.', formato: 'No se ha podido leer lo enviado.', tamano: 'Las fotos pesan demasiado: sube menos fotos de una vez.',
      slug: 'No se ha podido crear una dirección válida para la entrada.', fecha: 'La fecha no es válida.', sin_es: 'Falta el texto en español.',
      campos: 'Faltan campos obligatorios (título, descripción, texto' + ((j && j.idioma) ? ' en ' + j.idioma : '') + ', marca u objetivo).',
      largo: 'El texto es demasiado largo.', foto: 'Alguna foto no es válida.', demasiadas_fotos: 'Demasiadas fotos de una vez: sube menos y vuelve a publicar.',
      existe: 'Ya existe una entrada con esa dirección. Cambia el título o edita la existente.', cover: 'Elige la foto de portada.',
      foto_citada: 'El texto cita una foto que no está subida' + ((j && j.detalle) ? ' (' + j.detalle + ')' : '') + '.',
      sin_traduccion: 'La traducción automática no está activada en el servidor.', traduccion: 'No se ha podido traducir. Inténtalo de nuevo.',
      noexiste: 'Esa entrada no existe.', servidor: 'Ha fallado el servidor' + ((j && j.detalle) ? ': ' + j.detalle : '.')
    };
    return m[j && j.error] || 'Algo ha fallado. Inténtalo de nuevo.';
  }
  function api(ruta, opciones) {
    opciones = opciones || {};
    var cab = { 'x-admin-password': clave };
    if (opciones.cuerpo) { cab['content-type'] = 'application/json'; }
    return fetch('/api/admin/' + ruta, { method: opciones.metodo || 'GET', headers: cab, body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'servidor' }; }).then(function (j) { j._estado = r.status; return j; }); });
  }

  /* ───────── acceso ───────── */
  function mostrarEditor() {
    $('a-acceso').hidden = true;
    $('a-editor').hidden = false;
    if (!$('a-fecha').value) { $('a-fecha').value = hoy(); }
    recuperarBorrador();
  }
  function entrar() {
    decir($('a-estado-acceso'), 'Comprobando…');
    return api('lista').then(function (j) {
      if (!j.ok) {
        clave = '';
        decir($('a-estado-acceso'), mensajeError(j), true);
        return;
      }
      try { sessionStorage.setItem(CLAVE, clave); } catch (e) {}
      existentes = j.entradas || [];
      llenarExistentes();
      decir($('a-estado-acceso'), '');
      mostrarEditor();
    }).catch(function () { decir($('a-estado-acceso'), 'No se ha podido conectar.', true); });
  }
  $('a-form-acceso').addEventListener('submit', function (e) {
    e.preventDefault();
    clave = $('a-clave').value;
    if (clave) { entrar(); }
  });
  $('a-salir').addEventListener('click', function () {
    try { sessionStorage.removeItem(CLAVE); } catch (e) {}
    location.reload();
  });
  function llenarExistentes() {
    var sel = $('a-existentes');
    sel.innerHTML = '';
    existentes.forEach(function (e) {
      var o = document.createElement('option');
      o.value = e.tipo + '/' + e.slug;
      o.textContent = (e.tipo === 'review' ? 'Review · ' : 'Nota · ') + e.slug;
      sel.appendChild(o);
    });
  }

  /* ───────── modo: nueva / editar ───────── */
  Array.prototype.forEach.call(document.querySelectorAll('input[name="modo"]'), function (r) {
    r.addEventListener('change', function () {
      modo = r.value;
      $('a-editar-caja').hidden = modo !== 'editar';
      if (modo === 'nueva') { editando = null; bloquearTipo(false); limpiarFormulario(true); }
    });
  });
  function bloquearTipo(si) {
    Array.prototype.forEach.call(document.querySelectorAll('input[name="tipo"]'), function (r) { r.disabled = si; });
  }
  function aplicarTipo() {
    var review = tipo() === 'review';
    $('a-solo-review').hidden = !review;
    $('a-fmt-tabla').hidden = !review;
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="tipo"]'), function (r) { r.addEventListener('change', aplicarTipo); });

  /* ───────── lectura de una entrada existente ───────── */
  function parsear(md) {
    var m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(String(md).replace(/\r/g, ''));
    var meta = {}, cuerpo = md || '';
    if (m) {
      cuerpo = m[2].replace(/^\n+/, '');
      m[1].split('\n').forEach(function (linea) {
        var k = /^([A-Za-z_]+):\s*(.*)$/.exec(linea);
        if (!k) { return; }
        var v = k[2].trim();
        try {
          if (v.charAt(0) === '[') { v = JSON.parse(v); }
          else if (v.charAt(0) === "'" && v.slice(-1) === "'") { v = v.slice(1, -1).replace(/''/g, "'"); }
          else if (v.charAt(0) === '"' && v.slice(-1) === '"') { v = v.slice(1, -1); }
        } catch (e) {}
        meta[k[1]] = v;
      });
    }
    return { meta: meta, cuerpo: cuerpo.replace(/\s+$/, '') };
  }
  $('a-cargar').addEventListener('click', function () {
    var v = $('a-existentes').value;
    if (!v) { return; }
    var partes = v.split('/');
    decir($('a-estado'), 'Cargando…');
    api('entrada?tipo=' + encodeURIComponent(partes[0]) + '&slug=' + encodeURIComponent(partes[1])).then(function (j) {
      if (!j.ok) { decir($('a-estado'), mensajeError(j), true); return; }
      limpiarFormulario(false);
      editando = { tipo: partes[0], slug: partes[1] };
      var es = parsear(j.es || j.en || j.zh);
      document.querySelector('input[name="tipo"][value="' + partes[0] + '"]').checked = true;
      bloquearTipo(true);
      aplicarTipo();
      $('a-titulo').value = es.meta.title || '';
      $('a-desc').value = es.meta.description || '';
      $('a-fecha').value = String(es.meta.pubDate || hoy());
      $('a-tags').value = (es.meta.tags || []).join(', ');
      $('a-marca').value = es.meta.marca || '';
      $('a-producto').value = es.meta.producto || '';
      $('a-cuerpo-es').value = es.cuerpo;
      portada = String(es.meta.cover || '').replace(/^\.\//, '');
      var dir = (partes[0] === 'review' ? 'reviews/' : 'blog/') + partes[1];
      Object.keys(j.imagenes || {}).forEach(function (nombre) {
        var d = j.imagenes[nombre];
        fotos.push({ nombre: nombre, nueva: false, w: d.w, h: d.h, ext: d.ext || 'webp', base: d.base, anchos: d.anchos, miniatura: '/img/' + dir + '/' + d.base + '-' + d.anchos[0] + '.' + (d.ext || 'webp') });
      });
      pintarFotos();
      ['en', 'zh'].forEach(function (l) {
        var md = j[l];
        if (!md) { return; }
        $('a-usa-' + l).checked = true;
        panelIdioma(l);
        var p = parsear(md);
        $('a-' + l + '-titulo').value = p.meta.title || '';
        $('a-' + l + '-desc').value = p.meta.description || '';
        $('a-' + l + '-tags').value = (p.meta.tags || []).join(', ');
        $('a-' + l + '-cuerpo').value = p.cuerpo;
        traducciones[l] = !!p.meta._traducido;
        $('a-' + l + '-revisado').checked = !p.meta._traducido;
      });
      decir($('a-estado'), 'Entrada cargada. Cambia lo que quieras y pulsa Publicar.');
    }).catch(function () { decir($('a-estado'), 'No se ha podido conectar.', true); });
  });

  /* ───────── fotos ───────── */
  function pintarFotos() {
    var ul = $('a-lista-fotos');
    ul.innerHTML = '';
    fotos.forEach(function (f, i) {
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.src = f.miniatura; img.alt = ''; img.width = 160; img.height = 120;
      li.appendChild(img);
      var n = document.createElement('p'); n.className = 'a-nombre'; n.textContent = f.nombre + (f.nueva ? ' · nueva' : '');
      li.appendChild(n);
      var fila = document.createElement('div'); fila.className = 'a-fila';
      var lab = document.createElement('label');
      var rad = document.createElement('input'); rad.type = 'radio'; rad.name = 'portada'; rad.checked = f.nombre === portada;
      rad.addEventListener('change', function () { portada = f.nombre; guardarBorrador(); });
      lab.appendChild(rad); lab.appendChild(document.createTextNode(' Portada'));
      fila.appendChild(lab);
      var ins = document.createElement('button'); ins.type = 'button'; ins.textContent = 'Insertar';
      ins.setAttribute('aria-label', 'Insertar ' + f.nombre + ' en el texto');
      ins.addEventListener('click', function () { insertarEnTexto('\n\n![descripción de la foto](./' + f.nombre + ')\n\n'); });
      fila.appendChild(ins);
      if (f.nueva) {
        var q = document.createElement('button'); q.type = 'button'; q.textContent = 'Quitar';
        q.setAttribute('aria-label', 'Quitar ' + f.nombre);
        q.addEventListener('click', function () { fotos.splice(i, 1); if (portada === f.nombre) { portada = ''; } pintarFotos(); });
        fila.appendChild(q);
      }
      li.appendChild(fila);
      ul.appendChild(li);
    });
  }
  function nombreLibre(original) {
    var base = limpiarNombre(original.replace(/\.[^.]+$/, '')).slice(0, 40) || 'foto';
    var nombre = base + '.jpg', n = 2;
    while (fotos.some(function (f) { return f.nombre === nombre; })) { nombre = base + '-' + (n++) + '.jpg'; }
    return nombre;
  }
  function canvasA(bitmap, ancho) {
    var alto = Math.round(bitmap.height * ancho / bitmap.width);
    var c = document.createElement('canvas');
    c.width = ancho; c.height = alto;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, ancho, alto);            // por si la foto trae transparencia
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(bitmap, 0, 0, ancho, alto);
    return c;
  }
  function aBase64(canvas, calidad) {
    return new Promise(function (ok, mal) {
      canvas.toBlob(function (blob) {
        if (!blob) { mal(new Error('canvas')); return; }
        var lector = new FileReader();
        lector.onload = function () { ok(String(lector.result).split(',')[1]); };
        lector.onerror = function () { mal(lector.error); };
        lector.readAsDataURL(blob);
      }, 'image/jpeg', calidad);
    });
  }
  function procesarFoto(file) {
    var abrir = window.createImageBitmap ? window.createImageBitmap(file, { imageOrientation: 'from-image' }) : Promise.reject(new Error('sin createImageBitmap'));
    return abrir.then(function (bitmap) {
      var w = bitmap.width, h = bitmap.height;
      var anchos = w > 1600 ? [800, 1600] : (w > 800 ? [800, w] : [w]);
      var hechas = anchos.map(function (a) { return aBase64(canvasA(bitmap, a), 0.85).then(function (datos) { return { ancho: a, datos: datos }; }); });
      var mini = aBase64(canvasA(bitmap, Math.min(320, w)), 0.7).then(function (d) { return 'data:image/jpeg;base64,' + d; });
      return Promise.all([Promise.all(hechas), mini]).then(function (r) {
        if (bitmap.close) { bitmap.close(); }
        var nombre = nombreLibre(file.name);
        return { nombre: nombre, nueva: true, w: w, h: h, ext: 'jpg', base: nombre.replace(/\.jpg$/, ''), anchos: anchos, variantes: r[0], miniatura: r[1] };
      });
    });
  }
  function anadirFotos(lista) {
    var archivos = Array.prototype.slice.call(lista).filter(function (f) { return /^image\//.test(f.type); });
    if (!archivos.length) { return; }
    var nuevas = fotos.filter(function (f) { return f.nueva; }).length;
    if (nuevas + archivos.length > MAX_FOTOS) { decir($('a-estado'), 'Máximo ' + MAX_FOTOS + ' fotos por publicación. Publica y luego edita la entrada para añadir más.', true); return; }
    decir($('a-estado'), 'Preparando fotos…');
    archivos.reduce(function (cadena, f) {
      return cadena.then(function () {
        return procesarFoto(f).then(function (foto) { fotos.push(foto); if (!portada) { portada = foto.nombre; } pintarFotos(); },
          function () { decir($('a-estado'), 'No se ha podido leer «' + f.name + '». Prueba con una foto JPG.', true); });
      });
    }, Promise.resolve()).then(function () { if (!$('a-estado').classList.contains('error')) { decir($('a-estado'), ''); } });
  }
  var zona = $('a-zona'), selector = $('a-fotos');
  zona.addEventListener('click', function () { selector.click(); });
  zona.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selector.click(); } });
  selector.addEventListener('change', function () { anadirFotos(selector.files); selector.value = ''; });
  ['dragenter', 'dragover'].forEach(function (n) { zona.addEventListener(n, function (e) { e.preventDefault(); zona.classList.add('encima'); }); });
  ['dragleave', 'drop'].forEach(function (n) { zona.addEventListener(n, function (e) { e.preventDefault(); zona.classList.remove('encima'); }); });
  zona.addEventListener('drop', function (e) { anadirFotos(e.dataTransfer.files); });

  /* ───────── formato del texto ───────── */
  Array.prototype.forEach.call(document.querySelectorAll('textarea'), function (t) { t.addEventListener('focus', function () { if (/^a-cuerpo|^a-(en|zh)-cuerpo/.test(t.id)) { ultimoTexto = t; } }); });
  function insertarEnTexto(texto, seleccion) {
    var t = ultimoTexto, a = t.selectionStart, b = t.selectionEnd;
    var elegido = t.value.slice(a, b);
    var nuevo = seleccion ? seleccion(elegido) : texto;
    t.value = t.value.slice(0, a) + nuevo + t.value.slice(b);
    var pos = a + nuevo.length, ini = pos, fin = pos;
    if (seleccion && !elegido) {                       // si ha puesto un texto de ejemplo, lo deja seleccionado para escribir encima
      ['Título de la sección', 'Título de la subsección', 'texto'].forEach(function (ej) {
        var i = nuevo.indexOf(ej);
        if (i !== -1 && ini === pos) { ini = a + i; fin = ini + ej.length; }
      });
    }
    t.focus(); t.setSelectionRange(ini, fin);
    t.dispatchEvent(new Event('input', { bubbles: true }));
  }
  var FORMATOS = {
    h2: function (s) { return '\n\n## ' + (s || 'Título de la sección') + '\n\n'; },
    h3: function (s) { return '\n\n### ' + (s || 'Título de la subsección') + '\n\n'; },
    negrita: function (s) { return '**' + (s || 'texto') + '**'; },
    lista: function (s) { return '\n\n' + (s ? s.split('\n').map(function (l) { return '* ' + l; }).join('\n') : '* Uno\n* Dos') + '\n\n'; },
    linea: function () { return '\n\n---\n\n'; },
    tabla: function () { return '\n\n| Característica | Especificación |\n| :--- | :--- |\n| **Focal** | |\n| **Apertura** | |\n| **Distancia mínima de enfoque** | |\n| **Diámetro de filtro** | |\n| **Peso** | |\n| **Montura probada** | |\n\n'; }
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-fmt]'), function (b) {
    b.addEventListener('click', function () { var f = FORMATOS[b.getAttribute('data-fmt')]; insertarEnTexto(null, f); });
  });

  /* ───────── otros idiomas ───────── */
  function panelIdioma(l) {
    var caja = $('a-idioma-' + l);
    if (caja) { caja.hidden = false; return; }
    var nombre = l === 'en' ? 'Inglés' : 'Chino';
    caja = document.createElement('div');
    caja.className = 'a-idioma'; caja.id = 'a-idioma-' + l;
    caja.innerHTML =
      '<h2>' + nombre + '</h2>' +
      '<div class="a-idioma-acc"><button type="button" class="a-boton a-secundario" id="a-' + l + '-traducir">Traducir con Claude</button>' +
      '<label class="a-opciones"><input type="checkbox" id="a-' + l + '-revisado"> <span>He revisado esta traducción</span></label></div>' +
      '<p class="a-estado" id="a-' + l + '-estado" role="status"></p>' +
      '<div class="a-campo"><label for="a-' + l + '-titulo">Título</label><input id="a-' + l + '-titulo" type="text" maxlength="200" autocomplete="off"></div>' +
      '<div class="a-campo"><label for="a-' + l + '-desc">Descripción</label><textarea id="a-' + l + '-desc" rows="2" maxlength="400"></textarea></div>' +
      '<div class="a-campo"><label for="a-' + l + '-tags">Etiquetas</label><input id="a-' + l + '-tags" type="text" autocomplete="off"></div>' +
      '<div class="a-campo"><label for="a-' + l + '-cuerpo">Texto</label><textarea id="a-' + l + '-cuerpo" rows="14"></textarea></div>';
    $('a-idiomas').appendChild(caja);
    $('a-' + l + '-cuerpo').addEventListener('focus', function () { ultimoTexto = $('a-' + l + '-cuerpo'); });
    $('a-' + l + '-traducir').addEventListener('click', function () { traducir(l); });
  }
  ['en', 'zh'].forEach(function (l) {
    $('a-usa-' + l).addEventListener('change', function () {
      if ($('a-usa-' + l).checked) { panelIdioma(l); } else if ($('a-idioma-' + l)) { $('a-idioma-' + l).hidden = true; }
    });
  });
  function etiquetas(texto) { return String(texto || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean); }
  function traducir(l) {
    var estado = $('a-' + l + '-estado');
    if (!$('a-titulo').value.trim() || !$('a-cuerpo-es').value.trim()) { decir(estado, 'Escribe antes el título y el texto en español.', true); return; }
    var boton = $('a-' + l + '-traducir');
    boton.disabled = true;
    decir(estado, 'Traduciendo… puede tardar un minuto.');
    api('traducir', { metodo: 'POST', cuerpo: { idioma: l, titulo: $('a-titulo').value, descripcion: $('a-desc').value, etiquetas: etiquetas($('a-tags').value), cuerpo: $('a-cuerpo-es').value } })
      .then(function (j) {
        boton.disabled = false;
        if (!j.ok) { decir(estado, mensajeError(j), true); return; }
        $('a-' + l + '-titulo').value = j.titulo;
        $('a-' + l + '-desc').value = j.descripcion;
        $('a-' + l + '-tags').value = (j.etiquetas || []).join(', ');
        $('a-' + l + '-cuerpo').value = j.cuerpo;
        traducciones[l] = true;
        $('a-' + l + '-revisado').checked = false;
        decir(estado, 'Traducido. Léelo, corrige lo que haga falta y marca «He revisado esta traducción».');
        guardarBorrador();
      }).catch(function () { boton.disabled = false; decir(estado, 'No se ha podido conectar.', true); });
  }

  /* ───────── borrador (solo texto; las fotos no se guardan) ───────── */
  var temporizador = null;
  function recoger() {
    var d = { tipo: tipo(), titulo: $('a-titulo').value, desc: $('a-desc').value, fecha: $('a-fecha').value, tags: $('a-tags').value, marca: $('a-marca').value, producto: $('a-producto').value, es: $('a-cuerpo-es').value };
    ['en', 'zh'].forEach(function (l) {
      if ($('a-usa-' + l).checked && $('a-' + l + '-cuerpo')) {
        d[l] = { titulo: $('a-' + l + '-titulo').value, desc: $('a-' + l + '-desc').value, tags: $('a-' + l + '-tags').value, cuerpo: $('a-' + l + '-cuerpo').value, traducido: traducciones[l], revisado: $('a-' + l + '-revisado').checked };
      }
    });
    return d;
  }
  function guardarBorrador() {
    if (modo !== 'nueva') { return; }
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { try { localStorage.setItem(BORRADOR, JSON.stringify(recoger())); } catch (e) {} }, 600);
  }
  function recuperarBorrador() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(BORRADOR) || 'null'); } catch (e) {}
    if (!d || !(d.titulo || d.es)) { aplicarTipo(); return; }
    document.querySelector('input[name="tipo"][value="' + (d.tipo || 'nota') + '"]').checked = true;
    $('a-titulo').value = d.titulo || ''; $('a-desc').value = d.desc || ''; $('a-fecha').value = d.fecha || hoy();
    $('a-tags').value = d.tags || ''; $('a-marca').value = d.marca || ''; $('a-producto').value = d.producto || ''; $('a-cuerpo-es').value = d.es || '';
    ['en', 'zh'].forEach(function (l) {
      if (!d[l]) { return; }
      $('a-usa-' + l).checked = true; panelIdioma(l);
      $('a-' + l + '-titulo').value = d[l].titulo || ''; $('a-' + l + '-desc').value = d[l].desc || ''; $('a-' + l + '-tags').value = d[l].tags || '';
      $('a-' + l + '-cuerpo').value = d[l].cuerpo || ''; traducciones[l] = !!d[l].traducido; $('a-' + l + '-revisado').checked = !!d[l].revisado;
    });
    aplicarTipo();
    decir($('a-estado'), 'He recuperado tu borrador. Las fotos hay que volver a elegirlas.');
  }
  $('a-form').addEventListener('input', guardarBorrador);
  $('a-form').addEventListener('change', guardarBorrador);

  function limpiarFormulario(borrarBorrador) {
    $('a-form').reset();
    $('a-fecha').value = hoy();
    fotos = []; portada = ''; editando = null; traducciones = { en: false, zh: false };
    ['en', 'zh'].forEach(function (l) { var c = $('a-idioma-' + l); if (c) { c.remove(); } });
    pintarFotos(); aplicarTipo(); decir($('a-estado'), ''); $('a-resultado').hidden = true;
    if (borrarBorrador) { try { localStorage.removeItem(BORRADOR); } catch (e) {} }
  }
  $('a-descartar').addEventListener('click', function () {
    if (!confirm('¿Descartar lo que has escrito?')) { return; }
    limpiarFormulario(true);
  });

  /* ───────── publicar ───────── */
  function direccion(t, prod) { return limpiarNombre(t === 'review' ? (prod || $('a-titulo').value) : $('a-titulo').value).slice(0, 60).replace(/-+$/, ''); }
  $('a-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var estado = $('a-estado'), t = tipo();
    $('a-resultado').hidden = true;
    var titulo = $('a-titulo').value.trim(), desc = $('a-desc').value.trim(), cuerpo = $('a-cuerpo-es').value.trim();
    if (!titulo || !desc || !cuerpo || !$('a-fecha').value) { decir(estado, 'Faltan el título, la descripción, la fecha o el texto.', true); return; }
    if (t === 'review' && (!$('a-marca').value.trim() || !$('a-producto').value.trim())) { decir(estado, 'En una review hacen falta la marca y el objetivo.', true); return; }
    if (t === 'review' && !portada) { decir(estado, 'Elige la foto de portada.', true); return; }
    var slug = editando ? editando.slug : direccion(t, $('a-producto').value.trim());
    if (!slug) { decir(estado, 'Escribe un título con letras o números.', true); return; }
    if (!editando && existentes.some(function (x) { return x.tipo === t && x.slug === slug; })) {
      var n = 2; while (existentes.some(function (x) { return x.tipo === t && x.slug === slug + '-' + n; })) { n++; }
      slug = slug + '-' + n;
    }
    var comun = { marca: $('a-marca').value.trim(), producto: $('a-producto').value.trim() };
    var idiomas = { es: { titulo: titulo, descripcion: desc, etiquetas: etiquetas($('a-tags').value), cuerpo: cuerpo, marca: comun.marca, producto: comun.producto } };
    ['en', 'zh'].forEach(function (l) {
      if (!$('a-usa-' + l).checked || !$('a-' + l + '-cuerpo')) { return; }
      var c = $('a-' + l + '-cuerpo').value.trim();
      if (!c) { return; }
      idiomas[l] = { titulo: $('a-' + l + '-titulo').value.trim() || titulo, descripcion: $('a-' + l + '-desc').value.trim() || desc, etiquetas: etiquetas($('a-' + l + '-tags').value), cuerpo: c, marca: comun.marca, producto: comun.producto, traducido: traducciones[l] && !$('a-' + l + '-revisado').checked };
    });
    var nuevas = fotos.filter(function (f) { return f.nueva; }).map(function (f) { return { nombre: f.nombre, w: f.w, h: f.h, variantes: f.variantes }; });
    var boton = $('a-publicar');
    boton.disabled = true;
    decir(estado, nuevas.length ? 'Subiendo ' + nuevas.length + ' foto' + (nuevas.length === 1 ? '' : 's') + ' y el texto…' : 'Publicando…');
    api('publicar', { metodo: 'POST', cuerpo: { tipo: t, slug: slug, nuevo: !editando, fecha: $('a-fecha').value, cover: portada, idiomas: idiomas, fotos: nuevas } })
      .then(function (j) {
        boton.disabled = false;
        if (!j.ok) { decir(estado, mensajeError(j), true); return; }
        decir(estado, '');
        var r = $('a-resultado');
        r.innerHTML = '';
        r.appendChild(document.createTextNode('Publicado. La web se actualiza sola y tardará uno o dos minutos en verse en '));
        var a = document.createElement('a'); a.href = j.ruta; a.textContent = j.ruta;
        r.appendChild(a);
        r.appendChild(document.createTextNode('.'));
        r.hidden = false;
        try { localStorage.removeItem(BORRADOR); } catch (e) {}
        existentes.push({ tipo: t, slug: slug, idiomas: Object.keys(idiomas) });
        llenarExistentes();
        limpiarFormulario(false);
        document.querySelector('input[name="modo"][value="nueva"]').checked = true;
        modo = 'nueva'; $('a-editar-caja').hidden = true; bloquearTipo(false);
        r.hidden = false;
        r.scrollIntoView({ block: 'center' });
      }).catch(function () { boton.disabled = false; decir(estado, 'No se ha podido conectar. Tu texto sigue aquí.', true); });
  });

  /* ───────── inicio ───────── */
  aplicarTipo();
  if (clave) { entrar(); }
})();
