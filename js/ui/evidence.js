/**
 * The comparison spine, split in two chapters:
 *
 *   Criterios de comparación — what is being compared and why, stated before
 *   any number is shown, so the data answers a declared question.
 *
 *   La evidencia — the curves, the error table, the log-log convergence plot
 *   with the observed orders, the "halve h vs change method" comparison, the
 *   counterexample, and the decision guide.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var F = root.EDO.format;
  var M = root.EDO.methods;
  var P = root.EDO.problems;
  var E = root.EDO.errors;
  var SF = root.EDO.slopeField;
  var Plot = root.EDO.plot;
  var V = root.EDO.views;
  var CONFIG = root.EDO.config;

  var el = D.el;
  var COMPARED = ['taylor2', 'eulerMejorado', 'rk2Midpoint'];
  var ALL = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

  // --------------------------------------------------------------- criteria

  function criteria() {
    V.resetPlateNumbers();
    var canonical = P.canonical();

    return [
      el('p', null, [
        'Decir que un método “es mejor” no significa nada hasta decir en ' +
        'qué. Estos son los cinco criterios con los que comparamos, declarados antes ' +
        'de mirar cualquier número. El capítulo siguiente los responde con datos ' +
        'calculados sobre el P.V.I. de referencia y sobre los ' + P.catalog.length +
        ' ejercicios del catálogo.'
      ]),

      el('ol.criteria', null, [
        el('li', null, [
          el('h3', { text: 'Exactitud: error global y orden' }),
          el('p', {
            text: 'El error absoluto en el extremo del dominio dice cuánto se ' +
              'equivocó el método en una corrida. El orden dice algo más ' +
              'útil: cómo cae ese error cuando se refina el paso. Un método de ' +
              'orden p cumple que su error global es O(hᵖ), así que al reducir h a ' +
              'la mitad el error cae a 1/2ᵖ. Lo medimos empíricamente con ' +
              'log₂(eₕ/eₕ⁄₂) y comparamos contra el valor teórico. ' +
              'Este criterio es aporte del grupo: el apunte no define error ni orden.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Costo por paso: evaluaciones de f' }),
          el('p', {
            text: 'En un problema real evaluar f es lo caro: puede ser una simulación, ' +
              'una tabla o un ensayo. Contamos cuántas veces cada método evaluúa f ' +
              'por iteración. Euler y Taylor 2 la evalúan una vez; Euler mejorado y ' +
              'RK2, dos. La comparación honesta no es error contra error, sino error a ' +
              'igual cantidad de evaluaciones.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Requisitos analíticos' }),
          el('p', {
            text: 'Taylor 2 necesita ∂f/∂x y ∂f/∂y en forma analítica, ' +
              'porque yₙ″ se obtiene por regla de la cadena sobre f. Si f es ' +
              'complicada, derivarla a mano es trabajoso y propenso a error; si f viene ' +
              'de una tabla o de un experimento, no se puede derivar en absoluto. Euler, ' +
              'Euler mejorado y RK2 no piden ninguna derivada. Este es el criterio que ' +
              'más decide en la práctica, y no se ve en una tabla de errores.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Facilidad de implementación y de cálculo a mano' }),
          el('p', {
            text: 'Cuántas cantidades intermedias hay que llevar por iteración, y ' +
              'cuántas de ellas se pueden confundir. Euler lleva una; RK2 lleva k₁, ' +
              'el punto medio y la pendiente ahí; Euler mejorado lleva el valor ' +
              'predicho y la pendiente en él; Taylor 2 lleva yₙ′ y yₙ″, ' +
              'pero exige haber derivado f antes de empezar.'
          })
        ]),
        el('li', null, [
          el('h3', { text: 'Comportamiento al refinar h' }),
          el('p', {
            text: 'Un método útil debe mejorar de forma predecible cuando se le da ' +
              'un paso más fino. Si el orden observado no se acerca al teórico, ' +
              'algo anda mal: la implementación, el paso elegido o el problema. ' +
              'Verificarlo es una prueba de que el método está bien aplicado, no ' +
              'sólo una curiosidad teórica.'
          })
        ])
      ]),

      el('section.block', null, [
        el('h2.block__title', { text: 'Sobre qué se mide' }),
        el('p', null, [
          'Todas las mediciones del capítulo siguiente usan el P.V.I. de referencia ' +
          'de la cátedra, que tiene solución analítica conocida y por lo tanto ' +
          'permite calcular el error de verdad en lugar de estimarlo:'
        ]),
        V.pviElements(canonical),
        el('p.note', null, [
          'La solución exacta y = e^(' + canonical.varName + '²−1) es aporte ' +
          'del grupo; los tests del proyecto verifican que satisface tanto la ecuación ' +
          'diferencial como la condición inicial.'
        ])
      ])
    ];
  }

  // --------------------------------------------------------------- evidence

  function errorCurvesFigure(problem) {
    var traces = {};
    ALL.forEach(function (id) { traces[id] = M.run(id, problem); });

    var values = [];
    ALL.forEach(function (id) {
      E.errorTable(problem, traces[id]).forEach(function (row) {
        if (row.absolute !== null) values.push(row.absolute);
      });
    });
    var range = Plot.rangeOf(values.concat([0]), 0.08);

    var surface = Plot.surface({
      view: {
        xMin: problem.x0, xMax: problem.xf,
        yMin: 0, yMax: range.max
      },
      width: 780,
      height: 400,
      pad: { top: 22, right: 136, bottom: 44, left: 78 },
      title: 'Error absoluto acumulado de cada método a lo largo del dominio'
    });

    Plot.drawAxes(surface, {
      xLabel: problem.varName,
      yLabel: 'error absoluto'
    });

    ALL.forEach(function (id) {
      var points = E.errorTable(problem, traces[id]).map(function (row) {
        return { x: row.x, y: row.absolute };
      });
      Plot.drawSeries(surface, id, points, {
        label: CONFIG.methodStyle[id].label,
        markerSize: 7
      });
    });

    Plot.flushLabels(surface);
    return surface.node;
  }

  function marchFigure(problem) {
    var traces = {};
    ALL.forEach(function (id) { traces[id] = M.run(id, problem); });

    var values = [problem.y0];
    ALL.forEach(function (id) {
      traces[id].points.forEach(function (point) { values.push(point.y); });
    });
    for (var i = 0; i <= 24; i += 1) {
      values.push(problem.exact(problem.x0 + (problem.xf - problem.x0) * (i / 24)));
    }
    var range = Plot.rangeOf(values, 0.12);
    var xPad = (problem.xf - problem.x0) * 0.05;
    var view = {
      xMin: problem.x0 - xPad, xMax: problem.xf + xPad,
      yMin: range.min, yMax: range.max
    };

    var surface = Plot.surface({
      view: view,
      width: 780,
      height: 430,
      title: 'Las cuatro poligonales y la solución exacta sobre el campo de pendientes'
    });

    Plot.drawAxes(surface, { xLabel: problem.varName, yLabel: 'y' });
    Plot.drawSlopeField(surface, SF.sample(problem, view, { columns: 24, rows: 15 }));
    Plot.drawExactCurve(surface, SF.exactCurve(problem, view, 200), 'exacta');

    ALL.forEach(function (id) {
      Plot.drawSeries(surface, id, traces[id].points, {
        label: CONFIG.methodStyle[id].label
      });
    });

    Plot.flushLabels(surface);
    return surface.node;
  }

  function convergenceFigure(studies) {
    return Plot.logLog({
      series: ALL.map(function (id) {
        return {
          method: id,
          label: CONFIG.methodStyle[id].label,
          points: studies[id].entries
            .filter(function (entry) { return entry.dividesDomain; })
            .map(function (entry) { return { h: entry.h, error: entry.error }; })
        };
      }),
      width: 780,
      height: 460,
      xValues: CONFIG.convergenceSteps.filter(function (h) {
        return studies.euler.entries.some(function (entry) {
          return entry.h === h && entry.dividesDomain;
        });
      }),
      xLabel: 'paso h',
      yLabel: 'error global en ' + P.canonical().varName + ' = ' + F.trim(P.canonical().xf),
      title: 'Error global contra paso, en escala logarítmica doble'
    }).node;
  }

  function evidence() {
    V.resetPlateNumbers();
    var canonical = P.canonical();
    var rows = E.comparisonTable(canonical);
    var byMethod = {};
    rows.forEach(function (row) { byMethod[row.method] = row; });

    var studies = E.convergenceAll(canonical, CONFIG.convergenceSteps);
    var halving = E.halveVersusChange(canonical, canonical.h);
    var counter = P.get('p05_3e');
    var counterRows = E.comparisonTable(counter)
      .sort(function (a, b) { return a.absolute - b.absolute; });

    var skipped = studies.euler.entries.filter(function (entry) {
      return !entry.dividesDomain;
    });

    return [
      el('p', null, [
        'Los cinco criterios, respondidos con números que el motor del sitio calcula ' +
        'al cargarse. Ninguna cifra de este capítulo está escrita a mano.'
      ]),

      // C1 + the march
      el('section.block', null, [
        el('h2.block__title', { text: 'C1 · Exactitud sobre el mismo problema' }),
        V.legend(ALL, { exact: true }),
        V.plate(
          marchFigure(canonical),
          'Las cuatro poligonales marchando sobre el campo de pendientes de ' +
          canonical.odeDisplay + '. Euler se despega hacia abajo desde el primer paso; ' +
          'los tres métodos de segundo orden se mantienen pegados a la solución ' +
          'exacta, trazada en línea de trazos.',
          { flush: true }
        ),
        V.plate(
          errorCurvesFigure(canonical),
          'El mismo recorrido visto como error absoluto. La separación entre Euler y ' +
          'los otros tres crece con cada iteración; entre los tres de segundo orden la ' +
          'diferencia se mantiene en el mismo orden de magnitud.',
          { flush: true }
        ),
        V.plate(
          V.table({
            columns: [
              { label: 'Método' },
              { label: 'Orden' },
              { label: 'Evaluaciones de f por paso' },
              { label: '¿Derivadas parciales?' },
              { label: 'Valor en ' + canonical.varName + ' = ' + F.trim(canonical.xf) },
              { label: 'Error absoluto' },
              { label: 'Error relativo' }
            ],
            rows: ALL.map(function (id) {
              var row = byMethod[id];
              return {
                cells: [
                  { html: V.methodHeader(id) },
                  'O(h' + (row.order === 1 ? '' : '²') + ')',
                  String(row.evaluationsPerStep),
                  row.needsPartials ? 'Sí' : 'No',
                  F.fixed(row.y, 6),
                  F.scientific(row.absolute),
                  F.percent(row.relativePercent)
                ]
              };
            })
          }),
          'Tabla comparativa sobre el P.V.I. de referencia con h = ' +
          F.trim(canonical.h) + ' y ' + M.stepCount(canonical) + ' iteraciones. ' +
          'El valor exacto es ' + F.fixed(canonical.exact(canonical.xf), 6) + '.',
          { flush: true }
        )
      ]),

      // Audience card
      V.audienceCard({
        id: 'aud-ranking',
        tag: 'Para el aula · antes de revelar',
        question: '¿Cuál de los tres métodos de segundo orden queda más cerca ' +
          'de la solución exacta en este problema?',
        options: ['Taylor 2', 'Euler mejorado', 'RK2 punto medio', 'Los tres igual'],
        reveal: function () {
          var ordered = COMPARED.map(function (id) { return byMethod[id]; })
            .sort(function (a, b) { return a.absolute - b.absolute; });
          return [
            el('p', null, [
              'En ',
              el('strong', { text: 'este' }),
              ' problema gana ' + CONFIG.methodStyle[ordered[0].method].label +
              ' con un error de ' + F.scientific(ordered[0].absolute) + ', seguido por ' +
              CONFIG.methodStyle[ordered[1].method].label + ' (' +
              F.scientific(ordered[1].absolute) + ') y ' +
              CONFIG.methodStyle[ordered[2].method].label + ' (' +
              F.scientific(ordered[2].absolute) + ').'
            ]),
            el('p', null, [
              'Pero la respuesta correcta a la pregunta general es ',
              el('strong', { text: 'depende del problema' }),
              '. Más abajo, en el Ejercicio 3e, el orden se invierte y hasta Euler ' +
              'queda mejor que los tres. El ranking no es una propiedad de los ' +
              'métodos: es una propiedad del par método-problema.'
            ])
          ];
        }
      }),

      // C5 convergence
      el('section.block', null, [
        el('h2.block__title', { text: 'C5 · Qué pasa al refinar el paso' }),
        el('p', null, [
          'Se repite la corrida con pasos cada vez más finos y se mide el error en ' +
          canonical.varName + ' = ' + F.trim(canonical.xf) + '. En escala logarítmica ' +
          'doble, un método de orden p aparece como una recta de pendiente p.'
        ]),
        V.legend(ALL),
        V.plate(
          convergenceFigure(studies),
          'Error global contra paso h. La pendiente de cada recta es el orden del ' +
          'método: Euler traza una recta visiblemente más tendida que las otras tres, ' +
          'que corren casi paralelas con el doble de pendiente.',
          { flush: true }
        ),
        V.plate(
          V.table({
            columns: [
              { label: 'h' },
              { label: 'Iteraciones' }
            ].concat(ALL.map(function (id) {
              return { label: V.methodHeader(id) };
            })),
            rows: CONFIG.convergenceSteps.map(function (h, index) {
              var reference = studies.euler.entries[index];
              return {
                cells: [F.trim(h, 6), String(reference.steps)].concat(ALL.map(function (id) {
                  return F.scientific(studies[id].entries[index].error);
                })),
                className: reference.dividesDomain ? null : 'is-muted'
              };
            })
          }),
          'Error global para cada paso. ' + (skipped.length
            ? 'La fila h = ' + F.trim(skipped[0].h) + ' aparece atenuada porque ese paso ' +
              'no divide al intervalo: la marcha se detiene en ' +
              canonical.varName + ' = ' + F.trim(skipped[0].xLast) +
              ', así que esa fila no se usa para medir el orden.'
            : ''),
          { flush: true }
        ),
        V.plate(
          V.table({
            columns: [
              { label: 'Refinamiento' }
            ].concat(ALL.map(function (id) {
              return { label: V.methodHeader(id) };
            })),
            rows: CONFIG.convergenceSteps.slice(1).map(function (h, index) {
              var previous = CONFIG.convergenceSteps[index];
              return {
                cells: ['h ' + F.trim(previous, 6) + ' → ' + F.trim(h, 6)]
                  .concat(ALL.map(function (id) {
                    return F.order(studies[id].entries[index + 1].observedOrder);
                  }))
              };
            }).concat([{
              cells: ['Orden teórico'].concat(ALL.map(function (id) {
                return F.fixed(M.descriptors[id].order, 2);
              })),
              className: 'is-final'
            }])
          }),
          'Orden observado log₂(eₕ/eₕ⁄₂) en cada refinamiento. ' +
          'Converge a 1 para Euler y a 2 para los otros tres. Los refinamientos que ' +
          'parten de un paso que no divide al intervalo no son comparables y quedan sin ' +
          'valor.',
          { flush: true }
        )
      ]),

      // C2 cost
      el('section.block', null, [
        el('h2.block__title', { text: 'C2 · Refinar el paso o cambiar de método' }),
        el('p', null, [
          'Si lo que se quiere es menos error, hay dos caminos: darle a Euler un paso ' +
          'más fino, o cambiar a un método de segundo orden con el paso original. ' +
          'La comparación justa se hace a igual cantidad de evaluaciones de f.'
        ]),
        V.plate(
          V.table({
            columns: [
              { label: 'Corrida' },
              { label: 'h' },
              { label: 'Iteraciones' },
              { label: 'Evaluaciones de f' },
              { label: 'Error absoluto' }
            ],
            rows: [
              {
                cells: [
                  { html: V.methodHeader('euler') },
                  F.trim(halving.eulerAtH.h, 6),
                  String(halving.eulerAtH.steps),
                  String(halving.eulerAtH.evaluations),
                  F.scientific(halving.eulerAtH.error)
                ]
              },
              {
                cells: [
                  { html: V.methodHeader('euler') + ' con h a la mitad' },
                  F.trim(halving.eulerAtHalfH.h, 6),
                  String(halving.eulerAtHalfH.steps),
                  String(halving.eulerAtHalfH.evaluations),
                  F.scientific(halving.eulerAtHalfH.error)
                ],
                className: 'is-current'
              }
            ].concat(halving.secondOrder.map(function (entry) {
              return {
                cells: [
                  { html: V.methodHeader(entry.method) },
                  F.trim(entry.h, 6),
                  String(entry.steps),
                  String(entry.evaluations),
                  F.scientific(entry.error)
                ]
              };
            }))
          }),
          'Euler con el paso a la mitad duplica el trabajo y sigue dejando un error ' +
          'de ' + F.scientific(halving.eulerAtHalfH.error) + '. Los tres métodos de ' +
          'segundo orden, con el mismo número de evaluaciones o menos, bajan el error ' +
          'dos órdenes de magnitud.',
          { flush: true }
        )
      ]),

      // Counterexample
      el('section.block', null, [
        el('h2.block__title', { text: 'El contraejemplo obligatorio' }),
        el('p', null, [
          'Un solo punto no alcanza para ordenar métodos. En el Ejercicio 3e de la ' +
          'práctica 05 (' + counter.odeDisplay + ', y(' + F.trim(counter.x0) + ') = ' +
          F.trim(counter.y0) + ', h = ' + F.trim(counter.h) + '), el método que queda ' +
          'más cerca del valor exacto en ' + counter.varName + ' = ' +
          F.trim(counter.xf) + ' es ',
          el('strong', { text: CONFIG.methodStyle[counterRows[0].method].label }),
          ' — el único de primer orden del grupo.'
        ]),
        V.plate(
          V.table({
            columns: [
              { label: 'Método' },
              { label: 'Orden' },
              { label: 'Valor en ' + counter.varName + ' = ' + F.trim(counter.xf) },
              { label: 'Error absoluto' },
              { label: 'Error relativo' }
            ],
            rows: counterRows.map(function (row, index) {
              return {
                cells: [
                  { html: V.methodHeader(row.method) },
                  'O(h' + (row.order === 1 ? '' : '²') + ')',
                  F.fixed(row.y, 6),
                  F.scientific(row.absolute),
                  F.percent(row.relativePercent)
                ],
                className: index === 0 ? 'is-current' : null
              };
            })
          }),
          'Ejercicio 3e, ordenado por error creciente. El valor exacto es ' +
          F.fixed(counter.exact(counter.xf), 6) + '. Euler acierta aquí por ' +
          'cancelación de errores de signo opuesto, no porque sea mejor: su orden ' +
          'sigue siendo 1 y al refinar h las tres rectas de segundo orden lo dejan ' +
          'atrás.',
          { flush: true }
        ),
        el('p.note', null, [
          'Esta es la razón por la que el criterio C1 mide el orden y no sólo el ' +
          'error en un punto: el orden es una propiedad del método, el error en un ' +
          'punto es una propiedad de la corrida.'
        ])
      ]),

      // Decision guide
      el('section.block', null, [
        el('h2.block__title', { text: 'Guía de decisión' }),
        el('p', null, [
          'Dado un problema concreto, qué método elegir de los cuatro, y por qué.'
        ]),
        el('div.guide', null, [
          el('div.guide__item', { style: 'border-left-color: var(--m-taylor)' }, [
            el('p.guide__when', { text: 'Si f es simple y sus derivadas parciales están a mano' }),
            el('p.guide__pick', { text: 'Taylor 2' }),
            el('p.guide__why', {
              text: 'Alcanza segundo orden con una sola evaluación de f por paso: es ' +
                'el más económico de los tres cuando derivar f no cuesta nada. ' +
                'En el P.V.I. de referencia su error es ' +
                F.scientific(byMethod.taylor2.absolute) + '.'
            })
          ]),
          el('div.guide__item', { style: 'border-left-color: var(--m-mejorado)' }, [
            el('p.guide__when', { text: 'Si f es complicada, tabulada o experimental' }),
            el('p.guide__pick', { text: 'Euler mejorado o RK2' }),
            el('p.guide__why', {
              text: 'Mismo orden que Taylor 2 sin derivar nada: dos evaluaciones de f y ' +
                'listo. Es el caso habitual en ingeniería, donde f sale de un modelo o ' +
                'de una medición y no de una expresión derivable a mano.'
            })
          ]),
          el('div.guide__item', { style: 'border-left-color: var(--m-euler)' }, [
            el('p.guide__when', { text: 'Si sólo hace falta una primera estimación' }),
            el('p.guide__pick', { text: 'Euler' }),
            el('p.guide__why', {
              text: 'Una evaluación por paso y una sola línea de cálculo. Sirve ' +
                'para acotar el orden de magnitud o para arrancar un método de paso ' +
                'múltiple, no para un resultado final: en el P.V.I. de referencia su ' +
                'error relativo es ' + F.percent(byMethod.euler.relativePercent) + '.'
            })
          ]),
          el('div.guide__item', { style: 'border-left-color: var(--m-rk2)' }, [
            el('p.guide__when', { text: 'Entre Euler mejorado y RK2' }),
            el('p.guide__pick', { text: 'Decidirlo con datos' }),
            el('p.guide__why', {
              text: 'Mismo orden y mismo costo: dos evaluaciones por paso, ninguna ' +
                'derivada. Cuál gana cambia según el problema, así que la ' +
                'elección se resuelve corriendo ambos sobre el problema real, no con ' +
                'una regla general. La Mesa de integración sirve exactamente para eso.'
            })
          ])
        ])
      ])
    ];
  }

  var api = { criteria: criteria, evidence: evidence };

  root.EDO = root.EDO || {};
  root.EDO.evidence = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
