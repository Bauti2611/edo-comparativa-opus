/**
 * The four single-step methods of the cátedra's apunte, each returning a full
 * trace so the UI can show every intermediate quantity the apunte shows.
 *
 * Notation follows "Ejemplos resueltos (EDO) - Ing. Diego Amiconi":
 *   Taylor grado 2   y_{n+1} = y_n + h*y_n' + (h^2/2!)*y_n''
 *   Euler            y_{n+1} = y_n + h*y_n'
 *   Euler mejorado   y_{n+1} = y_n + (h/2!)*[ y_n' + f(x_{n+1}, y_n + h*y_n') ]
 *   Runge-Kutta 2    y_{n+1} = y_n + h*[ f(x_n + h/2, y_n + k1/2) ],  k1 = h*y_n'
 */
(function (root) {
  'use strict';

  /** Round half away from zero, to `decimals` places. */
  function roundTo(value, decimals) {
    if (decimals === null || decimals === undefined) return value;
    var factor = Math.pow(10, decimals);
    return (value < 0 ? -1 : 1) * Math.round(Math.abs(value) * factor) / factor;
  }

  /** Drop the digits past `decimals` without rounding. */
  function truncateTo(value, decimals) {
    if (decimals === null || decimals === undefined) return value;
    var factor = Math.pow(10, decimals);
    return (value < 0 ? -1 : 1) * Math.floor(Math.abs(value) * factor) / factor;
  }

  /**
   * Quantize to `decimals` places. `mode` is 'round' (default) or 'truncate':
   * the apunte's hand-worked iterations use both, depending on the iteration.
   */
  function quantize(value, decimals, mode) {
    return mode === 'truncate' ? truncateTo(value, decimals) : roundTo(value, decimals);
  }

  /**
   * Number of iterations needed to walk the domain.
   *
   * When h divides the interval the answer is that quotient, guarded against
   * the floating point drift of (xf - x0) / h — (1.5 - 1) / 0.1 is 5.000000000000001
   * in binary, not 5. When h does NOT divide the interval the march stops at
   * the last point inside the domain rather than stepping past x_f, so a method
   * is never evaluated outside the interval it was given.
   */
  function stepCount(problem, h) {
    var step = h === undefined ? problem.h : h;
    var raw = (problem.xf - problem.x0) / step;
    var nearest = Math.round(raw);
    if (Math.abs(raw - nearest) < 1e-9) return Math.max(0, nearest);
    return Math.max(0, Math.floor(raw));
  }

  /** True when h divides the working interval exactly. */
  function stepDividesDomain(problem, h) {
    var step = h === undefined ? problem.h : h;
    var raw = (problem.xf - problem.x0) / step;
    return Math.abs(raw - Math.round(raw)) < 1e-9;
  }

  /**
   * Shared driver. `advance` receives the current state and returns
   * `{ yNext, extras }`; everything else (x bookkeeping, rounding carry,
   * the point list) is handled once, here.
   */
  function march(problem, options, advance) {
    var opts = options || {};
    var h = opts.h === undefined ? problem.h : opts.h;
    var decimals = opts.decimals === undefined ? null : opts.decimals;
    var mode = opts.mode === undefined ? 'round' : opts.mode;
    var steps = opts.steps === undefined ? stepCount(problem, h) : opts.steps;
    var f = problem.f;

    var x = problem.x0;
    var y = quantize(problem.y0, decimals, mode);
    var rows = [];
    var points = [{ n: 0, x: x, y: y }];

    for (var n = 0; n < steps; n += 1) {
      var xNext = problem.x0 + (n + 1) * h;
      var yPrime = f(x, y);
      var result = advance({ x: x, y: y, h: h, xNext: xNext, yPrime: yPrime, f: f, problem: problem });
      var yNext = quantize(result.yNext, decimals, mode);

      rows.push({
        n: n,
        x: x,
        y: y,
        yPrime: yPrime,
        xNext: xNext,
        yNext: yNext,
        extras: result.extras || {}
      });

      points.push({ n: n + 1, x: xNext, y: yNext });
      x = xNext;
      y = yNext;
    }

    return {
      h: h,
      decimals: decimals,
      mode: decimals === null ? null : mode,
      dividesDomain: stepDividesDomain(problem, h),
      steps: steps,
      rows: rows,
      points: points,
      yFinal: y,
      xFinal: x
    };
  }

  var DESCRIPTORS = {
    euler: {
      id: 'euler',
      name: 'Euler',
      shortName: 'Euler',
      order: 1,
      evaluationsPerStep: 1,
      needsPartials: false,
      family: 'paso simple'
    },
    taylor2: {
      id: 'taylor2',
      name: 'Taylor de grado 2',
      shortName: 'Taylor 2',
      order: 2,
      evaluationsPerStep: 1,
      needsPartials: true,
      family: 'paso simple'
    },
    eulerMejorado: {
      id: 'eulerMejorado',
      name: 'Euler mejorado',
      shortName: 'Euler mej.',
      order: 2,
      evaluationsPerStep: 2,
      needsPartials: false,
      family: 'paso simple'
    },
    rk2Midpoint: {
      id: 'rk2Midpoint',
      name: 'Runge-Kutta de grado 2 (punto medio)',
      shortName: 'RK2',
      order: 2,
      evaluationsPerStep: 2,
      needsPartials: false,
      family: 'paso simple'
    }
  };

  function withDescriptor(id, trace) {
    var d = DESCRIPTORS[id];
    trace.method = id;
    trace.name = d.name;
    trace.shortName = d.shortName;
    trace.order = d.order;
    trace.evaluationsPerStep = d.evaluationsPerStep;
    trace.needsPartials = d.needsPartials;
    return trace;
  }

  /** y_{n+1} = y_n + h*y_n' */
  function euler(problem, options) {
    return withDescriptor('euler', march(problem, options, function (s) {
      var term = s.h * s.yPrime;
      return { yNext: s.y + term, extras: { term: term } };
    }));
  }

  /** y_{n+1} = y_n + h*y_n' + (h^2/2!)*y_n'',  y_n'' = f_x + f_y * y_n' */
  function taylor2(problem, options) {
    if (typeof problem.fx !== 'function' || typeof problem.fy !== 'function') {
      throw new Error('taylor2 requires the analytic partials fx and fy for ' + problem.id);
    }
    return withDescriptor('taylor2', march(problem, options, function (s) {
      var fxValue = s.problem.fx(s.x, s.y);
      var fyValue = s.problem.fy(s.x, s.y);
      var ySecond = fxValue + fyValue * s.yPrime;
      var termFirst = s.h * s.yPrime;
      var termSecond = (s.h * s.h / 2) * ySecond;
      return {
        yNext: s.y + termFirst + termSecond,
        extras: {
          fx: fxValue,
          fy: fyValue,
          ySecond: ySecond,
          termFirst: termFirst,
          termSecond: termSecond
        }
      };
    }));
  }

  /** y_{n+1} = y_n + (h/2!)*[ y_n' + f(x_{n+1}, y_n + h*y_n') ] */
  function eulerMejorado(problem, options) {
    return withDescriptor('eulerMejorado', march(problem, options, function (s) {
      var predictor = s.y + s.h * s.yPrime;
      var fPredictor = s.f(s.xNext, predictor);
      var slopeAverage = (s.yPrime + fPredictor) / 2;
      return {
        yNext: s.y + (s.h / 2) * (s.yPrime + fPredictor),
        extras: {
          predictor: predictor,
          fPredictor: fPredictor,
          slopeAverage: slopeAverage
        }
      };
    }));
  }

  /** y_{n+1} = y_n + h*[ f(x_n + h/2, y_n + k1/2) ],  k1 = h*y_n' */
  function rk2Midpoint(problem, options) {
    return withDescriptor('rk2Midpoint', march(problem, options, function (s) {
      var k1 = s.h * s.yPrime;
      var xMid = s.x + s.h / 2;
      var yMid = s.y + k1 / 2;
      var fMid = s.f(xMid, yMid);
      return {
        yNext: s.y + s.h * fMid,
        extras: { k1: k1, xMid: xMid, yMid: yMid, fMid: fMid }
      };
    }));
  }

  var BY_ID = {
    euler: euler,
    taylor2: taylor2,
    eulerMejorado: eulerMejorado,
    rk2Midpoint: rk2Midpoint
  };

  var ORDER = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

  function run(methodId, problem, options) {
    var fn = BY_ID[methodId];
    if (!fn) throw new Error('Unknown method: ' + methodId);
    return fn(problem, options);
  }

  function runAll(problem, options) {
    var out = {};
    ORDER.forEach(function (id) {
      if (id === 'taylor2' && typeof problem.fx !== 'function') return;
      out[id] = run(id, problem, options);
    });
    return out;
  }

  var api = {
    euler: euler,
    taylor2: taylor2,
    eulerMejorado: eulerMejorado,
    rk2Midpoint: rk2Midpoint,
    run: run,
    runAll: runAll,
    stepCount: stepCount,
    stepDividesDomain: stepDividesDomain,
    roundTo: roundTo,
    truncateTo: truncateTo,
    quantize: quantize,
    descriptors: DESCRIPTORS,
    order: ORDER
  };

  root.EDO = root.EDO || {};
  root.EDO.methods = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
