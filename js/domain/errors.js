/**
 * Error and convergence analysis.
 *
 * IMPORTANT (and stated in the site itself): the cátedra's apunte and prácticas
 * present the four methods procedurally. They contain no analytical solutions,
 * no error formulas, no O(h^n) notation and no convergence criteria. Everything
 * in this module is the group's own addition, following
 *   - Chapra, S. & Canale, R. "Métodos numéricos para ingenieros", McGraw-Hill
 *   - Burden, R. & Faires, J. "Análisis numérico", Cengage
 */
(function (root) {
  'use strict';

  var methods = (root.EDO && root.EDO.methods) || require('./methods.js');
  var problems = (root.EDO && root.EDO.problems) || require('./problems.js');

  function absoluteError(approx, exact) {
    return Math.abs(exact - approx);
  }

  /** Relative error as a percentage. Null when the exact value is zero. */
  function relativeErrorPercent(approx, exact) {
    if (exact === 0) return null;
    return Math.abs((exact - approx) / exact) * 100;
  }

  /**
   * Per-iteration error table for one trace. Returns one row per computed
   * point (including n = 0), with nulls where the problem has no exact solution.
   */
  function errorTable(problem, trace) {
    var hasExact = typeof problem.exact === 'function';
    return trace.points.map(function (point) {
      var exact = hasExact ? problem.exact(point.x) : null;
      return {
        n: point.n,
        x: point.x,
        y: point.y,
        exact: exact,
        absolute: hasExact ? absoluteError(point.y, exact) : null,
        relativePercent: hasExact ? relativeErrorPercent(point.y, exact) : null
      };
    });
  }

  /** Error at the final point of the domain. */
  function finalError(problem, trace) {
    var table = errorTable(problem, trace);
    return table[table.length - 1];
  }

  /**
   * Convergence study: run `methodId` on `problem` for every h in `hList` and
   * report the global error at x_f plus the observed order
   *   p = log2( e_h / e_{h/2} )
   * for each consecutive pair of a halving refinement.
   */
  function convergence(problem, methodId, hList) {
    if (typeof problem.exact !== 'function') {
      throw new Error('convergence needs an exact solution; ' + problem.id + ' has none');
    }
    var exactAtEnd = problem.exact(problem.xf);
    var entries = hList.map(function (h) {
      var trace = methods.run(methodId, problems.withStep(problem, h));
      var error = absoluteError(trace.yFinal, exactAtEnd);
      return {
        h: h,
        steps: trace.steps,
        y: trace.yFinal,
        xLast: trace.xFinal,
        /**
         * False when h does not divide the interval. The march then stops at
         * the last point inside the domain, so "the error at x_f" is measured
         * against a point the method never reached: the row is still shown, but
         * it is not a usable point of the convergence study.
         */
        dividesDomain: trace.dividesDomain,
        error: error,
        observedOrder: null
      };
    });

    for (var i = 1; i < entries.length; i += 1) {
      var previous = entries[i - 1];
      var current = entries[i];
      var ratio = previous.h / current.h;
      var comparable = previous.dividesDomain && current.dividesDomain;
      if (comparable && previous.error > 0 && current.error > 0 && ratio > 1) {
        entries[i].observedOrder =
          Math.log(previous.error / current.error) / Math.log(ratio);
      }
    }

    return {
      method: methodId,
      problem: problem.id,
      exactAtEnd: exactAtEnd,
      entries: entries,
      /** Order measured on the two finest steps, the most reliable estimate. */
      finestOrder: entries.length > 1 ? entries[entries.length - 1].observedOrder : null
    };
  }

  /** Convergence for several methods at once, keyed by method id. */
  function convergenceAll(problem, hList, methodIds) {
    var ids = methodIds || methods.order;
    var out = {};
    ids.forEach(function (id) {
      out[id] = convergence(problem, id, hList);
    });
    return out;
  }

  /**
   * The "halve h or change method" comparison: Euler with h/2 against each
   * second-order method with the original h.
   */
  function halveVersusChange(problem, h) {
    var base = problem.h === h ? problem : problems.withStep(problem, h);
    var exactAtEnd = problem.exact(problem.xf);
    var eulerHalf = methods.euler(problems.withStep(problem, h / 2));
    var out = {
      h: h,
      exactAtEnd: exactAtEnd,
      eulerAtH: null,
      eulerAtHalfH: {
        h: h / 2,
        steps: eulerHalf.steps,
        y: eulerHalf.yFinal,
        error: absoluteError(eulerHalf.yFinal, exactAtEnd),
        evaluations: eulerHalf.steps * 1
      },
      secondOrder: []
    };

    var eulerBase = methods.euler(base);
    out.eulerAtH = {
      h: h,
      steps: eulerBase.steps,
      y: eulerBase.yFinal,
      error: absoluteError(eulerBase.yFinal, exactAtEnd),
      evaluations: eulerBase.steps * 1
    };

    ['taylor2', 'eulerMejorado', 'rk2Midpoint'].forEach(function (id) {
      var trace = methods.run(id, base);
      out.secondOrder.push({
        method: id,
        name: trace.name,
        h: h,
        steps: trace.steps,
        y: trace.yFinal,
        error: absoluteError(trace.yFinal, exactAtEnd),
        evaluations: trace.steps * trace.evaluationsPerStep
      });
    });

    return out;
  }

  /** One comparison row per method on the same problem. */
  function comparisonTable(problem, options) {
    var hasExact = typeof problem.exact === 'function';
    var exactAtEnd = hasExact ? problem.exact(problem.xf) : null;
    return methods.order.map(function (id) {
      var trace = methods.run(id, problem, options);
      return {
        method: id,
        name: trace.name,
        shortName: trace.shortName,
        order: trace.order,
        evaluationsPerStep: trace.evaluationsPerStep,
        needsPartials: trace.needsPartials,
        steps: trace.steps,
        y: trace.yFinal,
        exact: exactAtEnd,
        absolute: hasExact ? absoluteError(trace.yFinal, exactAtEnd) : null,
        relativePercent: hasExact ? relativeErrorPercent(trace.yFinal, exactAtEnd) : null
      };
    });
  }

  var api = {
    absoluteError: absoluteError,
    relativeErrorPercent: relativeErrorPercent,
    errorTable: errorTable,
    finalError: finalError,
    convergence: convergence,
    convergenceAll: convergenceAll,
    halveVersusChange: halveVersusChange,
    comparisonTable: comparisonTable
  };

  root.EDO = root.EDO || {};
  root.EDO.errors = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
