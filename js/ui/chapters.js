/**
 * The narrative chapters: the comparative question, the four formulas as a
 * one-page recap, the conclusion templated from computed numbers, and the
 * sources with the line separating the cátedra's material from the group's.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var F = root.EDO.format;
  var M = root.EDO.methods;
  var P = root.EDO.problems;
  var E = root.EDO.errors;
  var G = root.EDO.genericOrdinate;
  var V = root.EDO.views;
  var CONFIG = root.EDO.config;

  var el = D.el;
  var COMPARED = ['taylor2', 'eulerMejorado', 'rk2Midpoint'];
  var ALL = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

  // ---------------------------------------------------------------- chapter 1

  function problema() {
    V.resetPlateNumbers();
    var canonical = P.canonical();
    var rows = E.comparisonTable(canonical);
    var byMethod = {};
    rows.forEach(function (row) { byMethod[row.method] = row; });

    var spread = Math.max(
      byMethod.taylor2.absolute, byMethod.eulerMejorado.absolute, byMethod.rk2Midpoint.absolute
    ) / Math.min(
      byMethod.taylor2.absolute, byMethod.eulerMejorado.absolute, byMethod.rk2Midpoint.absolute
    );

    return [
      el('div.thesis', null, [
        el('p.thesis__claim', null, [
          'Taylor 2, Euler mejorado y RK2 llegan al ',
          el('em', { text: 'mismo orden de exactitud' }),
          ' por tres caminos distintos. La pregunta de esta exposición no es cómo ' +
          'funciona cada uno, sino cuál conviene elegir y con qué evidencia.'
        ]),
        el('p.thesis__answer', null, [
          'Los tres son de segundo orden: al reducir el paso a la mitad, su error ' +
          'global cae aproximadamente a la cuarta parte. Euler, en cambio, es de ' +
          'primer orden y sólo lo reduce a la mitad. Lo que separa a los tres ' +
          'primeros no es la exactitud teórica, sino ',
          el('strong', { text: 'qué le exigen al problema' }),
          ': Taylor 2 necesita las derivadas parciales analíticas de f; ' +
          'Euler mejorado y RK2 sólo necesitan evaluar f dos veces por paso.'
        ])
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'El problema de valor inicial, en cuatro datos' }),
        el('p', null, [
          'El apunte de la cátedra define un P.V.I. con exactamente cuatro datos. ' +
          'Todo el sitio trabaja sobre el mismo P.V.I. de referencia, que es el que ' +
          'aparece en el ejemplo resuelto de Taylor, en Euler mejorado 3a y en RK2 1c:'
        ]),
        V.pviElements(canonical),
        el('p', null, [
          'Resolverlo numéricamente significa hallar una ',
          el('strong', { text: '“ordenada genérica” yₙ₊₁' }),
          ': la fórmula explícita que se obtiene al reemplazar la f del problema ' +
          'en la fórmula general del método, antes de empezar a iterar. Con esa ' +
          'ordenada genérica se recorre el dominio o intervalo de trabajo paso a paso.'
        ]),
        el('p', null, [
          'Los cuatro métodos comparados son de ',
          el('strong', { text: 'paso simple' }),
          ': para calcular yₙ₊₁ usan información de un solo intervalo ' +
          '[' + canonical.varName + 'ₙ ; ' + canonical.varName + 'ₙ₊₁]. ' +
          'Eso los distingue de los métodos de paso múltiple, que necesitan varios ' +
          'intervalos previos y por lo tanto arrancan apoyados en un método de paso simple.'
        ])
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'Qué vamos a mostrar' }),
        el('p', null, [
          'Esta comparación es el objeto de la exposición, no un apéndice. ' +
          'Sobre el P.V.I. de referencia con h = ' + F.trim(canonical.h) + ', al llegar a ' +
          canonical.varName + ' = ' + F.trim(canonical.xf) + ', los errores relativos son: Euler ' +
          F.percent(byMethod.euler.relativePercent) + ', Taylor 2 ' +
          F.percent(byMethod.taylor2.relativePercent) + ', Euler mejorado ' +
          F.percent(byMethod.eulerMejorado.relativePercent) + ' y RK2 ' +
          F.percent(byMethod.rk2Midpoint.relativePercent) + '. '
        ]),
        el('p', null, [
          'Entre los tres métodos de segundo orden la diferencia es de un factor ' +
          F.fixed(spread, 1) + ' en este problema, y el orden del ranking ',
          el('strong', { text: 'cambia según el problema' }),
          '. Por eso la comparación necesita criterios declarados y datos, no una ' +
          'sola medición.'
        ]),
        V.plate(
          V.table({
            columns: [
              { label: 'Método' },
              { label: 'Orden' },
              { label: 'Evaluaciones de f por paso' },
              { label: '¿Requiere ∂f/∂x y ∂f/∂y?' }
            ],
            rows: ALL.map(function (id) {
              var descriptor = M.descriptors[id];
              return {
                cells: [
                  { html: V.methodHeader(id) },
                  'O(h' + (descriptor.order === 1 ? '' : '²') + ')',
                  String(descriptor.evaluationsPerStep),
                  descriptor.needsPartials ? 'Sí' : 'No'
                ]
              };
            })
          }),
          'Las tres propiedades que deciden la elección. El orden es una afirmación ' +
          'sobre cómo cae el error al refinar h; las otras dos son requisitos de cálculo.',
          { flush: true }
        )
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'Grupo ' + CONFIG.group.number }),
        el('ul.roster', null, CONFIG.group.members.map(function (name) {
          return el('li', { text: name });
        })),
        el('ul.meta', null, [
          el('li', { text: CONFIG.group.subject }),
          el('li', { text: CONFIG.group.faculty }),
          el('li', { text: CONFIG.group.chair }),
          el('li', { text: CONFIG.group.date }),
          el('li', { text: CONFIG.group.slot })
        ])
      ])
    ];
  }

  // ---------------------------------------------------------------- chapter 2

  var DEDUCTIONS = {
    euler: [
      'Se parte del desarrollo de Taylor de la solución alrededor de ' +
      'xₙ y se trunca después del término lineal. Lo que queda es ' +
      'exactamente la fórmula de Euler: avanzar sobre la recta tangente.',
      'El primer término descartado es proporcional a h², así que el error ' +
      'cometido en un solo paso es O(h²) y el error acumulado sobre todo el ' +
      'dominio resulta O(h): primer orden.'
    ],
    taylor2: [
      'Si en vez de truncar en el término lineal se conserva también el ' +
      'cuadrático, aparece yₙ″. Pero yₙ″ no es un dato del problema: ' +
      'hay que obtenerlo derivando f respecto de x teniendo en cuenta que y ' +
      'depende de x.',
      'De ahí la regla de la cadena del apunte: yₙ″ = ∂f/∂x + ' +
      '(∂f/∂y)·yₙ′. No son derivadas de la solución desconocida, ' +
      'sino derivadas parciales de f, que sí se conocen.',
      'El primer término descartado es ahora proporcional a h³, de modo que el ' +
      'error global pasa a ser O(h²): segundo orden, al precio de tener que ' +
      'derivar f analíticamente.'
    ],
    eulerMejorado: [
      'La idea es alcanzar el segundo orden sin derivar f. En lugar de calcular ' +
      'yₙ″, se mide la pendiente en dos puntos del intervalo y se promedia.',
      'Primero se predice el valor al final del paso con la tangente: ' +
      'yₙ + h·yₙ′. Ese valor predicho no recibe un símbolo propio en el ' +
      'apunte: es literalmente el argumento con el que se vuelve a evaluar f, ' +
      'ahora en xₙ₊₁.',
      'El promedio de las dos pendientes reproduce el término cuadrático del ' +
      'desarrollo de Taylor sin calcularlo, así que el error global vuelve a ser ' +
      'O(h²) con dos evaluaciones de f por paso y ninguna derivada parcial.',
      'Conviene nombrarlo con precisión: este método es, exactamente, el ' +
      'Runge-Kutta de grado 2 en su variante de Heun. Promediar la pendiente ' +
      'inicial con la del extremo equivale a tomar los pesos ½ y ½ de la familia ' +
      'RK2. Es decir que Euler mejorado no es un método ajeno a Runge-Kutta: es ' +
      'un Runge-Kutta de grado 2 con otro par de pesos.'
    ],
    rk2Midpoint: [
      'Misma estrategia que Euler mejorado — dos evaluaciones de f en vez de ' +
      'derivadas — pero eligiendo otro punto de muestreo: el punto medio del paso.',
      'Con k₁ = h·yₙ′ se sondea el punto ' +
      '(xₙ + h/2 ; yₙ + k₁/2), se mide la pendiente ahí y se usa esa ' +
      'única pendiente para cruzar todo el paso. Observe que h ya está dentro ' +
      'de k₁ y que en esta variante no existe un k₂.',
      'La pendiente del punto medio también cancela el término de primer orden ' +
      'del error, así que el método es de segundo orden: O(h²).',
      'La familia RK2 admite varias elecciones de pesos: punto medio (la que usa ' +
      'la cátedra), Heun — que es el Euler mejorado de la ficha anterior — y ' +
      'Ralston. Todas evalúan f dos veces por paso y todas son de orden 2; ' +
      'cambian en dónde se toma la segunda pendiente y con qué peso entra.'
    ]
  };

  function formulas() {
    V.resetPlateNumbers();
    var canonical = P.canonical();

    var fichas = ALL.map(function (id) {
      var descriptor = M.descriptors[id];
      var general = G.general(id);

      return el('article.ficha.ficha--' + id, null, [
        el('div.ficha__head', null, [
          el('span.ficha__order', {
            text: 'Orden ' + descriptor.order + ' · ' + descriptor.family
          }),
          el('h3.ficha__name', { text: descriptor.name })
        ]),
        el('div.ficha__formula', null, [
          D.mathBlock(general.formula),
          V.derivation(general.where)
        ]),
        el('p.ficha__idea', { text: general.idea }),
        el('ul.ficha__facts', null, [
          el('li', null, [
            el('span', { text: 'Error global' }),
            el('b', { text: 'O(h' + (descriptor.order === 1 ? '' : '²') + ')' })
          ]),
          el('li', null, [
            el('span', { text: 'Evaluaciones de f por paso' }),
            el('b', { text: String(descriptor.evaluationsPerStep) })
          ]),
          el('li', null, [
            el('span', { text: 'Derivadas parciales de f' }),
            el('b', { text: descriptor.needsPartials ? 'Necesarias' : 'No necesarias' })
          ])
        ]),
        V.deduction('Ver la deducción', DEDUCTIONS[id].map(function (text) {
          return el('p', { text: text });
        }))
      ]);
    });

    return [
      el('p', null, [
        'Las cuatro fórmulas están escritas con la notación exacta del apunte de ' +
        'la cátedra, incluido el 2! del denominador. Cada ficha trae además su ' +
        'deducción completa, plegada: el recorrido desde la serie de Taylor está ' +
        'disponible, pero no ocupa la lectura principal.'
      ]),
      el('p.callout', null, [
        el('strong', { text: 'Las cuatro fichas no son cuatro familias. ' }),
        'Euler mejorado es, en rigor, el Runge-Kutta de grado 2 en su variante ' +
        'de Heun: promediar la pendiente inicial con la del extremo equivale a ' +
        'tomar los pesos ½ y ½ de la familia RK2, mientras que la cátedra usa la ' +
        'variante del punto medio. La comparación enfrenta entonces dos variantes ' +
        'de Runge-Kutta de grado 2 contra Taylor, que llega al mismo orden por un ' +
        'camino distinto: derivando f en lugar de evaluarla dos veces.'
      ]),
      el('div.fichas', null, fichas),

      el('section.block', null, [
        el('h2.block__title', { text: 'De la fórmula general a la ordenada genérica' }),
        el('p', null, [
          'Las fórmulas de arriba son generales. Para resolver un problema concreto ' +
          'hay que reemplazar su f y obtener la ordenada genérica. Sobre el P.V.I. de ' +
          'referencia (' + canonical.odeDisplay + ', y(' + F.trim(canonical.x0) + ') = ' +
          F.trim(canonical.y0) + '), los cuatro métodos quedan así:'
        ]),
        el('div', null, ALL.map(function (id) {
          var result = G.ordinate(id, canonical);
          return el('div.block', null, [
            el('h3.block__sub', null, [
              el('span.swatch.swatch--' + id, { 'aria-hidden': 'true' }),
              M.descriptors[id].name
            ]),
            result.steps.length ? V.derivation(result.steps) : null,
            V.ordinateBlock(result.ordinate)
          ]);
        }))
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'De dónde viene cada afirmación' }),
        el('div.note.note--source', null, [
          el('p', null, [
            el('strong', { text: 'Material de la cátedra: ' }),
            'las cuatro fórmulas, la notación, el vocabulario (ordenada genérica, ' +
            'iteración, dominio o intervalo de trabajo, paso simple frente a paso ' +
            'múltiple), los enunciados de los ejercicios y los ejemplos resueltos. ' +
            'El apunte presenta los métodos de forma procedimental: muestra cómo ' +
            'aplicarlos.'
          ]),
          el('p', null, [
            el('strong', { text: 'Aporte del grupo: ' }),
            'las soluciones analíticas, el cálculo de errores absoluto y relativo, ' +
            'la notación O(hⁿ), el orden de convergencia y su medición empírica, ' +
            'y los criterios de comparación. Nada de esto figura en los cuatro PDF de ' +
            'la cátedra; proviene de Chapra & Canale, ',
            el('em', { text: CONFIG.sources.chapra.title }),
            ' y de Burden & Faires, ',
            el('em', { text: CONFIG.sources.burden.title }),
            '.'
          ])
        ])
      ])
    ];
  }

  // ---------------------------------------------------------------- chapter 7

  function conclusion() {
    V.resetPlateNumbers();
    var canonical = P.canonical();
    var rows = E.comparisonTable(canonical);
    var byMethod = {};
    rows.forEach(function (row) { byMethod[row.method] = row; });

    var convergence = E.convergenceAll(canonical, CONFIG.convergenceSteps);
    var halving = E.halveVersusChange(canonical, canonical.h);

    var secondOrder = COMPARED.map(function (id) { return byMethod[id]; })
      .sort(function (a, b) { return a.absolute - b.absolute; });

    // Which second-order method wins, per exercise with a known solution.
    var winners = {};
    P.catalog.forEach(function (problem) {
      if (typeof problem.exact !== 'function') return;
      var best = E.comparisonTable(problem)
        .filter(function (row) { return row.order === 2; })
        .sort(function (a, b) { return a.absolute - b.absolute; })[0];
      winners[best.method] = (winners[best.method] || 0) + 1;
    });
    var winnerText = COMPARED
      .filter(function (id) { return winners[id]; })
      .map(function (id) {
        return CONFIG.methodStyle[id].label + ' en ' + winners[id] +
          (winners[id] === 1 ? ' ejercicio' : ' ejercicios');
      })
      .join(', ');

    var exerciseCount = P.catalog.filter(function (p) {
      return typeof p.exact === 'function';
    }).length;

    return [
      el('p.thesis__answer', null, [
        'Todas las cifras de esta página las calcula el motor del sitio al ' +
        'cargarse, sobre el P.V.I. de referencia y sobre los ' + P.catalog.length +
        ' ejercicios del catálogo.'
      ]),

      el('ol.findings', null, [
        el('li', null, [
          el('h3', { text: 'El orden medido coincide con el orden teórico' }),
          el('p', {
            text: 'Refinando h sobre el P.V.I. de referencia, el orden observado ' +
              'log₂(eₕ/eₕ⁄₂) en el par más fino da ' +
              F.order(convergence.euler.finestOrder) + ' para Euler, ' +
              F.order(convergence.taylor2.finestOrder) + ' para Taylor 2, ' +
              F.order(convergence.eulerMejorado.finestOrder) + ' para Euler mejorado y ' +
              F.order(convergence.rk2Midpoint.finestOrder) + ' para RK2. ' +
              'Es decir: 1 para Euler y 2 para los otros tres, como predice la teoría.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Cambiar de método rinde más que refinar el paso' }),
          el('p', {
            text: 'Euler con h = ' + F.trim(halving.eulerAtHalfH.h) + ' gasta ' +
              halving.eulerAtHalfH.evaluations + ' evaluaciones de f y deja un error de ' +
              F.scientific(halving.eulerAtHalfH.error) + '. Cualquiera de los tres ' +
              'métodos de segundo orden con el h original ' + F.trim(halving.h) +
              ' usa a lo sumo ' + Math.max.apply(null, halving.secondOrder.map(function (s) {
                return s.evaluations;
              })) + ' evaluaciones y baja el error a ' +
              F.scientific(Math.max.apply(null, halving.secondOrder.map(function (s) {
                return s.error;
              }))) + ' o menos. Duplicar el trabajo con un método de primer orden no ' +
              'compensa.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Entre los tres de segundo orden no hay un ganador universal' }),
          el('p', {
            text: 'En el P.V.I. de referencia el orden de exactitud es ' +
              secondOrder.map(function (row) { return CONFIG.methodStyle[row.method].label; })
                .join(', luego ') + '. Pero sobre los ' + exerciseCount +
              ' ejercicios con solución analítica conocida el ganador cambia: ' +
              winnerText + '. En el Ejercicio 3e incluso Euler queda más cerca que ' +
              'los tres, por cancelación de errores: un solo punto no alcanza para ' +
              'ordenar métodos.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'La diferencia real está en los requisitos, no en el orden' }),
          el('p', {
            text: 'Taylor 2 necesita ∂f/∂x y ∂f/∂y en forma analítica. ' +
              'Cuando f es simple eso es gratis y Taylor 2 es competitivo con una sola ' +
              'evaluación de f por paso. Cuando f es complicada, tabulada o ' +
              'experimental, esas derivadas no están disponibles y el método ' +
              'directamente no se puede aplicar. Euler mejorado y RK2 alcanzan el mismo ' +
              'orden evaluando f dos veces, sin derivar nada.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Cuando f es lineal, los tres coinciden dígito a dígito' }),
          el('p', {
            text: 'En el Ejercicio 2a (y′ = −y + x + 1) y en el 2e ' +
              '(y′ = 2x − 3y + 1), con ∂f/∂x y ∂f/∂y constantes, ' +
              'Taylor 2, Euler mejorado y RK2 producen exactamente el mismo valor. ' +
              'No es casualidad: con f lineal el término cuadrático que los tres ' +
              'reconstruyen es idéntico, y los tres caminos llegan a la misma ' +
              'expresión.'
          })
        ])
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'Respuesta a la pregunta de la exposición' }),
        el('p', null, [
          '¿Cuál conviene elegir? Si las derivadas parciales de f están a mano y ' +
          'son baratas, Taylor 2 resuelve con una sola evaluación de f por paso. ' +
          'Si no lo están — el caso habitual en ingeniería — Euler mejorado ' +
          'y RK2 dan el mismo orden sin pedir nada más que evaluar f. Euler queda ' +
          'para una primera estimación rápida, o para arrancar un método de paso ' +
          'múltiple. Entre Euler mejorado y RK2 la elección es del mismo costo y ' +
          'hay que decidirla con datos del problema concreto, no con una regla general.'
        ]),
        el('p.note', null, [
          'Runge-Kutta de grado 4 no aparece en el material de la cátedra para este ' +
          'tema y queda fuera del alcance de esta comparativa.'
        ])
      ])
    ];
  }

  // ---------------------------------------------------------------- chapter 8

  function sources() {
    V.resetPlateNumbers();
    var S = CONFIG.sources;

    function pdfLink(entry) {
      return el('p.sources__meta', null, [
        entry.publisher,
        ' · ',
        el('a', { href: entry.file, text: 'Abrir la copia en docs/' })
      ]);
    }

    return [
      el('p', null, [
        'Los PDF de la cátedra se incluyen como copia local, de modo que el sitio ' +
        'funcione sin conexión. Los dos libros de texto se citan por autor, título y ' +
        'editorial: no se incluyen enlaces porque no hay una edición pública oficial ' +
        'que podamos referenciar con honestidad.'
      ]),

      el('ul.sources', null, [
        el('li', { class: 'is-chair' }, [
          el('span.sources__kind', { text: 'Cátedra · apunte teórico y ejemplos resueltos' }),
          el('h3.sources__title', { text: S.apunte.title }),
          el('p.sources__meta', null, [S.apunte.author]),
          pdfLink(S.apunte)
        ]),
        el('li', { class: 'is-chair' }, [
          el('span.sources__kind', { text: 'Cátedra · práctica (Taylor, Euler, Euler mejorado)' }),
          el('h3.sources__title', { text: S.practica05.title }),
          pdfLink(S.practica05)
        ]),
        el('li', { class: 'is-chair' }, [
          el('span.sources__kind', { text: 'Cátedra · práctica (Runge-Kutta de grado 2)' }),
          el('h3.sources__title', { text: S.practica06.title }),
          pdfLink(S.practica06)
        ]),
        el('li', { class: 'is-group' }, [
          el('span.sources__kind', { text: 'Aporte del grupo · análisis del error' }),
          el('h3.sources__title', { text: S.chapra.title }),
          el('p.sources__meta', { text: S.chapra.author + ' · ' + S.chapra.publisher })
        ]),
        el('li', { class: 'is-group' }, [
          el('span.sources__kind', { text: 'Aporte del grupo · orden y convergencia' }),
          el('h3.sources__title', { text: S.burden.title }),
          el('p.sources__meta', { text: S.burden.author + ' · ' + S.burden.publisher })
        ])
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'Qué es de la cátedra y qué es nuestro' }),
        el('div.note.note--source', null, [
          el('p', {
            text: 'De la cátedra: la definición de P.V.I. y sus cuatro datos, el ' +
              'concepto de ordenada genérica, la clasificación en paso simple y paso ' +
              'múltiple, las cuatro fórmulas con su notación exacta (incluido el ' +
              'h²/2! y el h/2!), la variante de punto medio para RK2, los enunciados ' +
              'de los ejercicios y los ejemplos resueltos paso a paso.'
          }),
          el('p', {
            text: 'Del grupo: las soluciones analíticas de cada P.V.I. y su ' +
              'verificación (cada una satisface la ecuación diferencial y la ' +
              'condición inicial, comprobado por los tests), el error absoluto y ' +
              'relativo, la notación O(hⁿ), el orden de convergencia observado, los ' +
              'criterios de comparación, la guía de decisión y toda la ' +
              'implementación interactiva. Los cuatro PDF de la cátedra no contienen ' +
              'soluciones analíticas, fórmulas de error, notación O(hⁿ) ni ' +
              'criterios de convergencia.'
          })
        ]),
        el('p.note', null, [
          'La práctica 05 numera su Ejercicio 3 como a), b), c), e): el ítem d) ' +
          'no existe en el enunciado original y conservamos esa numeración.'
        ])
      ])
    ];
  }

  var api = {
    problema: problema,
    formulas: formulas,
    conclusion: conclusion,
    sources: sources,
    COMPARED: COMPARED,
    ALL: ALL
  };

  root.EDO = root.EDO || {};
  root.EDO.chapters = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
