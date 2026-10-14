/**
 * Direction field sampling: f evaluated on a grid, returned as unit-ish
 * segments whose length is clamped so a steep region does not swamp the plot.
 */
(function (root) {
  'use strict';

  /**
   * @param {object} problem  needs `f`
   * @param {object} view     { xMin, xMax, yMin, yMax }
   * @param {object} options  { columns, rows }
   * @returns {{ ticks: Array, maxSlope: number }}
   *   each tick: { x, y, slope, dx, dy } where (dx, dy) is a direction in data
   *   units, already clamped, centred on (x, y).
   */
  function sample(problem, view, options) {
    var opts = options || {};
    var columns = opts.columns || 22;
    var rows = opts.rows || 14;

    var spanX = view.xMax - view.xMin;
    var spanY = view.yMax - view.yMin;
    if (!(spanX > 0) || !(spanY > 0)) return { ticks: [], maxSlope: 0 };

    // A tick is drawn at most this fraction of a cell, so neighbours never touch.
    var cellX = spanX / columns;
    var cellY = spanY / rows;
    var halfLength = 0.38 * Math.min(cellX, cellY / (spanY / spanX));

    var ticks = [];
    var maxSlope = 0;

    for (var i = 0; i < columns; i += 1) {
      var x = view.xMin + cellX * (i + 0.5);
      for (var j = 0; j < rows; j += 1) {
        var y = view.yMin + cellY * (j + 0.5);
        var slope;
        try {
          slope = problem.f(x, y);
        } catch (error) {
          continue;
        }
        if (!isFinite(slope)) continue;

        // Normalise in *screen* proportions so a slope of 1 looks like 45deg
        // regardless of the axis aspect ratio.
        var screenSlope = slope * (spanX / spanY);
        var norm = Math.sqrt(1 + screenSlope * screenSlope);
        var dx = halfLength / norm;
        var dy = (halfLength * screenSlope / norm) * (spanY / spanX);

        maxSlope = Math.max(maxSlope, Math.abs(slope));
        ticks.push({ x: x, y: y, slope: slope, dx: dx, dy: dy });
      }
    }

    return { ticks: ticks, maxSlope: maxSlope };
  }

  /** The exact solution sampled densely, for the reference curve. */
  function exactCurve(problem, view, samples) {
    if (typeof problem.exact !== 'function') return [];
    var count = samples || 180;
    var points = [];
    for (var i = 0; i <= count; i += 1) {
      var x = view.xMin + (view.xMax - view.xMin) * (i / count);
      var y;
      try {
        y = problem.exact(x);
      } catch (error) {
        continue;
      }
      if (isFinite(y)) points.push({ x: x, y: y });
    }
    return points;
  }

  var api = { sample: sample, exactCurve: exactCurve };

  root.EDO = root.EDO || {};
  root.EDO.slopeField = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
