/**
 * Ejercicios resueltos paso a paso.
 *
 * Each exercise shows: the statement, the four P.V.I. elements, the number of
 * iterations, the ordenada genérica, the full iteration table, the final value
 * and the error against the exact solution when there is one.
 *
 * The default view is the three compared methods side by side on the same
 * exercise, with the práctica's own assigned method highlighted. A selector
 * switches to a single method's full step-by-step detail.
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

  /** Per-exercise view mode: 'comparar' or one method id. */
  var modes = {};

  /**
   * Which worked example of the apunte corresponds to a given problem+method,
   * so the optional verification line can be rendered next to it. Switched off
   * by default through APUNTE_VALUES.mostrarVerificacion in js/config.js.
   */
  var APUNTE_EXAMPLES = (function () {
    var index = {};
    var examples = root.EDO.APUNTE_VALUES.examples;
    Object.keys(examples).forEach(function (key) {
      var problemId = examples[key].problem;
      index[problemId] = (index[problemId] || []).concat(key);
    });
    return index;
  })();

  function detailFor(problem, methodId) {
    var trace = M.run(methodId, problem);
    var ordinate = G.ordinate(methodId, problem);
    var general = G.general(methodId);
    var hasExact = typeof problem.exact === 'function';

    var iterations = trace.rows.map(function (step) {
      var view = G.iteration(methodId, problem, step);
      return el('div.derivation__step', null, [
        el('h4', { text: view.heading }),
        el('span.derivation__label', { text: 'Si n = ' + step.n + ' entonces:' }),
        D.mathBlock(view.symbolic),
        el('span.derivation__label', { text: 'Reemplazando cada valor:' }),
        D.mathBlock(view.substituted),
        view.intermediates.length
          ? el('ul.mesa__intermediates', null, view.intermediates.map(function (entry) {
            return el('li', null, [el('b', { text: entry.label }), D.mathNode(entry.mml)]);
          }))
          : null,
        D.mathBlock(view.result)
      ]);
    });

    var children = [
      el('h3.block__sub', null, [
        el('span.swatch.swatch--' + methodId, { 'aria-hidden': 'true' }),
        M.descriptors[methodId].name
      ]),
      el('span.derivation__label', { text: 'Fórmula general del método:' }),
      D.mathBlock(general.formula),
      V.derivation(general.where),
      el('span.derivation__label', {
        text: 'Reemplazando la f de este problema:'
      }),
      ordinate.steps.length ? V.derivation(ordinate.steps) : null,
      V.ordinateBlock(ordinate.ordinate),
      V.plate(
        V.iterationTable(problem, trace),
        'Tabla completa de iteraciones de ' + M.descriptors[methodId].name +
        ', con las cantidades intermedias que el método calcula en cada paso.',
        { flush: true }
      ),
      el('div.derivation', null, iterations)
    ];

    if (hasExact) {
      var exact = problem.exact(problem.xf);
      children.push(V.answerStrip([
        { term: 'Valor hallado', value: F.fixed(trace.yFinal, 6) },
        { term: 'Valor exacto', value: F.fixed(exact, 6) },
        { term: 'Error absoluto', value: F.scientific(Math.abs(exact - trace.yFinal)) },
        {
          term: 'Error relativo',
          value: F.percent(E.relativeErrorPercent(trace.yFinal, exact))
        }
      ]));
    } else {
      children.push(V.answerStrip([
        { term: 'Valor hallado', value: F.fixed(trace.yFinal, 6) },
        { term: 'Solución analítica', value: 'sin forma cerrada elemental' }
      ]));
    }

    return children;
  }

  function comparisonFor(problem) {
    var hasExact = typeof problem.exact === 'function';
    var rows = E.comparisonTable(problem).filter(function (row) {
      return COMPARED.indexOf(row.method) >= 0;
    });

    var children = [
      el('p', null, [
        'Los tres métodos comparados sobre el mismo P.V.I. El método que asigna ' +
        'la práctica es ',
        el('strong', { text: M.descriptors[problem.assignedMethod].name }),
        (problem.alsoAssigned || []).length
          ? ', y la otra práctica pide el mismo P.V.I. con ' +
            (problem.alsoAssigned || []).map(function (id) {
              return M.descriptors[id].name;
            }).join(' y ') + '.'
          : '.'
      ]),
      V.legend(COMPARED, { exact: hasExact }),
      V.plate(
        V.sideBySideTable(problem, COMPARED),
        'Iteración por iteración, los tres métodos de segundo orden sobre ' +
        problem.odeDisplay.replace(/\bx\b/g, problem.varName) + '.',
        { flush: true }
      )
    ];

    if (hasExact) {
      children.push(V.plate(
        V.table({
          columns: [
            { label: 'Método' },
            { label: 'Valor en ' + problem.varName + ' = ' + F.trim(problem.xf) },
            { label: 'Error absoluto' },
            { label: 'Error relativo' },
            { label: 'Evaluaciones de f' }
          ],
          rows: rows.map(function (row) {
            return {
              cells: [
                { html: V.methodHeader(row.method) },
                F.fixed(row.y, 6),
                F.scientific(row.absolute),
                F.percent(row.relativePercent),
                String(row.steps * row.evaluationsPerStep)
              ],
              className: row.method === problem.assignedMethod ? 'is-current' : null
            };
          })
        }),
        'Resultado final de cada método. La fila resaltada es el método que pide ' +
        'la práctica. El valor exacto es ' + F.fixed(problem.exact(problem.xf), 6) + '.',
        { flush: true }
      ));
    }

    return children;
  }

  function exerciseCard(problem) {
    var mode = modes[problem.id] || 'comparar';
    var body = el('div.exercise__body');
    // Figure numbers run continuously through the chapter, so a re-render of
    // one exercise has to restart from that exercise's own first number.
    var plateBase = null;

    function paint() {
      if (plateBase === null) plateBase = V.plateNumber();
      else V.setPlateNumber(plateBase);
      D.clear(body);
      var current = modes[problem.id] || 'comparar';
      var hasExact = typeof problem.exact === 'function';

      D.append(body, [
        el('p', null, [
          el('strong', { text: 'Enunciado. ' }),
          problem.source + '. Hallar y(' + F.trim(problem.xf) + ') para ' +
          problem.odeDisplay.replace(/\bx\b/g, problem.varName) + ' con ' +
          'y(' + F.trim(problem.x0) + ') = ' + F.trim(problem.y0) + ' y h = ' +
          F.trim(problem.h) + '.'
        ]),
        problem.note ? el('p.note', { text: problem.note }) : null,
        V.pviElements(problem),
        el('p', null, [
          'El dominio de trabajo va de ' + F.trim(problem.x0) + ' a ' +
          F.trim(problem.xf) + ' con paso ' + F.trim(problem.h) + ', de modo que hacen ' +
          'falta ',
          el('strong', { text: M.stepCount(problem) + ' iteraciones' }),
          '.',
          hasExact
            ? ' La solución analítica es ' + problem.exactDisplay +
              ', aporte del grupo, y satisface la ecuación y la condición inicial.'
            : ' Este P.V.I. no tiene solución analítica elemental, así que ' +
              'sólo se pueden comparar los métodos entre sí.'
        ]),
        current === 'comparar' ? comparisonFor(problem) : detailFor(problem, current),
        // Shown only when the group turns `mostrarVerificacion` on; it stays
        // visible in both views because it belongs to the exercise, not to a
        // particular method's step-by-step.
        (APUNTE_EXAMPLES[problem.id] || []).map(function (key) {
          return V.apunteVerification(key);
        })
      ]);
    }

    var selector = el('select', {
      id: 'mode-' + problem.id,
      'aria-label': 'Vista del ejercicio ' + problem.label,
      onChange: function (event) {
        modes[problem.id] = event.target.value;
        paint();
      }
    }, [el('option', {
      value: 'comparar',
      selected: mode === 'comparar',
      text: 'Comparar los tres métodos'
    })].concat(ALL.map(function (id) {
      return el('option', {
        value: id,
        selected: mode === id,
        text: 'Paso a paso · ' + M.descriptors[id].name +
          (id === problem.assignedMethod ? ' (asignado)' : '')
      });
    })));

    paint();

    return el('article.exercise', { id: 'ej-' + problem.id }, [
      el('div.exercise__head', null, [
        el('div', null, [
          el('span.exercise__id', { text: problem.label }),
          el('h3.exercise__ode', {
            text: problem.odeDisplay.replace(/\bx\b/g, problem.varName)
          })
        ]),
        el('div.exercise__assigned', null, [
          'Método de la práctica',
          el('b', { text: M.descriptors[problem.assignedMethod].name }),
          selector
        ])
      ]),
      body
    ]);
  }

  function build() {
    V.resetPlateNumbers();
    return [
      el('p', null, [
        'Los ' + P.catalog.length + ' planteos de las prácticas de la cátedra, ' +
        'resueltos. Cada uno abre comparando los tres métodos sobre el mismo ' +
        'problema; el selector de cada ejercicio cambia a la resolución paso a paso ' +
        'de un método, con su ordenada genérica, su tabla de iteraciones y la ' +
        'aritmética de cada iteración escrita como la escribe el apunte.'
      ]),
      el('p.note', null, [
        'La práctica 05 asigna Taylor al Ejercicio 1, Euler al Ejercicio 2 y Euler ' +
        'mejorado al Ejercicio 3; la práctica 06 asigna Runge-Kutta de grado 2 a su ' +
        'Ejercicio 1, que repite tres de los mismos P.V.I. El Ejercicio 3 de la ' +
        'práctica 05 va a), b), c), e): el ítem d) no existe en el enunciado.'
      ]),
      el('div', null, P.catalog.map(exerciseCard))
    ];
  }

  var api = { build: build };

  root.EDO = root.EDO || {};
  root.EDO.exercises = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
