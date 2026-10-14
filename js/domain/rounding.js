/**
 * "Arrastre de redondeo": iterate carrying values rounded to N decimals, the
 * way the apunte works the examples by hand. Default off; the UI exposes it as
 * a switch because it changes the digits, not the method.
 */
(function (root) {
  'use strict';

  var methods = (root.EDO && root.EDO.methods) || require('./methods.js');

  var DEFAULT_DECIMALS = 4;

  /**
   * Run a method carrying `decimals` decimals between iterations.
   * `mode` is 'round' (default) or 'truncate'.
   */
  function runRounded(methodId, problem, decimals, options) {
    var opts = Object.assign({}, options || {});
    opts.decimals = decimals === undefined ? DEFAULT_DECIMALS : decimals;
    return methods.run(methodId, problem, opts);
  }

  /**
   * Both runs side by side: full double precision and the rounding carry, with
   * the per-iteration difference. This is what the UI switch compares.
   */
  function compare(methodId, problem, decimals, options) {
    var d = decimals === undefined ? DEFAULT_DECIMALS : decimals;
    var full = methods.run(methodId, problem, options);
    var rounded = runRounded(methodId, problem, d, options);
    return {
      method: methodId,
      decimals: d,
      full: full,
      rounded: rounded,
      rows: full.points.map(function (point, index) {
        var carried = rounded.points[index];
        return {
          n: point.n,
          x: point.x,
          full: point.y,
          rounded: carried ? carried.y : null,
          difference: carried ? Math.abs(point.y - carried.y) : null
        };
      })
    };
  }

  var api = {
    DEFAULT_DECIMALS: DEFAULT_DECIMALS,
    runRounded: runRounded,
    compare: compare,
    roundTo: methods.roundTo,
    truncateTo: methods.truncateTo,
    quantize: methods.quantize
  };

  root.EDO = root.EDO || {};
  root.EDO.rounding = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
