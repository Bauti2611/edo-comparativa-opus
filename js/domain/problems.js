/**
 * The exercise catalog, taken from the cátedra's own prácticas:
 *   - Práctica 05 (P.V.I.): Ej 1 = Taylor, Ej 2 = Euler, Ej 3 = Euler mejorado
 *   - Práctica 06 (2a parte): Ej 1 = Runge-Kutta de grado 2
 *
 * Every problem carries its f and, where the práctica's method needs them, the
 * analytic partials df/dx and df/dy. `exact` is null when the P.V.I. has no
 * elementary closed form.
 *
 * MathML builders take fragments for x and y so the same expression can be
 * rendered symbolically (x_n, y_n) or with numbers substituted.
 */
(function (root) {
  'use strict';

  var M = (root.EDO && root.EDO.mathml) || require('./mathml.js');
  var row = M.row;
  var mi = M.mi;
  var mn = M.mn;
  var mo = M.mo;
  var frac = M.frac;
  var sup = M.sup;
  var times = M.times;
  var paren = M.paren;
  var sqrt = M.sqrt;

  function expOf(exponent) {
    return sup(mi('e'), exponent);
  }

  function neg(part) {
    return row(mo('−'), part);
  }

  var catalog = [
    {
      id: 'p05_1a',
      label: '05 · Ej 1a / 06 · Ej 1a',
      source: 'Práctica 05, Ejercicio 1a · Práctica 06, Ejercicio 1a',
      varName: 'x',
      assignedMethod: 'taylor2',
      alsoAssigned: ['rk2Midpoint'],
      odeDisplay: "y' = −3x²y",
      exactDisplay: 'y = 3e^(−x³)',
      x0: 0, y0: 3, h: 0.1, xf: 0.5,
      f: function (x, y) { return -3 * x * x * y; },
      fx: function (x, y) { return -6 * x * y; },
      fy: function (x) { return -3 * x * x; },
      exact: function (x) { return 3 * Math.exp(-(x * x * x)); },
      mmlF: function (xs, ys) { return row(mo('−'), times(mn('3'), sup(xs, mn('2')), ys)); },
      mmlFx: function (xs, ys) { return row(mo('−'), times(mn('6'), xs, ys)); },
      mmlFy: function (xs) { return row(mo('−'), times(mn('3'), sup(xs, mn('2')))); },
      mmlExact: function (xs) { return times(mn('3'), expOf(row(mo('−'), sup(xs, mn('3'))))); }
    },
    {
      id: 'p05_1b',
      label: '05 · Ej 1b / 06 · Ej 1b',
      source: 'Práctica 05, Ejercicio 1b · Práctica 06, Ejercicio 1b',
      varName: 'x',
      assignedMethod: 'taylor2',
      alsoAssigned: ['rk2Midpoint'],
      odeDisplay: "y' = (1/4)(1 + y²)",
      exactDisplay: 'y = tan(x/4 + π/4)',
      x0: 0, y0: 1, h: 0.1, xf: 0.5,
      f: function (x, y) { return (1 + y * y) / 4; },
      fx: function () { return 0; },
      fy: function (x, y) { return y / 2; },
      exact: function (x) { return Math.tan(x / 4 + Math.PI / 4); },
      mmlF: function (xs, ys) {
        return times(frac(mn('1'), mn('4')), paren(row(mn('1'), mo('+'), sup(ys, mn('2')))));
      },
      mmlFx: function () { return mn('0'); },
      mmlFy: function (xs, ys) { return frac(ys, mn('2')); },
      mmlExact: function (xs) {
        return row(mi('tan'), paren(row(frac(xs, mn('4')), mo('+'), frac(mi('π'), mn('4')))));
      }
    },
    {
      id: 'p05_1c',
      label: '05 · Ej 1c',
      source: 'Práctica 05, Ejercicio 1c',
      varName: 'x',
      assignedMethod: 'taylor2',
      odeDisplay: "y' = 2xy",
      exactDisplay: 'y = e^(x²−1)',
      x0: 1, y0: 1, h: 0.1, xf: 1.3,
      f: function (x, y) { return 2 * x * y; },
      fx: function (x, y) { return 2 * y; },
      fy: function (x) { return 2 * x; },
      exact: function (x) { return Math.exp(x * x - 1); },
      mmlF: function (xs, ys) { return times(mn('2'), xs, ys); },
      mmlFx: function (xs, ys) { return times(mn('2'), ys); },
      mmlFy: function (xs) { return times(mn('2'), xs); },
      // The apunte publishes the simplified y'' for this P.V.I.: 2y + 4x^2 y.
      mmlYSecond: function (xs, ys) {
        return row(times(mn('2'), ys), mo('+'), times(mn('4'), sup(xs, mn('2')), ys));
      },
      mmlExact: function (xs) { return expOf(row(sup(xs, mn('2')), mo('−'), mn('1'))); }
    },
    {
      id: 'p05_1d',
      label: '05 · Ej 1d',
      source: 'Práctica 05, Ejercicio 1d',
      varName: 't',
      assignedMethod: 'taylor2',
      odeDisplay: "y' = (y² + y)/t",
      exactDisplay: 'y = 2t/(1 − 2t)',
      note: 'El enunciado pregunta además cuántas iteraciones son necesarias.',
      x0: 1, y0: -2, h: 0.5, xf: 3,
      f: function (t, y) { return (y * y + y) / t; },
      fx: function (t, y) { return -(y * y + y) / (t * t); },
      fy: function (t, y) { return (2 * y + 1) / t; },
      exact: function (t) { return (2 * t) / (1 - 2 * t); },
      mmlF: function (ts, ys) { return frac(row(sup(ys, mn('2')), mo('+'), ys), ts); },
      mmlFx: function (ts, ys) { return neg(frac(row(sup(ys, mn('2')), mo('+'), ys), sup(ts, mn('2')))); },
      mmlFy: function (ts, ys) { return frac(row(times(mn('2'), ys), mo('+'), mn('1')), ts); },
      mmlExact: function (ts) {
        return frac(times(mn('2'), ts), row(mn('1'), mo('−'), times(mn('2'), ts)));
      }
    },
    {
      id: 'p05_2a',
      label: '05 · Ej 2a',
      source: 'Práctica 05, Ejercicio 2a',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = −y + x + 1",
      exactDisplay: 'y = x + e^(−x)',
      note: 'f es lineal con ∂f/∂x y ∂f/∂y constantes: Taylor 2, Euler mejorado y RK2 coinciden dígito a dígito.',
      x0: 0, y0: 1, h: 0.1, xf: 1,
      f: function (x, y) { return -y + x + 1; },
      fx: function () { return 1; },
      fy: function () { return -1; },
      exact: function (x) { return x + Math.exp(-x); },
      mmlF: function (xs, ys) { return row(mo('−'), ys, mo('+'), xs, mo('+'), mn('1')); },
      mmlFx: function () { return mn('1'); },
      mmlFy: function () { return row(mo('−'), mn('1')); },
      mmlExact: function (xs) { return row(xs, mo('+'), expOf(row(mo('−'), xs))); }
    },
    {
      id: 'p05_2b',
      label: '05 · Ej 2b',
      source: 'Práctica 05, Ejercicio 2b',
      varName: 't',
      assignedMethod: 'euler',
      odeDisplay: "y' = sen(t) + e^(−t)",
      exactDisplay: 'y = 2 − cos(t) − e^(−t)',
      note: 'El apunte aclara: "la variable es t pero es lo mismo que x". El seno se evalúa en radianes.',
      x0: 0, y0: 0, h: 0.5, xf: 1,
      f: function (t) { return Math.sin(t) + Math.exp(-t); },
      fx: function (t) { return Math.cos(t) - Math.exp(-t); },
      fy: function () { return 0; },
      exact: function (t) { return 2 - Math.cos(t) - Math.exp(-t); },
      mmlF: function (ts) { return row(mi('sen'), paren(ts), mo('+'), expOf(row(mo('−'), ts))); },
      mmlFx: function (ts) { return row(mi('cos'), paren(ts), mo('−'), expOf(row(mo('−'), ts))); },
      mmlFy: function () { return mn('0'); },
      mmlExact: function (ts) {
        return row(mn('2'), mo('−'), mi('cos'), paren(ts), mo('−'), expOf(row(mo('−'), ts)));
      }
    },
    {
      id: 'p05_2c',
      label: '05 · Ej 2c',
      source: 'Práctica 05, Ejercicio 2c',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = (x − y)²",
      exactDisplay: null,
      note: 'Sin solución analítica elemental: sólo se pueden comparar los métodos entre sí.',
      x0: 2, y0: 0.5, h: 0.25, xf: 2.75,
      f: function (x, y) { return (x - y) * (x - y); },
      fx: function (x, y) { return 2 * (x - y); },
      fy: function (x, y) { return -2 * (x - y); },
      exact: null,
      mmlF: function (xs, ys) { return sup(paren(row(xs, mo('−'), ys)), mn('2')); },
      mmlFx: function (xs, ys) { return times(mn('2'), paren(row(xs, mo('−'), ys))); },
      mmlFy: function (xs, ys) { return row(mo('−'), times(mn('2'), paren(row(xs, mo('−'), ys)))); },
      mmlExact: null
    },
    {
      id: 'p05_2d_A',
      label: '05 · Ej 2d (h = 0,1)',
      source: 'Práctica 05, Ejercicio 2d · primer planteo',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = xy² − y/x",
      exactDisplay: 'y = 1/(x(2 − x))',
      x0: 1, y0: 1, h: 0.1, xf: 1.5,
      f: function (x, y) { return x * y * y - y / x; },
      fx: function (x, y) { return y * y + y / (x * x); },
      fy: function (x, y) { return 2 * x * y - 1 / x; },
      exact: function (x) { return 1 / (x * (2 - x)); },
      mmlF: function (xs, ys) { return row(times(xs, sup(ys, mn('2'))), mo('−'), frac(ys, xs)); },
      mmlFx: function (xs, ys) { return row(sup(ys, mn('2')), mo('+'), frac(ys, sup(xs, mn('2')))); },
      mmlFy: function (xs, ys) { return row(times(mn('2'), xs, ys), mo('−'), frac(mn('1'), xs)); },
      mmlExact: function (xs) {
        return frac(mn('1'), times(xs, paren(row(mn('2'), mo('−'), xs))));
      }
    },
    {
      id: 'p05_2d_B',
      label: '05 · Ej 2d (h = 0,05)',
      source: 'Práctica 05, Ejercicio 2d · segundo planteo',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = xy² − y/x",
      exactDisplay: 'y = 1/(x(2 − x))',
      x0: 1, y0: 1, h: 0.05, xf: 1.25,
      f: function (x, y) { return x * y * y - y / x; },
      fx: function (x, y) { return y * y + y / (x * x); },
      fy: function (x, y) { return 2 * x * y - 1 / x; },
      exact: function (x) { return 1 / (x * (2 - x)); },
      mmlF: function (xs, ys) { return row(times(xs, sup(ys, mn('2'))), mo('−'), frac(ys, xs)); },
      mmlFx: function (xs, ys) { return row(sup(ys, mn('2')), mo('+'), frac(ys, sup(xs, mn('2')))); },
      mmlFy: function (xs, ys) { return row(times(mn('2'), xs, ys), mo('−'), frac(mn('1'), xs)); },
      mmlExact: function (xs) {
        return frac(mn('1'), times(xs, paren(row(mn('2'), mo('−'), xs))));
      }
    },
    {
      id: 'p05_2e_A',
      label: '05 · Ej 2e (h = 0,1)',
      source: 'Práctica 05, Ejercicio 2e · primer planteo',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = 2x − 3y + 1",
      exactDisplay: 'y = (2x+1)/3 − 2/9 + (38/9)e^(−3(x−1))',
      note: 'f lineal con derivadas parciales constantes: otra vez Taylor 2, Euler mejorado y RK2 coinciden.',
      x0: 1, y0: 5, h: 0.1, xf: 1.5,
      f: function (x, y) { return 2 * x - 3 * y + 1; },
      fx: function () { return 2; },
      fy: function () { return -3; },
      exact: function (x) { return (2 * x + 1) / 3 - 2 / 9 + (38 / 9) * Math.exp(-3 * (x - 1)); },
      mmlF: function (xs, ys) {
        return row(times(mn('2'), xs), mo('−'), times(mn('3'), ys), mo('+'), mn('1'));
      },
      mmlFx: function () { return mn('2'); },
      mmlFy: function () { return row(mo('−'), mn('3')); },
      mmlExact: function (xs) {
        return row(
          frac(row(times(mn('2'), xs), mo('+'), mn('1')), mn('3')),
          mo('−'), frac(mn('2'), mn('9')), mo('+'),
          times(frac(mn('38'), mn('9')), expOf(row(mo('−'), mn('3'), paren(row(xs, mo('−'), mn('1'))))))
        );
      }
    },
    {
      id: 'p05_2e_B',
      label: '05 · Ej 2e (h = 0,05)',
      source: 'Práctica 05, Ejercicio 2e · segundo planteo',
      varName: 'x',
      assignedMethod: 'euler',
      odeDisplay: "y' = 2x − 3y + 1",
      exactDisplay: 'y = (2x+1)/3 − 2/9 + (38/9)e^(−3(x−1))',
      x0: 1, y0: 5, h: 0.05, xf: 1.25,
      f: function (x, y) { return 2 * x - 3 * y + 1; },
      fx: function () { return 2; },
      fy: function () { return -3; },
      exact: function (x) { return (2 * x + 1) / 3 - 2 / 9 + (38 / 9) * Math.exp(-3 * (x - 1)); },
      mmlF: function (xs, ys) {
        return row(times(mn('2'), xs), mo('−'), times(mn('3'), ys), mo('+'), mn('1'));
      },
      mmlFx: function () { return mn('2'); },
      mmlFy: function () { return row(mo('−'), mn('3')); },
      mmlExact: function (xs) {
        return row(
          frac(row(times(mn('2'), xs), mo('+'), mn('1')), mn('3')),
          mo('−'), frac(mn('2'), mn('9')), mo('+'),
          times(frac(mn('38'), mn('9')), expOf(row(mo('−'), mn('3'), paren(row(xs, mo('−'), mn('1'))))))
        );
      }
    },
    {
      id: 'p05_3a',
      label: '05 · Ej 3a / 06 · Ej 1c',
      source: 'Práctica 05, Ejercicio 3a · Práctica 06, Ejercicio 1c',
      varName: 'x',
      assignedMethod: 'eulerMejorado',
      alsoAssigned: ['rk2Midpoint'],
      canonical: true,
      odeDisplay: "y' = 2xy",
      exactDisplay: 'y = e^(x²−1)',
      note: 'Es el P.V.I. que recorre todo el sitio: aparece en el ejemplo de Taylor del apunte, en Euler mejorado 3a y en RK2 1c.',
      x0: 1, y0: 1, h: 0.1, xf: 1.5,
      f: function (x, y) { return 2 * x * y; },
      fx: function (x, y) { return 2 * y; },
      fy: function (x) { return 2 * x; },
      exact: function (x) { return Math.exp(x * x - 1); },
      mmlF: function (xs, ys) { return times(mn('2'), xs, ys); },
      mmlFx: function (xs, ys) { return times(mn('2'), ys); },
      mmlFy: function (xs) { return times(mn('2'), xs); },
      // The apunte publishes the simplified y'' for this P.V.I.: 2y + 4x^2 y.
      mmlYSecond: function (xs, ys) {
        return row(times(mn('2'), ys), mo('+'), times(mn('4'), sup(xs, mn('2')), ys));
      },
      mmlExact: function (xs) { return expOf(row(sup(xs, mn('2')), mo('−'), mn('1'))); }
    },
    {
      id: 'p05_3b',
      label: '05 · Ej 3b',
      source: 'Práctica 05, Ejercicio 3b',
      varName: 'x',
      assignedMethod: 'eulerMejorado',
      odeDisplay: "y' = (x + y − 1)²",
      exactDisplay: 'y = 1 − x + tan(x + arctan 1)',
      x0: 0, y0: 2, h: 0.1, xf: 0.5,
      f: function (x, y) { var u = x + y - 1; return u * u; },
      fx: function (x, y) { return 2 * (x + y - 1); },
      fy: function (x, y) { return 2 * (x + y - 1); },
      exact: function (x) { return 1 - x + Math.tan(x + Math.atan(1)); },
      mmlF: function (xs, ys) {
        return sup(paren(row(xs, mo('+'), ys, mo('−'), mn('1'))), mn('2'));
      },
      mmlFx: function (xs, ys) {
        return times(mn('2'), paren(row(xs, mo('+'), ys, mo('−'), mn('1'))));
      },
      mmlFy: function (xs, ys) {
        return times(mn('2'), paren(row(xs, mo('+'), ys, mo('−'), mn('1'))));
      },
      mmlExact: function (xs) {
        return row(mn('1'), mo('−'), xs, mo('+'), mi('tan'),
          paren(row(xs, mo('+'), mi('arctan'), mn('1'))));
      }
    },
    {
      id: 'p05_3c',
      label: '05 · Ej 3c',
      source: 'Práctica 05, Ejercicio 3c',
      varName: 'x',
      assignedMethod: 'eulerMejorado',
      odeDisplay: "y' = x + y²",
      exactDisplay: null,
      note: 'Ecuación de Riccati: su solución se expresa con funciones de Airy, no con funciones elementales.',
      x0: 0, y0: 0, h: 0.1, xf: 0.5,
      f: function (x, y) { return x + y * y; },
      fx: function () { return 1; },
      fy: function (x, y) { return 2 * y; },
      exact: null,
      mmlF: function (xs, ys) { return row(xs, mo('+'), sup(ys, mn('2'))); },
      mmlFx: function () { return mn('1'); },
      mmlFy: function (xs, ys) { return times(mn('2'), ys); },
      mmlExact: null
    },
    {
      id: 'p05_3e',
      label: '05 · Ej 3e',
      source: 'Práctica 05, Ejercicio 3e',
      varName: 't',
      assignedMethod: 'eulerMejorado',
      odeDisplay: "y' = −t·y + 4t/y",
      exactDisplay: 'y = √(4 − 3e^(−t²))',
      note: 'Contraejemplo útil: en t = 1 Euler queda más cerca que los tres métodos de segundo orden.',
      x0: 0, y0: 1, h: 0.25, xf: 1,
      f: function (t, y) { return -t * y + (4 * t) / y; },
      fx: function (t, y) { return -y + 4 / y; },
      fy: function (t, y) { return -t - (4 * t) / (y * y); },
      exact: function (t) { return Math.sqrt(4 - 3 * Math.exp(-(t * t))); },
      mmlF: function (ts, ys) {
        return row(mo('−'), times(ts, ys), mo('+'), frac(times(mn('4'), ts), ys));
      },
      mmlFx: function (ts, ys) { return row(mo('−'), ys, mo('+'), frac(mn('4'), ys)); },
      mmlFy: function (ts, ys) {
        return row(mo('−'), ts, mo('−'), frac(times(mn('4'), ts), sup(ys, mn('2'))));
      },
      mmlExact: function (ts) {
        return sqrt(row(mn('4'), mo('−'), times(mn('3'),
          expOf(row(mo('−'), sup(ts, mn('2')))))));
      }
    }
  ];

  var byId = {};
  catalog.forEach(function (p) { byId[p.id] = p; });

  var CANONICAL_ID = 'p05_3a';

  function get(id) {
    var p = byId[id];
    if (!p) throw new Error('Unknown problem: ' + id);
    return p;
  }

  function canonical() {
    return get(CANONICAL_ID);
  }

  /** A shallow clone with a different h / xf, for the convergence study. */
  function withStep(problem, h, xf) {
    var clone = Object.create(Object.getPrototypeOf(problem));
    Object.keys(problem).forEach(function (key) { clone[key] = problem[key]; });
    clone.h = h;
    if (xf !== undefined) clone.xf = xf;
    return clone;
  }

  /** The four elements of the P.V.I., as the apunte enumerates them. */
  function elements(problem) {
    var v = problem.varName;
    return [
      { term: 'Ecuación diferencial', value: problem.odeDisplay.replace(/\bx\b/g, v) },
      { term: 'Condición inicial', value: 'y(' + format(problem.x0) + ') = ' + format(problem.y0) },
      {
        term: 'Dominio o intervalo de trabajo',
        value: format(problem.x0) + ' ≤ ' + v + ' ≤ ' + format(problem.xf)
      },
      { term: 'Paso', value: 'h = ' + format(problem.h) }
    ];
  }

  function format(value) {
    if (Number.isInteger(value)) return String(value);
    return String(value).replace('.', ',');
  }

  var api = {
    catalog: catalog,
    byId: byId,
    get: get,
    canonical: canonical,
    CANONICAL_ID: CANONICAL_ID,
    withStep: withStep,
    elements: elements
  };

  root.EDO = root.EDO || {};
  root.EDO.problems = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
