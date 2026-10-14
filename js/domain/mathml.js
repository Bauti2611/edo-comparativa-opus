/**
 * Pure MathML string builders. No DOM, no document access, so the module is
 * usable both in the browser and under Node for tests.
 *
 * MathML Core is native in Chrome 109+, Firefox and Safari, which is why the
 * app needs no KaTeX / MathJax at runtime.
 */
(function (root) {
  'use strict';

  var NS = 'http://www.w3.org/1998/Math/MathML';
  var INVISIBLE_TIMES = '⁢';

  function escapeText(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function tag(name, children, attrs) {
    var open = '<' + name;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] === null || attrs[key] === undefined) return;
        open += ' ' + key + '="' + escapeText(attrs[key]) + '"';
      });
    }
    return open + '>' + children + '</' + name + '>';
  }

  function flatten(parts) {
    var out = '';
    for (var i = 0; i < parts.length; i += 1) {
      var part = parts[i];
      if (part === null || part === undefined || part === '') continue;
      out += Array.isArray(part) ? flatten(part) : part;
    }
    return out;
  }

  var mi = function (text, attrs) { return tag('mi', escapeText(text), attrs); };
  var mn = function (text) { return tag('mn', escapeText(text)); };

  /**
   * A *substituted* number, marked so the product builder knows to separate it
   * with a visible dot. `2 x_n y_n` is correct with invisible multiplication,
   * but the same expression with the values plugged in would read "2 1,05 1,1",
   * which is not a product at all.
   */
  function mnLit(text) {
    return tag('mn', escapeText(text), { 'data-lit': '1' });
  }

  /**
   * Mark a composite fragment (a signed value, a parenthesised one) as literal.
   * `alreadyParenthesised` stops `sup` from adding a second pair of brackets.
   */
  function markLit(fragment, alreadyParenthesised) {
    return tag('mrow', flatten([fragment]), {
      'data-lit': '1',
      'data-paren': alreadyParenthesised ? '1' : null
    });
  }

  /** True when the fragment contains a substituted number anywhere inside. */
  function isLit(fragment) {
    return typeof fragment === 'string' && fragment.indexOf('data-lit="1"') >= 0;
  }

  /** True when the fragment *is* a substituted number, not merely contains one. */
  function isLitRoot(fragment) {
    return typeof fragment === 'string' && /^<m[a-z]+\s[^>]*data-lit="1"/.test(fragment);
  }
  var mo = function (text, attrs) { return tag('mo', escapeText(text), attrs); };
  var mtext = function (text) { return tag('mtext', escapeText(text)); };
  var mspace = function (width) { return '<mspace width="' + escapeText(width) + '"/>'; };

  function row() {
    return tag('mrow', flatten(Array.prototype.slice.call(arguments)));
  }

  function frac(numerator, denominator) {
    return tag('mfrac', flatten([numerator, denominator]));
  }

  /**
   * A power. A substituted number as the base gets brackets, because the
   * apunte writes `4*(1.1)^2*1.23` and `1,1²` would be read as one number.
   */
  function sup(base, exponent) {
    var actual = base;
    if (isLitRoot(base) && base.indexOf('data-paren="1"') < 0) {
      actual = paren(base);
    }
    return tag('msup', flatten([actual, exponent]));
  }

  function sub(base, index) {
    return tag('msub', flatten([base, index]));
  }

  function subsup(base, index, exponent) {
    return tag('msubsup', flatten([base, index, exponent]));
  }

  function sqrt(content) {
    return tag('msqrt', flatten([content]));
  }

  function paren(content) {
    return row(mo('(', { stretchy: 'false' }), content, mo(')', { stretchy: 'false' }));
  }

  function bracket(content) {
    return row(mo('[', { stretchy: 'false' }), content, mo(']', { stretchy: 'false' }));
  }

  /**
   * Multiplication the way a textbook writes it: invisible between symbols
   * (`2xy`), but a visible dot as soon as one of the factors is a substituted
   * number, so `2 x_n y_n` becomes `2 ⋅ 1,05 ⋅ 1,1` and never `2 1,05 1,1`.
   */
  function times() {
    var parts = Array.prototype.slice.call(arguments).filter(function (p) {
      return p !== null && p !== undefined && p !== '';
    });
    var out = [];
    for (var i = 0; i < parts.length; i += 1) {
      if (i > 0) {
        var visible = isLit(parts[i - 1]) || isLit(parts[i]);
        out.push(mo(visible ? '⋅' : INVISIBLE_TIMES));
      }
      out.push(parts[i]);
    }
    return row(out);
  }

  /** Explicit multiplication dot, the way the apunte writes `0.1 * [...]`. */
  function dot() {
    var parts = Array.prototype.slice.call(arguments).filter(function (p) {
      return p !== null && p !== undefined && p !== '';
    });
    var out = [];
    for (var i = 0; i < parts.length; i += 1) {
      if (i > 0) out.push(mo('⋅'));
      out.push(parts[i]);
    }
    return row(out);
  }

  /** `y` with a subscript, e.g. yn, yn+1. */
  function yAt(index) {
    return sub(mi('y'), typeof index === 'string' ? mi(index) : index);
  }

  function varAt(name, index) {
    return sub(mi(name), typeof index === 'string' ? mi(index) : index);
  }

  /** Subscript `n+1` as a small row. */
  var nPlus1 = row(mi('n'), mo('+'), mn('1'));
  var nIndex = mi('n');

  /** `y'` / `y''` using the prime character the apunte uses. */
  function prime(index, order) {
    var marks = order === 2 ? '″' : '′';
    return row(sub(mi('y'), typeof index === 'string' ? mi(index) : index), mo(marks));
  }

  /** `f(x, y(x))` in the cátedra's own spelling. */
  function fOf(xPart, yPart) {
    return row(mi('f'), paren(row(xPart, mo(','), yPart)));
  }

  /** Wrap a fragment into a complete `<math>` element string. */
  function math(content, options) {
    var opts = options || {};
    return tag('math', flatten([content]), {
      xmlns: NS,
      display: opts.block === false ? 'inline' : 'block',
      'aria-label': opts.label || null,
      class: opts.className || null
    });
  }

  function inline(content, options) {
    var opts = options || {};
    opts.block = false;
    return math(content, opts);
  }

  /**
   * Format a number the way the app prints numbers everywhere: a fixed number
   * of decimals, with a real minus sign and no exponent surprises.
   */
  function num(value, decimals) {
    if (value === null || value === undefined || !isFinite(value)) return mtext('—');
    var d = decimals === undefined ? 6 : decimals;
    var text = Number(value).toFixed(d);
    if (/^-/.test(text)) {
      return row(mo('−'), mn(text.slice(1)));
    }
    return mn(text);
  }

  var api = {
    NS: NS,
    INVISIBLE_TIMES: INVISIBLE_TIMES,
    escapeText: escapeText,
    mi: mi,
    mn: mn,
    mnLit: mnLit,
    markLit: markLit,
    isLit: isLit,
    isLitRoot: isLitRoot,
    mo: mo,
    mtext: mtext,
    mspace: mspace,
    row: row,
    frac: frac,
    sup: sup,
    sub: sub,
    subsup: subsup,
    sqrt: sqrt,
    paren: paren,
    bracket: bracket,
    times: times,
    dot: dot,
    yAt: yAt,
    varAt: varAt,
    nPlus1: nPlus1,
    nIndex: nIndex,
    prime: prime,
    fOf: fOf,
    math: math,
    inline: inline,
    num: num
  };

  root.EDO = root.EDO || {};
  root.EDO.mathml = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
