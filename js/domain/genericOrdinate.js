/**
 * The "Ordenada Genérica": the closed explicit formula you obtain after
 * substituting the problem's f into the method's general formula, BEFORE
 * iterating. This module mirrors the apunte's own presentation:
 *
 *   1. the method's general formula, with the "Donde:" block
 *   2. the substitution of the problem's f  ->  ordenada genérica
 *   3. per iteration: "Si n = k entonces:" -> "Reemplazando cada valor:" -> result
 *
 * Everything is returned as MathML strings, so nothing here touches the DOM.
 */
(function (root) {
  'use strict';

  var M = (root.EDO && root.EDO.mathml) || require('./mathml.js');
  var F = (root.EDO && root.EDO.format) || require('./format.js');

  var row = M.row;
  var mi = M.mi;
  var mn = M.mn;
  var mo = M.mo;
  var mtext = M.mtext;
  var frac = M.frac;
  var sup = M.sup;
  var sub = M.sub;
  var times = M.times;
  var dot = M.dot;
  var paren = M.paren;
  var bracket = M.bracket;

  var N = mi('n');
  var N1 = row(mi('n'), mo('+'), mn('1'));

  /**
   * A literal number as a MathML fragment, with the decimal comma. Marked as a
   * literal so `times` separates it with a visible dot instead of the invisible
   * multiplication used between symbols.
   */
  function lit(value, maxDecimals) {
    var text = F.trim(value, maxDecimals === undefined ? 10 : maxDecimals);
    if (text.charAt(0) === '−') {
      return M.markLit(row(mo('−'), M.mnLit(text.slice(1))));
    }
    return M.mnLit(text);
  }

  /** A negative literal needs parentheses inside a product: (−2)·… */
  function litFactor(value, maxDecimals) {
    var frag = lit(value, maxDecimals);
    return value < 0 ? M.markLit(paren(frag), true) : frag;
  }

  /** Symbol set for the symbolic presentation: x_n, y_n, h. */
  function symbols(problem, index) {
    var v = problem.varName;
    var idx = index === undefined ? N : index;
    var idxNext = index === undefined ? N1 : row(index, mo('+'), mn('1'));
    return {
      x: sub(mi(v), idx),
      xNext: sub(mi(v), idxNext),
      y: sub(mi('y'), idx),
      yNext: sub(mi('y'), idxNext),
      yPrime: row(sub(mi('y'), idx), mo('′')),
      ySecond: row(sub(mi('y'), idx), mo('″')),
      h: mi('h'),
      hHalf: frac(mi('h'), mn('2')),
      k1: sub(mi('k'), mn('1'))
    };
  }

  /** Numeric set for one iteration: the actual values at step n. */
  function numerics(problem, step) {
    return {
      x: litFactor(step.x),
      xNext: litFactor(step.xNext),
      y: litFactor(step.y),
      yPrime: litFactor(step.yPrime, 6),
      h: lit(problem.h),
      hHalf: lit(problem.h / 2),
      k1: step.extras && step.extras.k1 !== undefined ? litFactor(step.extras.k1, 6) : null
    };
  }

  /** `h²/2!` the way the apunte writes it. */
  var H2_OVER_2FACT = frac(sup(mi('h'), mn('2')), row(mn('2'), mo('!')));
  var H_OVER_2FACT = frac(mi('h'), row(mn('2'), mo('!')));

  function h2Over2Fact(hValue) {
    return frac(sup(lit(hValue), mn('2')), row(mn('2'), mo('!')));
  }

  function hOver2Fact(hValue) {
    return frac(lit(hValue), row(mn('2'), mo('!')));
  }

  // ---------------------------------------------------------------- general

  /**
   * The method's general formula exactly as the apunte prints it, plus the
   * "Donde:" lines.
   */
  function general(methodId) {
    var s = {
      x: sub(mi('x'), N),
      y: sub(mi('y'), N),
      yNext: sub(mi('y'), N1),
      yPrime: row(sub(mi('y'), N), mo('′')),
      ySecond: row(sub(mi('y'), N), mo('″')),
      xNext: sub(mi('x'), N1),
      h: mi('h')
    };
    var fOfN = row(mi('f'), paren(row(s.x, mo(','), row(mi('y'), paren(s.x)))));
    var whereYPrime = { label: 'Donde:', mml: M.math(row(s.yPrime, mo('='), fOfN)) };

    if (methodId === 'euler') {
      return {
        formula: M.math(row(s.yNext, mo('='), s.y, mo('+'), dot(s.h, s.yPrime))),
        where: [whereYPrime],
        idea: 'Una sola recta tangente por paso: avanzar sobre la pendiente del punto de partida.'
      };
    }

    if (methodId === 'taylor2') {
      return {
        formula: M.math(row(
          s.yNext, mo('='), s.y, mo('+'), dot(s.h, s.yPrime), mo('+'),
          dot(H2_OVER_2FACT, s.ySecond)
        )),
        where: [
          whereYPrime,
          {
            label: '',
            mml: M.math(row(
              s.ySecond, mo('='),
              frac(row(mo('∂'), mi('f')), row(mo('∂'), mi('x'))), mo('+'),
              dot(frac(row(mo('∂'), mi('f')), row(mo('∂'), mi('y'))), s.yPrime)
            ))
          }
        ],
        idea: 'Conservar el término cuadrático de la serie de Taylor, al precio de derivar f.'
      };
    }

    if (methodId === 'eulerMejorado') {
      var predictor = row(s.y, mo('+'), dot(s.h, s.yPrime));
      return {
        formula: M.math(row(
          s.yNext, mo('='), s.y, mo('+'),
          dot(H_OVER_2FACT, bracket(row(
            fOfN, mo('+'),
            row(mi('f'), paren(row(s.xNext, mo(','), predictor)))
          )))
        )),
        where: [
          whereYPrime,
          {
            label: 'Entonces:',
            mml: M.math(row(
              s.yNext, mo('='), s.y, mo('+'),
              dot(H_OVER_2FACT, bracket(row(
                s.yPrime, mo('+'),
                row(mi('f'), paren(row(s.xNext, mo(','), predictor)))
              )))
            ))
          }
        ],
        idea: 'Predecir con la tangente, medir la pendiente en el punto predicho y promediar las dos.'
      };
    }

    if (methodId === 'rk2Midpoint') {
      var k1 = sub(mi('k'), mn('1'));
      return {
        formula: M.math(row(
          s.yNext, mo('='), s.y, mo('+'),
          dot(s.h, bracket(row(mi('f'), paren(row(
            row(s.x, mo('+'), frac(s.h, mn('2'))), mo(';'),
            row(s.y, mo('+'), frac(k1, mn('2')))
          )))))
        )),
        where: [
          {
            label: 'Donde:',
            mml: M.math(row(k1, mo('='), dot(s.h, fOfN), mo('='), dot(s.h, s.yPrime)))
          }
        ],
        idea: 'Sondear el punto medio del paso y volver con esa pendiente, sin derivar f.'
      };
    }

    throw new Error('Unknown method: ' + methodId);
  }

  // --------------------------------------------------------------- ordinate

  /**
   * The ordenada genérica for one method x one problem: the general formula
   * with the problem's f already substituted.
   *
   * @returns {{ steps: Array<{label: string, mml: string}>, ordinate: string }}
   */
  function ordinate(methodId, problem, index) {
    var s = symbols(problem, index);
    var fAt = function (xs, ys) { return bracket(problem.mmlF(xs, ys)); };
    var steps = [];

    if (methodId === 'euler') {
      var eulerOrdinate = M.math(row(
        s.yNext, mo('='), s.y, mo('+'), dot(s.h, fAt(s.x, s.y))
      ));
      return { steps: [], ordinate: eulerOrdinate };
    }

    if (methodId === 'taylor2') {
      steps.push({
        label: 'Reemplazando y′ₙ del enunciado:',
        mml: M.math(row(
          s.yNext, mo('='), s.y, mo('+'), dot(s.h, fAt(s.x, s.y)), mo('+'),
          dot(H2_OVER_2FACT, s.ySecond)
        ))
      });
      var ySecondExpr = problem.mmlYSecond
        ? problem.mmlYSecond(s.x, s.y)
        : row(
          paren(problem.mmlFx(s.x, s.y)), mo('+'),
          dot(paren(problem.mmlFy(s.x, s.y)), paren(problem.mmlF(s.x, s.y)))
        );
      steps.push({
        label: 'Pero:',
        mml: M.math(row(
          s.ySecond, mo('='),
          frac(row(mo('∂'), mi('f')), row(mo('∂'), mi(problem.varName))), mo('+'),
          dot(frac(row(mo('∂'), mi('f')), row(mo('∂'), mi('y'))), s.yPrime),
          mo('='),
          ySecondExpr
        ))
      });
      return {
        steps: steps,
        ordinate: M.math(row(
          s.yNext, mo('='), s.y, mo('+'), dot(s.h, fAt(s.x, s.y)), mo('+'),
          dot(H2_OVER_2FACT, bracket(ySecondExpr))
        ))
      };
    }

    if (methodId === 'eulerMejorado') {
      var predictorExpr = row(s.y, mo('+'), dot(s.h, problem.mmlF(s.x, s.y)));
      steps.push({
        label: 'El argumento del segundo término es el valor predicho en ' +
          problem.varName + 'ₙ₊₁:',
        mml: M.math(row(
          s.y, mo('+'), dot(s.h, s.yPrime), mo('='), predictorExpr
        ))
      });
      return {
        steps: steps,
        ordinate: M.math(row(
          s.yNext, mo('='), s.y, mo('+'),
          dot(H_OVER_2FACT, bracket(row(
            problem.mmlF(s.x, s.y), mo('+'),
            problem.mmlF(s.xNext, paren(predictorExpr))
          )))
        ))
      };
    }

    if (methodId === 'rk2Midpoint') {
      steps.push({
        label: 'Donde:',
        mml: M.math(row(s.k1, mo('='), dot(s.h, bracket(problem.mmlF(s.x, s.y)))))
      });
      return {
        steps: steps,
        ordinate: M.math(row(
          s.yNext, mo('='), s.y, mo('+'),
          dot(s.h, bracket(problem.mmlF(
            paren(row(s.x, mo('+'), frac(s.h, mn('2')))),
            paren(row(s.y, mo('+'), frac(s.k1, mn('2'))))
          )))
        ))
      };
    }

    throw new Error('Unknown method: ' + methodId);
  }

  // -------------------------------------------------------------- iteration

  /**
   * One iteration, presented the apunte's way:
   *   "Si n = k entonces:"   -> the ordenada genérica with k in the subscripts
   *   "Reemplazando cada valor:" -> every symbol replaced by its number
   *   result                 -> y_{k+1} = value = y(x_{k+1})
   */
  function iteration(methodId, problem, step, options) {
    var opts = options || {};
    var decimals = opts.decimals === undefined ? 6 : opts.decimals;
    var k = mn(String(step.n));
    var kNext = mn(String(step.n + 1));
    var v = problem.varName;

    var sym = {
      x: sub(mi(v), k),
      xNext: sub(mi(v), kNext),
      y: sub(mi('y'), k),
      yNext: sub(mi('y'), kNext),
      yPrime: row(sub(mi('y'), k), mo('′')),
      ySecond: row(sub(mi('y'), k), mo('″')),
      h: mi('h'),
      k1: sub(mi('k'), mn('1'))
    };
    var num = numerics(problem, step);

    var symbolic;
    var substituted;
    var intermediates = [];

    if (methodId === 'euler') {
      symbolic = row(sym.yNext, mo('='), sym.y, mo('+'),
        dot(sym.h, bracket(problem.mmlF(sym.x, sym.y))));
      substituted = row(sym.yNext, mo('='), num.y, mo('+'),
        dot(num.h, bracket(problem.mmlF(num.x, num.y))));
    } else if (methodId === 'taylor2') {
      var ySecondSym = problem.mmlYSecond
        ? problem.mmlYSecond(sym.x, sym.y)
        : row(paren(problem.mmlFx(sym.x, sym.y)), mo('+'),
          dot(paren(problem.mmlFy(sym.x, sym.y)), paren(problem.mmlF(sym.x, sym.y))));
      var ySecondNum = problem.mmlYSecond
        ? problem.mmlYSecond(num.x, num.y)
        : row(paren(problem.mmlFx(num.x, num.y)), mo('+'),
          dot(paren(problem.mmlFy(num.x, num.y)), paren(problem.mmlF(num.x, num.y))));
      symbolic = row(sym.yNext, mo('='), sym.y, mo('+'),
        dot(sym.h, bracket(problem.mmlF(sym.x, sym.y))), mo('+'),
        dot(H2_OVER_2FACT, bracket(ySecondSym)));
      substituted = row(sym.yNext, mo('='), num.y, mo('+'),
        dot(num.h, bracket(problem.mmlF(num.x, num.y))), mo('+'),
        dot(h2Over2Fact(problem.h), bracket(ySecondNum)));
      intermediates.push({
        label: 'y′ en el punto',
        mml: M.inline(row(sym.yPrime, mo('='), lit(step.yPrime, 6)))
      });
      intermediates.push({
        label: 'y″ en el punto',
        mml: M.inline(row(sym.ySecond, mo('='), lit(step.extras.ySecond, 6)))
      });
    } else if (methodId === 'eulerMejorado') {
      var predSym = row(sym.y, mo('+'), dot(sym.h, problem.mmlF(sym.x, sym.y)));
      var predNum = row(num.y, mo('+'), dot(num.h, problem.mmlF(num.x, num.y)));
      symbolic = row(sym.yNext, mo('='), sym.y, mo('+'),
        dot(H_OVER_2FACT, bracket(row(
          problem.mmlF(sym.x, sym.y), mo('+'),
          problem.mmlF(sym.xNext, paren(predSym))
        ))));
      substituted = row(sym.yNext, mo('='), num.y, mo('+'),
        dot(hOver2Fact(problem.h), bracket(row(
          problem.mmlF(num.x, num.y), mo('+'),
          problem.mmlF(num.xNext, paren(predNum))
        ))));
      intermediates.push({
        label: 'Valor predicho',
        mml: M.inline(row(sym.y, mo('+'), dot(sym.h, sym.yPrime), mo('='),
          lit(step.extras.predictor, 6)))
      });
      intermediates.push({
        label: 'Pendiente en el punto predicho',
        mml: M.inline(row(mi('f'), paren(row(sym.xNext, mo(','),
          mtext('predicho'))), mo('='), lit(step.extras.fPredictor, 6)))
      });
    } else if (methodId === 'rk2Midpoint') {
      symbolic = row(sym.yNext, mo('='), sym.y, mo('+'),
        dot(sym.h, bracket(problem.mmlF(
          paren(row(sym.x, mo('+'), frac(sym.h, mn('2')))),
          paren(row(sym.y, mo('+'), frac(sym.k1, mn('2'))))
        ))));
      substituted = row(sym.yNext, mo('='), num.y, mo('+'),
        dot(num.h, bracket(problem.mmlF(
          litFactor(step.extras.xMid, 6),
          litFactor(step.extras.yMid, 6)
        ))));
      intermediates.push({
        label: 'Primer coeficiente',
        mml: M.inline(row(sym.k1, mo('='), dot(sym.h, sym.yPrime), mo('='),
          lit(step.extras.k1, 6)))
      });
      intermediates.push({
        label: 'Punto medio sondeado',
        mml: M.inline(row(paren(row(
          row(sym.x, mo('+'), frac(sym.h, mn('2'))), mo(';'),
          row(sym.y, mo('+'), frac(sym.k1, mn('2')))
        )), mo('='), paren(row(lit(step.extras.xMid, 6), mo(';'),
          lit(step.extras.yMid, 6)))))
      });
      intermediates.push({
        label: 'Pendiente en el punto medio',
        mml: M.inline(row(mi('f'), paren(mtext('punto medio')), mo('='),
          lit(step.extras.fMid, 6)))
      });
    } else {
      throw new Error('Unknown method: ' + methodId);
    }

    var result = row(
      sym.yNext, mo('='), lit(step.yNext, decimals), mo('='),
      row(mi('y'), paren(sym.xNext)), mo('='),
      row(mi('y'), paren(lit(step.xNext)))
    );

    return {
      n: step.n,
      heading: 'Iteración n = ' + step.n,
      symbolic: M.math(symbolic),
      substituted: M.math(substituted),
      intermediates: intermediates,
      result: M.math(result)
    };
  }

  var api = {
    general: general,
    ordinate: ordinate,
    iteration: iteration,
    lit: lit
  };

  root.EDO = root.EDO || {};
  root.EDO.genericOrdinate = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
