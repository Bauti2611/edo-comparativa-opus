/**
 * SVG plotting. Hand-built, because the brief forbids any runtime CDN and the
 * site needs exactly three pictures: the slope field with the methods marching
 * over it, the error curves, and the log-log convergence plot.
 *
 * Colour never carries identity alone: every series also gets its own dash
 * pattern, its own marker shape and, where it fits, a direct label.
 */
(function (root) {
  'use strict';

  var D = (root.EDO && root.EDO.dom) || require('./dom.js');
  var F = (root.EDO && root.EDO.format) || require('../domain/format.js');
  var CONFIG = (root.EDO && root.EDO.config) || require('../config.js').config;

  var svg = D.svg;

  /** Axis ticks at 1 / 2 / 5 x 10^k, covering [min, max]. */
  function niceTicks(min, max, target) {
    var count = target || 6;
    var span = max - min;
    if (!(span > 0)) return [min];
    var raw = span / count;
    var magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    var normalized = raw / magnitude;
    var step = magnitude * (normalized > 5 ? 10 : normalized > 2 ? 5 : normalized > 1 ? 2 : 1);
    var first = Math.ceil(min / step) * step;
    var ticks = [];
    for (var value = first; value <= max + step * 1e-6; value += step) {
      ticks.push(Math.abs(value) < step * 1e-9 ? 0 : value);
    }
    return ticks;
  }

  function markerFor(shape, cx, cy, size, attrs) {
    var r = size / 2;
    var options = Object.assign({ class: 'plot__marker' }, attrs || {});
    if (shape === 'square') {
      return svg('rect', Object.assign({
        x: cx - r, y: cy - r, width: size, height: size
      }, options));
    }
    if (shape === 'triangle') {
      var t = [
        [cx, cy - r * 1.15],
        [cx + r * 1.05, cy + r * 0.8],
        [cx - r * 1.05, cy + r * 0.8]
      ];
      return svg('polygon', Object.assign({
        points: t.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ')
      }, options));
    }
    if (shape === 'diamond') {
      var d = [
        [cx, cy - r * 1.2], [cx + r * 1.2, cy], [cx, cy + r * 1.2], [cx - r * 1.2, cy]
      ];
      return svg('polygon', Object.assign({
        points: d.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ')
      }, options));
    }
    return svg('circle', Object.assign({ cx: cx, cy: cy, r: r }, options));
  }

  /**
   * A linear plotting surface.
   * @param {object} spec { width, height, view:{xMin,xMax,yMin,yMax}, pad, title }
   */
  function surface(spec) {
    var width = spec.width || 780;
    var height = spec.height || 470;
    // The right gutter has to hold the longest direct label ("RK2 punto medio").
    var pad = Object.assign({ top: 20, right: 136, bottom: 44, left: 62 }, spec.pad || {});
    var view = spec.view;

    var plotWidth = width - pad.left - pad.right;
    var plotHeight = height - pad.top - pad.bottom;

    function sx(x) {
      return pad.left + ((x - view.xMin) / (view.xMax - view.xMin)) * plotWidth;
    }

    function sy(y) {
      return pad.top + plotHeight - ((y - view.yMin) / (view.yMax - view.yMin)) * plotHeight;
    }

    var layers = {
      grid: svg('g'),
      field: svg('g.plot__field'),
      series: svg('g'),
      overlay: svg('g'),
      labels: svg('g')
    };

    var rootNode = svg('svg.plot', {
      viewBox: '0 0 ' + width + ' ' + height,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': spec.title || 'Gráfico'
    }, [layers.grid, layers.field, layers.series, layers.overlay, layers.labels]);

    return {
      node: rootNode,
      layers: layers,
      sx: sx,
      sy: sy,
      view: view,
      width: width,
      height: height,
      pad: pad,
      plotWidth: plotWidth,
      plotHeight: plotHeight,
      /** Direct labels, resolved against each other by `flushLabels`. */
      pendingLabels: []
    };
  }

  /**
   * Draw the collected direct labels in the right-hand gutter, pushed apart so
   * they never overlap and never leave the drawing area. Direct labels are what
   * keeps identity off colour alone, so they have to stay legible.
   */
  function flushLabels(s, options) {
    var opts = options || {};
    var gap = opts.gap || 15;
    var x = s.pad.left + s.plotWidth + (opts.offset || 8);
    var top = s.pad.top + 4;
    var bottom = s.pad.top + s.plotHeight;

    var labels = s.pendingLabels.slice().sort(function (a, b) { return a.y - b.y; });
    if (!labels.length) return s;

    // First pass: keep the natural order, push down where they collide.
    var previous = -Infinity;
    labels.forEach(function (label) {
      label.placed = Math.max(label.y, previous + gap, top);
      previous = label.placed;
    });

    // Second pass: if the stack ran past the bottom, push the whole run up.
    var overshoot = labels[labels.length - 1].placed - bottom;
    if (overshoot > 0) {
      for (var i = labels.length - 1; i >= 0; i -= 1) {
        labels[i].placed -= overshoot;
        if (i > 0 && labels[i - 1].placed > labels[i].placed - gap) {
          overshoot = labels[i - 1].placed - (labels[i].placed - gap);
        } else {
          break;
        }
      }
    }

    labels.forEach(function (label) {
      var y = Math.max(top, Math.min(bottom, label.placed));
      // A hairline leader when the label had to move away from its series.
      if (Math.abs(y - label.y) > 3) {
        s.layers.labels.appendChild(svg('line.plot__grid', {
          x1: s.pad.left + s.plotWidth + 2, y1: label.y,
          x2: x - 2, y2: y - 4
        }));
      }
      s.layers.labels.appendChild(svg('text.plot__direct-label', {
        x: x,
        y: y,
        dataset: label.method ? { method: label.method } : null,
        fill: label.method ? null : 'currentColor',
        text: label.text
      }));
    });

    s.pendingLabels = [];
    return s;
  }

  /** Grid, frame and tick labels. */
  function drawAxes(s, options) {
    var opts = options || {};
    var xTicks = opts.xTicks || niceTicks(s.view.xMin, s.view.xMax, 6);
    var yTicks = opts.yTicks || niceTicks(s.view.yMin, s.view.yMax, 5);
    var fmt = opts.format || function (value) { return F.trim(value, 4); };
    var xFmt = opts.xFormat || fmt;
    var yFmt = opts.yFormat || fmt;

    xTicks.forEach(function (x) {
      s.layers.grid.appendChild(svg('line.plot__grid', {
        x1: s.sx(x), y1: s.pad.top, x2: s.sx(x), y2: s.pad.top + s.plotHeight
      }));
      s.layers.labels.appendChild(svg('text.plot__label', {
        x: s.sx(x), y: s.pad.top + s.plotHeight + 18, 'text-anchor': 'middle', text: xFmt(x)
      }));
    });

    yTicks.forEach(function (y) {
      s.layers.grid.appendChild(svg('line.plot__grid', {
        x1: s.pad.left, y1: s.sy(y), x2: s.pad.left + s.plotWidth, y2: s.sy(y)
      }));
      s.layers.labels.appendChild(svg('text.plot__label', {
        x: s.pad.left - 9, y: s.sy(y) + 4, 'text-anchor': 'end', text: yFmt(y)
      }));
    });

    s.layers.grid.appendChild(svg('rect.plot__axis', {
      x: s.pad.left, y: s.pad.top, width: s.plotWidth, height: s.plotHeight
    }));

    if (opts.xLabel) {
      s.layers.labels.appendChild(svg('text.plot__label.plot__label--axis', {
        x: s.pad.left + s.plotWidth, y: s.height - 8, 'text-anchor': 'end', text: opts.xLabel
      }));
    }
    if (opts.yLabel) {
      s.layers.labels.appendChild(svg('text.plot__label.plot__label--axis', {
        x: s.pad.left, y: s.pad.top - 7, 'text-anchor': 'start', text: opts.yLabel
      }));
    }
    return s;
  }

  /** The direction field: short strokes tangent to f at each grid point. */
  function drawSlopeField(s, field) {
    field.ticks.forEach(function (tick) {
      s.layers.field.appendChild(svg('line', {
        x1: s.sx(tick.x - tick.dx), y1: s.sy(tick.y - tick.dy),
        x2: s.sx(tick.x + tick.dx), y2: s.sy(tick.y + tick.dy)
      }));
    });
    return s;
  }

  function pathFrom(s, points) {
    return points.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + s.sx(point.x).toFixed(2) + ' ' + s.sy(point.y).toFixed(2);
    }).join(' ');
  }

  /** A smooth reference curve, drawn dashed in ink. */
  function drawExactCurve(s, points, label) {
    if (!points.length) return s;
    s.layers.series.appendChild(svg('path.plot__series.plot__series--exact', {
      d: pathFrom(s, points),
      'stroke-dasharray': CONFIG.methodStyle.exact.dash
    }));
    if (label) {
      var last = points[points.length - 1];
      s.pendingLabels.push({ method: null, y: s.sy(last.y) + 4, text: label });
    }
    return s;
  }

  /** One method's polyline, with its markers and an optional direct label. */
  function drawSeries(s, methodId, points, options) {
    var opts = options || {};
    var style = CONFIG.methodStyle[methodId] || {};
    var group = svg('g', { dataset: { method: methodId } });

    group.appendChild(svg('path.plot__series', {
      d: pathFrom(s, points),
      dataset: { method: methodId },
      'stroke-dasharray': style.dash || null,
      opacity: opts.opacity || null
    }));

    if (opts.markers !== false) {
      points.forEach(function (point) {
        group.appendChild(markerFor(
          style.marker, s.sx(point.x), s.sy(point.y), opts.markerSize || 8,
          { dataset: { method: methodId } }
        ));
      });
    }

    s.layers.series.appendChild(group);

    if (opts.label && points.length) {
      var last = points[points.length - 1];
      s.pendingLabels.push({ method: methodId, y: s.sy(last.y) + 4, text: opts.label });
    }
    return s;
  }

  /**
   * The geometric construction of one step, in the accent colour.
   * `segments` are [{ from:{x,y}, to:{x,y}, ghost:bool }], `points` are dots.
   */
  function drawConstruction(s, segments, points) {
    (segments || []).forEach(function (segment) {
      s.layers.overlay.appendChild(svg('line', {
        class: 'plot__construction' + (segment.ghost ? ' plot__construction--ghost' : ''),
        x1: s.sx(segment.from.x), y1: s.sy(segment.from.y),
        x2: s.sx(segment.to.x), y2: s.sy(segment.to.y)
      }));
    });
    (points || []).forEach(function (point) {
      s.layers.overlay.appendChild(svg('circle.plot__cursor', {
        cx: s.sx(point.x), cy: s.sy(point.y), r: point.r || 5
      }));
      if (point.label) {
        var anchor = point.labelAnchor || 'start';
        s.layers.labels.appendChild(svg('text.plot__direct-label', {
          x: s.sx(point.x) + (anchor === 'end' ? -8 : 8),
          y: s.sy(point.y) + (point.labelDy === undefined ? -9 : point.labelDy),
          'text-anchor': anchor,
          text: point.label,
          fill: 'currentColor'
        }));
      }
    });
    return s;
  }

  /** Padded data range with a little headroom, never a zero-height box. */
  function rangeOf(values, paddingFraction) {
    var finite = values.filter(function (v) { return isFinite(v); });
    if (!finite.length) return { min: 0, max: 1 };
    var min = Math.min.apply(null, finite);
    var max = Math.max.apply(null, finite);
    var span = max - min;
    if (span < 1e-9) span = Math.max(Math.abs(max), 1) * 0.2;
    var pad = span * (paddingFraction === undefined ? 0.12 : paddingFraction);
    return { min: min - pad, max: max + pad };
  }

  /**
   * A log-log plot of error against h, with a reference slope per order.
   * `series` is [{ method, label, points:[{h, error}] }].
   */
  function logLog(spec) {
    var series = spec.series;
    var hValues = [];
    var errorValues = [];
    series.forEach(function (entry) {
      entry.points.forEach(function (point) {
        if (point.h > 0) hValues.push(Math.log10(point.h));
        if (point.error > 0) errorValues.push(Math.log10(point.error));
      });
    });

    var xRange = rangeOf(hValues, 0.08);
    var yRange = rangeOf(errorValues, 0.1);

    var s = surface({
      width: spec.width || 780,
      height: spec.height || 470,
      pad: { top: 22, right: 136, bottom: 48, left: 72 },
      view: { xMin: xRange.min, xMax: xRange.max, yMin: yRange.min, yMax: yRange.max },
      title: spec.title
    });

    var decadeFormat = function (value) {
      var rounded = Math.round(value);
      if (Math.abs(value - rounded) > 1e-6) return '';
      return '10' + superscript(rounded);
    };

    // The y axis gets decades; the x axis gets the actual step sizes used,
    // because "h = 0,05" means more to the audience than "10^-1,3".
    var xValues = (spec.xValues || []).filter(function (h) { return h > 0; });
    var xTicks = xValues.length
      ? xValues.map(function (h) { return Math.log10(h); })
      : integerTicks(xRange.min, xRange.max);
    var labelByTick = {};
    xValues.forEach(function (h) {
      labelByTick[Math.log10(h).toFixed(6)] = F.trim(h, 6);
    });

    drawAxes(s, {
      xTicks: xTicks,
      yTicks: integerTicks(yRange.min, yRange.max),
      xFormat: function (value) {
        var key = value.toFixed(6);
        return labelByTick[key] !== undefined ? labelByTick[key] : decadeFormat(value);
      },
      yFormat: decadeFormat,
      xLabel: spec.xLabel || 'paso h',
      yLabel: spec.yLabel || 'error global'
    });

    series.forEach(function (entry) {
      var points = entry.points
        .filter(function (p) { return p.h > 0 && p.error > 0; })
        .map(function (p) { return { x: Math.log10(p.h), y: Math.log10(p.error) }; })
        .sort(function (a, b) { return a.x - b.x; });
      if (!points.length) return;
      drawSeries(s, entry.method, points, { label: entry.label, markerSize: 9 });
    });

    flushLabels(s);
    return s;
  }

  function integerTicks(min, max) {
    var ticks = [];
    for (var value = Math.ceil(min); value <= Math.floor(max); value += 1) ticks.push(value);
    return ticks.length ? ticks : [Math.round((min + max) / 2)];
  }

  var SUPERSCRIPTS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

  function superscript(value) {
    return String(value).split('').map(function (ch) {
      return SUPERSCRIPTS[ch] || ch;
    }).join('');
  }

  var api = {
    surface: surface,
    flushLabels: flushLabels,
    drawAxes: drawAxes,
    drawSlopeField: drawSlopeField,
    drawExactCurve: drawExactCurve,
    drawSeries: drawSeries,
    drawConstruction: drawConstruction,
    logLog: logLog,
    niceTicks: niceTicks,
    rangeOf: rangeOf,
    markerFor: markerFor,
    superscript: superscript
  };

  root.EDO = root.EDO || {};
  root.EDO.plot = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
