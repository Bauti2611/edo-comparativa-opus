/**
 * Hash routing and the chapter rail.
 *
 * The rail is drawn as a marching x axis: the chapters are a sequence, so the
 * tick marks x0, x1, x2 ... stand in for them and the numbering carries real
 * information instead of decorating.
 *
 * Chapters render on first visit and are cached, so the heavy exercise chapter
 * costs nothing until someone opens it.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var el = D.el;

  var CHAPTERS = [
    {
      id: 'problema',
      label: 'El problema',
      eyebrow: 'La pregunta',
      title: 'Tres caminos al mismo orden',
      lede: 'Qué se compara, sobre qué problema, y por qué la respuesta no es ' +
        'una sola cifra.',
      render: function () { return root.EDO.chapters.problema(); }
    },
    {
      id: 'formulas',
      label: 'Las cuatro fórmulas',
      eyebrow: 'Repaso',
      title: 'Las cuatro fórmulas, en una página',
      lede: 'La notación exacta de la cátedra, una ficha por método, y la ' +
        'deducción completa de cada una a un clic.',
      render: function () { return root.EDO.chapters.formulas(); }
    },
    {
      id: 'mesa',
      label: 'Mesa de integración',
      eyebrow: 'Demostración interactiva',
      title: 'Mesa de integración',
      lede: 'Los métodos marchando sobre el campo de pendientes del mismo problema, ' +
        'una iteración a la vez, con la aritmética al costado.',
      render: function () { return mesaChapter(); }
    },
    {
      id: 'ejercicios',
      label: 'Ejercicios paso a paso',
      eyebrow: 'Prácticas de la cátedra',
      title: 'Ejercicios resueltos paso a paso',
      lede: 'Cada planteo de las prácticas, con su ordenada genérica, su tabla de ' +
        'iteraciones y la aritmética de cada paso.',
      render: function () { return root.EDO.exercises.build(); }
    },
    {
      id: 'criterios',
      label: 'Criterios',
      eyebrow: 'Marco de la comparación',
      title: 'Criterios de comparación',
      lede: 'Qué se compara exactamente, declarado antes de mirar un solo número.',
      render: function () { return root.EDO.evidence.criteria(); }
    },
    {
      id: 'evidencia',
      label: 'La evidencia',
      eyebrow: 'Datos',
      title: 'La evidencia',
      lede: 'Las curvas, los errores, el orden medido y el contraejemplo que impide ' +
        'declarar un ganador universal.',
      render: function () { return root.EDO.evidence.evidence(); }
    },
    {
      id: 'conclusion',
      label: 'Conclusión',
      eyebrow: 'Respuesta',
      title: 'Conclusión',
      lede: 'Cinco afirmaciones, todas construidas con los números que el sitio ' +
        'calcula al cargarse.',
      render: function () { return root.EDO.chapters.conclusion(); }
    },
    {
      id: 'fuentes',
      label: 'Fuentes',
      eyebrow: 'Procedencia',
      title: 'Fuentes',
      lede: 'El material de la cátedra, los textos de referencia y la línea que ' +
        'separa lo suyo de lo nuestro.',
      render: function () { return root.EDO.chapters.sources(); }
    }
  ];

  /** The signature chapter plus its audience-interaction card. */
  function mesaChapter() {
    var V = root.EDO.views;
    var F = root.EDO.format;
    var E = root.EDO.errors;
    var P = root.EDO.problems;
    var CONFIG = root.EDO.config;

    V.resetPlateNumbers();
    var canonical = P.canonical();

    return [
      el('p', null, [
        'Elija el problema, mueva el paso y active los métodos que quiera ver ' +
        'marchar. El botón ',
        el('strong', { text: 'Siguiente iteración' }),
        ' avanza un paso y dibuja, en rosa, la construcción geométrica de ese paso ' +
        'para el método en foco: la tangente única de Euler, las dos pendientes ' +
        'promediadas de Euler mejorado, o el sondeo al punto medio de RK2. Con el foco ' +
        'puesto en la figura, las flechas ← y → también avanzan y retroceden.'
      ])
    ].concat(root.EDO.mesa.build()).concat([
      V.audienceCard({
        id: 'aud-halving',
        tag: 'Para el aula · antes de mover el paso',
        question: 'Si reducimos h a la mitad, ¿qué le pasa al error de cada método?',
        options: [
          'Cae a la mitad en todos',
          'Cae a la cuarta parte en todos',
          'Depende del orden del método'
        ],
        reveal: function () {
          var coarse = E.convergence(canonical, 'euler', [0.1, 0.05]);
          var fine = E.convergence(canonical, 'rk2Midpoint', [0.1, 0.05]);
          return [
            el('p', null, [
              'Depende del orden. Euler es de primer orden: al pasar de h = 0,1 a ' +
              'h = 0,05 su error baja de ' + F.scientific(coarse.entries[0].error) +
              ' a ' + F.scientific(coarse.entries[1].error) + ', un factor de ' +
              F.fixed(coarse.entries[0].error / coarse.entries[1].error, 2) +
              ' — aproximadamente 2¹.'
            ]),
            el('p', null, [
              'RK2 es de segundo orden: en el mismo refinamiento su error baja de ' +
              F.scientific(fine.entries[0].error) + ' a ' +
              F.scientific(fine.entries[1].error) + ', un factor de ' +
              F.fixed(fine.entries[0].error / fine.entries[1].error, 2) +
              ' — aproximadamente 2². Esa es exactamente la diferencia que ' +
              'significa “ser de segundo orden”.'
            ]),
            el('p.note', null, [
              'Compruébelo moviendo el paso en la Mesa: al mitad de h, el doble de ' +
              'iteraciones y cuatro veces menos error para los tres métodos de ' +
              'segundo orden.'
            ])
          ];
        }
      })
    ]);
  }

  var rendered = {};
  var railButtons = {};
  var currentId = null;

  var SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

  function buildRail(container) {
    var track = el('div.rail__track', { role: 'tablist', 'aria-label': 'Capítulos' });

    CHAPTERS.forEach(function (chapter, index) {
      var button = el('button.rail__step', {
        type: 'button',
        role: 'tab',
        'aria-current': 'false',
        'aria-controls': 'chapter-' + chapter.id,
        onClick: function () { go(chapter.id); }
      }, [
        el('span.rail__tick', { 'aria-hidden': 'true', dataset: { abscissa: 'x' + SUBS[index] } }),
        el('span.rail__label', { text: chapter.label })
      ]);
      railButtons[chapter.id] = button;
      track.appendChild(button);
    });

    container.appendChild(track);
  }

  function sectionFor(chapter) {
    return document.getElementById('chapter-' + chapter.id);
  }

  function paint(chapter) {
    if (rendered[chapter.id]) return;
    var section = sectionFor(chapter);
    if (!section) return;

    var head = el('header.chapter__head', null, [
      el('span.chapter__eyebrow', { text: chapter.eyebrow }),
      el('h2.chapter__title', { text: chapter.title }),
      chapter.lede ? el('p.chapter__lede', { text: chapter.lede }) : null
    ]);

    D.clear(section);
    section.appendChild(head);
    D.append(section, chapter.render());
    rendered[chapter.id] = true;
  }

  function go(id, options) {
    var opts = options || {};
    var chapter = CHAPTERS.filter(function (entry) { return entry.id === id; })[0];
    if (!chapter) chapter = CHAPTERS[0];
    if (chapter.id === currentId && rendered[chapter.id]) {
      if (!opts.silent) window.location.hash = '#/' + chapter.id;
      return;
    }

    if (currentId === 'mesa' && chapter.id !== 'mesa' && root.EDO.mesa) {
      root.EDO.mesa.stop();
    }

    paint(chapter);

    CHAPTERS.forEach(function (entry) {
      var section = sectionFor(entry);
      if (section) section.hidden = entry.id !== chapter.id;
      var button = railButtons[entry.id];
      if (button) {
        button.setAttribute('aria-current', entry.id === chapter.id ? 'true' : 'false');
      }
    });

    currentId = chapter.id;
    document.title = chapter.title + ' · Grupo ' + root.EDO.config.group.number +
      ' · Comparativa Taylor, Euler mejorado y RK2';

    if (!opts.silent) window.location.hash = '#/' + chapter.id;
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });

    var active = railButtons[chapter.id];
    if (active && active.scrollIntoView) {
      active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  function idFromHash() {
    var hash = window.location.hash || '';
    var match = /^#\/?([a-zA-Z]+)/.exec(hash);
    return match ? match[1].toLowerCase() : CHAPTERS[0].id;
  }

  function step(delta) {
    var index = CHAPTERS.map(function (c) { return c.id; }).indexOf(currentId);
    var next = Math.max(0, Math.min(CHAPTERS.length - 1, index + delta));
    if (next !== index) go(CHAPTERS[next].id);
  }

  /** Keys are for presenting: arrows walk the rail, digits jump. */
  function onKeydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    var target = event.target;
    if (target && target.closest) {
      // A local region (the Mesa) handles its own arrows.
      if (target.closest('[data-keys="local"]')) return;
      if (target.closest('input, select, textarea, summary, a[href]')) return;
    }

    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(CHAPTERS[0].id);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(CHAPTERS[CHAPTERS.length - 1].id);
    } else if (/^[1-9]$/.test(event.key)) {
      var index = Number(event.key) - 1;
      if (index < CHAPTERS.length) {
        event.preventDefault();
        go(CHAPTERS[index].id);
      }
    }
  }

  function init(railContainer) {
    buildRail(railContainer);
    window.addEventListener('hashchange', function () {
      go(idFromHash(), { silent: true });
    });
    document.addEventListener('keydown', onKeydown);
    go(idFromHash(), { silent: true, keepScroll: true });
  }

  var api = {
    chapters: CHAPTERS,
    init: init,
    go: go,
    step: step
  };

  root.EDO = root.EDO || {};
  root.EDO.router = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
