/**
 * Number formatting shared by the math rendering, the tables and the plots.
 * Spanish convention: decimal comma. The real minus sign U+2212 is used for
 * display so columns of numbers align.
 */
(function (root) {
  'use strict';

  var DECIMAL_SEPARATOR = ',';

  function applySeparator(text) {
    return DECIMAL_SEPARATOR === '.' ? text : text.replace('.', DECIMAL_SEPARATOR);
  }

  /** Fixed decimals, decimal comma, true minus sign. */
  function fixed(value, decimals) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    var d = decimals === undefined ? 6 : decimals;
    var text = Math.abs(Number(value)).toFixed(d);
    return (Number(value) < 0 && Number(text) !== 0 ? '−' : '') + applySeparator(text);
  }

  /**
   * Shortest faithful decimal: up to `maxDecimals` places with trailing zeros
   * removed. Used for the data of a problem (h = 0,1, x = 1,1) so the formulas
   * read like the apunte rather than like a spreadsheet.
   */
  function trim(value, maxDecimals) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    var d = maxDecimals === undefined ? 10 : maxDecimals;
    var text = Number(value).toFixed(d);
    if (text.indexOf('.') >= 0) {
      text = text.replace(/0+$/, '').replace(/\.$/, '');
    }
    if (text === '-0') text = '0';
    return applySeparator(text.replace(/^-/, '−'));
  }

  /** Scientific notation for error magnitudes: 5,625e−1. */
  function scientific(value, significant) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    if (value === 0) return '0';
    var s = significant === undefined ? 4 : significant;
    var text = Number(value).toExponential(s - 1);
    var parts = text.split('e');
    var mantissa = applySeparator(parts[0]).replace(/^-/, '−');
    var exponent = Number(parts[1]);
    return mantissa + 'e' + (exponent < 0 ? '−' : '+') + Math.abs(exponent);
  }

  /** Percentages: 16,117 %. */
  function percent(value, decimals) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return fixed(value, decimals === undefined ? 3 : decimals) + ' %';
  }

  /** Observed convergence order: 1,98. */
  function order(value) {
    if (value === null || value === undefined || !isFinite(value)) return '—';
    return fixed(value, 2);
  }

  var api = {
    DECIMAL_SEPARATOR: DECIMAL_SEPARATOR,
    fixed: fixed,
    trim: trim,
    scientific: scientific,
    percent: percent,
    order: order
  };

  root.EDO = root.EDO || {};
  root.EDO.format = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
