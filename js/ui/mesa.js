/**
 * Mesa de integración: the interactive heart of the site.
 *
 * Pick a P.V.I., pick h, choose which methods march. The direction field of the
 * chosen equation is drawn behind them, the exact solution when it exists, and
 * each method's polyline marching across it. A stepper advances one iteration
 * at a time and draws the geometric construction of that step for the method in
 * focus, while the panel beside it shows the same iteration's arithmetic the way
 * the apunte writes it.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var F = root.EDO.format;
  var M = root.EDO.methods;
  var P = root.EDO.problems;
  var E = root.EDO.errors;
  var G = root.EDO.genericOrdinate;
  var SF = root.EDO.slopeField;
  var Plot = root.EDO.plot;
  var V = root.EDO.views;
  var CONFIG = root.EDO.config;

  var el = D.el;

  var COMPARED = ['taylor2', 'eulerMejorado', 'rk2Midpoint'];
  var ALL = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

  var state = {
    problemId: P.CANONICAL_ID,
    h: null,
    enabled: { euler: true, taylor2: true, eulerMejorado: true, rk2Midpoint: true },
    focus: 'rk2Midpoint',
    step: 0,
    rounding: false,
    playing: null
  };

  var nodes = {};

  /** Step sizes that divide the working interval exactly. */
  function stepChoices(problem) {
    var span = problem.xf - problem.x0;
    var counts = [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 32, 40];
    var own = Math.round(span / problem.h);
    if (counts.indexOf(own) < 0) counts.push(own);
    return counts
      .filter(function (k) { return k >= 2 && k <= 60; })
      .sort(function (a, b) { return a - b; })
      .map(function (k) { return span / k; });
  }

  function currentProblem() {
    var base = P.get(state.problemId);
    if (state.h === null || Math.abs(state.h - base.h) < 1e-12) return base;
    return P.withStep(base, state.h);
  }

  function runOptions() {
    return state.rounding ? { decimals: CONFIG.roundingDecimals } : {};
  }

  function activeMethods() {
    return ALL.filter(function (id) { return state.enabled[id]; });
  }

  function traces(problem) {
    var out = {};
    activeMethods().forEach(function (id) {
      out[id] = M.run(id, problem, runOptions());
    });
    return out;
  }

  /**
   * The geometric construction of one step, per method:
   *   Euler          one tangent at (x_n, y_n)
   *   Taylor 2       that same tangent, plus the quadratic correction on top
   *   Euler mejorado the two slopes and the averaged segment they produce
   *   RK2            the probe to the midpoint and the slope carried back
   */
  function construction(methodId, problem, step) {
    var h = problem.h;
    var from = { x: step.x, y: step.y };
    var target = { x: step.xNext, y: step.yNext };
    var tangentEnd = { x: step.xNext, y: step.y + h * step.yPrime };
    var segments = [];
    var points = [{ x: step.x, y: step.y, r: 5 }];

    if (methodId === 'euler') {
      segments.push({ from: from, to: target });
      points.push({ x: target.x, y: target.y, r: 5, label: 'y' + sub(step.n + 1), labelDy: -11 });
    } else if (methodId === 'taylor2') {
      segments.push({ from: from, to: tangentEnd, ghost: true });
      segments.push({ from: tangentEnd, to: target });
      points.push({ x: target.x, y: target.y, r: 5, label: 'y' + sub(step.n + 1), labelDy: -11 });
    } else if (methodId === 'eulerMejorado') {
      var predictor = { x: step.xNext, y: step.extras.predictor };
      segments.push({ from: from, to: predictor, ghost: true });
      // The slope measured at the predicted point, drawn as a short probe.
      var probeHalf = h * 0.42;
      segments.push({
        ghost: true,
        from: { x: predictor.x - probeHalf, y: predictor.y - probeHalf * step.extras.fPredictor },
        to: { x: predictor.x + probeHalf, y: predictor.y + probeHalf * step.extras.fPredictor }
      });
      segments.push({ from: from, to: target });
      points.push({ x: predictor.x, y: predictor.y, r: 4, label: 'predicho', labelDy: 19 });
      points.push({ x: target.x, y: target.y, r: 5, label: 'y' + sub(step.n + 1), labelDy: -11 });
    } else if (methodId === 'rk2Midpoint') {
      var mid = { x: step.extras.xMid, y: step.extras.yMid };
      segments.push({ from: from, to: mid, ghost: true });
      var midHalf = h * 0.42;
      segments.push({
        ghost: true,
        from: { x: mid.x - midHalf, y: mid.y - midHalf * step.extras.fMid },
        to: { x: mid.x + midHalf, y: mid.y + midHalf * step.extras.fMid }
      });
      segments.push({ from: from, to: target });
      points.push({ x: mid.x, y: mid.y, r: 4, label: 'punto medio', labelDy: 19 });
      points.push({ x: target.x, y: target.y, r: 5, label: 'y' + sub(step.n + 1), labelDy: -11 });
    }

    return { segments: segments, points: points };
  }

  var SUBS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

  function sub(value) {
    return String(value).split('').map(function (ch) { return SUBS[Number(ch)] || ch; }).join('');
  }

  /** Build the figure for the current state. */
  function renderFigure(problem, runs) {
    var v = problem.varName;
    var yValues = [problem.y0];
    Object.keys(runs).forEach(function (id) {
      runs[id].points.forEach(function (point) { yValues.push(point.y); });
    });
    if (typeof problem.exact === 'function') {
      for (var i = 0; i <= 24; i += 1) {
        yValues.push(problem.exact(problem.x0 + (problem.xf - problem.x0) * (i / 24)));
      }
    }
    var yRange = Plot.rangeOf(yValues, 0.14);
    var xPad = (problem.xf - problem.x0) * 0.06;
    var view = {
      xMin: problem.x0 - xPad,
      xMax: problem.xf + xPad,
      yMin: yRange.min,
      yMax: yRange.max
    };

    var surface = Plot.surface({
      view: view,
      width: 780,
      height: 470,
      title: 'Campo de pendientes de ' + problem.odeDisplay +
        ' con las poligonales de los métodos'
    });

    Plot.drawAxes(surface, { xLabel: v, yLabel: 'y' });
    Plot.drawSlopeField(surface, SF.sample(problem, view, { columns: 24, rows: 15 }));
    Plot.drawExactCurve(surface, SF.exactCurve(problem, view, 200), 'exacta');

    var order = activeMethods();

    // The whole trajectory, very faint: it shows where each method is heading
    // so the opening frame is already informative on a projector.
    order.forEach(function (id) {
      Plot.drawSeries(surface, id, runs[id].points, {
        markers: false,
        opacity: 0.16
      });
    });

    // Then the part actually marched so far, solid.
    order.forEach(function (id) {
      var points = runs[id].points.slice(0, state.step + 1);
      if (points.length < 1) return;
      Plot.drawSeries(surface, id, points, {
        label: CONFIG.methodStyle[id].label,
        opacity: id === state.focus ? null : 0.6
      });
    });

    // The construction of the step about to be taken, for the focused method.
    var focusTrace = runs[state.focus];
    if (focusTrace && state.step < focusTrace.rows.length) {
      var drawing = construction(state.focus, problem, focusTrace.rows[state.step]);
      Plot.drawConstruction(surface, drawing.segments, drawing.points);
    } else if (focusTrace) {
      Plot.drawConstruction(surface, [], [{
        x: focusTrace.xFinal, y: focusTrace.yFinal, r: 6, label: 'fin del dominio'
      }]);
    }

    Plot.flushLabels(surface);
    return surface.node;
  }

  /** Build the arithmetic panel for the current step of the focused method. */
  function renderPanel(problem, runs) {
    var focusTrace = runs[state.focus];
    var style = CONFIG.methodStyle[state.focus];

    var head = el('div.mesa__panel-head', null, [
      el('h3.mesa__panel-title', {
        text: focusTrace && state.step < focusTrace.rows.length
          ? 'Iteración n = ' + state.step
          : 'Dominio recorrido'
      }),
      el('span.mesa__panel-method', null, [
        el('span.swatch.swatch--' + state.focus, { 'aria-hidden': 'true' }),
        style.label
      ])
    ]);

    if (!focusTrace) {
      return [head, el('div.mesa__panel-body', null,
        el('p', { text: 'Active el método en foco para ver su aritmética.' }))];
    }

    if (state.step >= focusTrace.rows.length) {
      var hasExact = typeof problem.exact === 'function';
      var body = [
        el('p', {
          text: 'El método recorrió las ' + focusTrace.steps +
            ' iteraciones del dominio. Valor final:'
        }),
        el('div.mesa__result', null, D.mathNode(
          root.EDO.mathml.math(root.EDO.mathml.row(
            root.EDO.mathml.sub(root.EDO.mathml.mi('y'), root.EDO.mathml.mn(String(focusTrace.steps))),
            root.EDO.mathml.mo('='),
            root.EDO.mathml.mn(F.fixed(focusTrace.yFinal, 6))
          ))
        ))
      ];
      if (hasExact) {
        var exact = problem.exact(problem.xf);
        body.push(el('ul.mesa__intermediates', null, [
          el('li', null, [el('b', { text: 'Valor exacto' }), F.fixed(exact, 6)]),
          el('li', null, [el('b', { text: 'Error absoluto' }),
            F.scientific(Math.abs(exact - focusTrace.yFinal))]),
          el('li', null, [el('b', { text: 'Error relativo' }),
            F.percent(E.relativeErrorPercent(focusTrace.yFinal, exact))])
        ]));
      }
      return [head, el('div.mesa__panel-body', null, body)];
    }

    var step = focusTrace.rows[state.step];
    var view = G.iteration(state.focus, problem, step);

    return [head, el('div.mesa__panel-body', null, [
      el('span.derivation__label', { text: 'Si n = ' + step.n + ' entonces:' }),
      D.mathBlock(view.symbolic),
      el('span.derivation__label', { text: 'Reemplazando cada valor:' }),
      D.mathBlock(view.substituted),
      view.intermediates.length
        ? el('ul.mesa__intermediates', null, view.intermediates.map(function (entry) {
          return el('li', null, [el('b', { text: entry.label }), D.mathNode(entry.mml)]);
        }))
        : null,
      el('div.mesa__result', null, D.mathNode(view.result))
    ])];
  }

  function totalSteps(problem) {
    return M.stepCount(problem);
  }

  function clampStep(problem) {
    var total = totalSteps(problem);
    if (state.step > total) state.step = total;
    if (state.step < 0) state.step = 0;
  }

  function stopPlaying() {
    if (state.playing !== null) {
      window.clearInterval(state.playing);
      state.playing = null;
    }
    if (nodes.play) {
      nodes.play.setAttribute('aria-pressed', 'false');
      nodes.play.textContent = 'Reproducir';
    }
  }

  function render() {
    var problem = currentProblem();
    clampStep(problem);
    var runs = traces(problem);

    D.clear(nodes.figure).appendChild(renderFigure(problem, runs));
    D.clear(nodes.panel);
    D.append(nodes.panel, renderPanel(problem, runs));
    D.append(nodes.panel, nodes.stepper);

    var total = totalSteps(problem);
    nodes.readout.textContent = 'Iteración ' + Math.min(state.step + 1, total) +
      ' de ' + total + ' · h = ' + F.trim(problem.h, 6);
    nodes.hValue.textContent = 'h = ' + F.trim(problem.h, 6) + ' · ' + total + ' iteraciones';
    nodes.prev.disabled = state.step === 0;
    nodes.next.disabled = state.step >= total;
    if (state.step >= total) stopPlaying();

    D.clear(nodes.caption);
    D.append(nodes.caption, [
      el('b', { text: 'Fig. 1 — ' }),
      'Campo de pendientes de ' + problem.odeDisplay.replace(/\bx\b/g, problem.varName) +
      ' con las poligonales de los métodos activos. En rosa, la construcción ' +
      'geométrica del paso en curso para ' + CONFIG.methodStyle[state.focus].label + '.'
    ]);

    // Keep the focus selector in step with which methods are active.
    var active = activeMethods();
    Array.prototype.forEach.call(nodes.focusSelect.options, function (option) {
      option.disabled = active.indexOf(option.value) < 0;
    });
    if (active.length && active.indexOf(state.focus) < 0) {
      state.focus = active[0];
      nodes.focusSelect.value = state.focus;
      render();
    }
  }

  function advance(delta) {
    var problem = currentProblem();
    state.step = Math.max(0, Math.min(totalSteps(problem), state.step + delta));
    render();
  }

  function buildControls() {
    var problemSelect = el('select', {
      id: 'mesa-problem',
      onChange: function (event) {
        state.problemId = event.target.value;
        state.h = null;
        state.step = 0;
        var problem = P.get(state.problemId);
        var choices = stepChoices(problem);
        var index = closestIndex(choices, problem.h);
        nodes.hSlider.max = String(choices.length - 1);
        nodes.hSlider.value = String(index);
        state.h = choices[index];
        state.focus = problem.assignedMethod === 'euler'
          ? 'eulerMejorado'
          : problem.assignedMethod;
        nodes.focusSelect.value = state.focus;
        stopPlaying();
        render();
      }
    }, P.catalog.map(function (problem) {
      return el('option', {
        value: problem.id,
        selected: problem.id === state.problemId,
        text: problem.label + ' — ' + problem.odeDisplay.replace(/\bx\b/g, problem.varName)
      });
    }));

    var initialProblem = P.get(state.problemId);
    var choices = stepChoices(initialProblem);
    var initialIndex = closestIndex(choices, initialProblem.h);
    state.h = choices[initialIndex];

    nodes.hSlider = el('input', {
      type: 'range',
      id: 'mesa-h',
      min: '0',
      max: String(choices.length - 1),
      step: '1',
      value: String(initialIndex),
      onInput: function (event) {
        var list = stepChoices(P.get(state.problemId));
        state.h = list[Number(event.target.value)];
        state.step = 0;
        stopPlaying();
        render();
      }
    });

    nodes.hValue = el('span.control__value');

    nodes.focusSelect = el('select', {
      id: 'mesa-focus',
      onChange: function (event) {
        state.focus = event.target.value;
        render();
      }
    }, ALL.map(function (id) {
      return el('option', {
        value: id,
        selected: id === state.focus,
        text: CONFIG.methodStyle[id].label
      });
    }));

    var methodToggles = el('div.toggles', null, ALL.map(function (id) {
      return el('button.btn', {
        type: 'button',
        'aria-pressed': state.enabled[id] ? 'true' : 'false',
        onClick: function (event) {
          var next = !state.enabled[id];
          // Never leave the figure empty.
          if (!next && activeMethods().length === 1) return;
          state.enabled[id] = next;
          event.currentTarget.setAttribute('aria-pressed', next ? 'true' : 'false');
          render();
        }
      }, [
        el('span.swatch.swatch--' + id, { 'aria-hidden': 'true' }),
        CONFIG.methodStyle[id].label
      ]);
    }));

    var roundingSwitch = el('label.switchrow', null, [
      el('input', {
        type: 'checkbox',
        onChange: function (event) {
          state.rounding = event.target.checked;
          render();
        }
      }),
      'Arrastre de redondeo a ' + CONFIG.roundingDecimals + ' decimales'
    ]);

    return el('div.controls', null, [
      el('div.control.control--grow', null, [
        el('label.control__label', { for: 'mesa-problem', text: 'Problema de valor inicial' }),
        problemSelect
      ]),
      el('div.control.control--grow', null, [
        el('label.control__label', { for: 'mesa-h', text: 'Paso h' }),
        nodes.hSlider,
        nodes.hValue
      ]),
      el('div.control', null, [
        el('span.control__label', { text: 'Métodos que marchan' }),
        methodToggles
      ]),
      el('div.control', null, [
        el('label.control__label', { for: 'mesa-focus', text: 'Construcción en foco' }),
        nodes.focusSelect
      ]),
      el('div.control', null, [
        el('span.control__label', { text: 'Modo de cálculo' }),
        roundingSwitch,
        el('span.control__label', {
          style: 'text-transform:none;letter-spacing:0',
          text: 'Itera arrastrando valores redondeados, como al resolver a mano.'
        })
      ])
    ]);
  }

  function closestIndex(list, value) {
    var best = 0;
    var bestDistance = Infinity;
    list.forEach(function (candidate, index) {
      var distance = Math.abs(candidate - value);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }

  function buildStepper() {
    nodes.prev = el('button.btn', {
      type: 'button', text: 'Anterior',
      onClick: function () { stopPlaying(); advance(-1); }
    });
    nodes.next = el('button.btn', {
      type: 'button', text: 'Siguiente iteración',
      onClick: function () { stopPlaying(); advance(1); }
    });
    var reset = el('button.btn.btn--ghost', {
      type: 'button', text: 'Reiniciar',
      onClick: function () { stopPlaying(); state.step = 0; render(); }
    });
    nodes.play = el('button.btn.btn--accent', {
      type: 'button', text: 'Reproducir', 'aria-pressed': 'false',
      onClick: function () {
        if (state.playing !== null) {
          stopPlaying();
          return;
        }
        nodes.play.setAttribute('aria-pressed', 'true');
        nodes.play.textContent = 'Pausar';
        state.playing = window.setInterval(function () {
          var total = totalSteps(currentProblem());
          if (state.step >= total) {
            stopPlaying();
            return;
          }
          advance(1);
        }, 900);
      }
    });
    nodes.readout = el('span.stepper__readout');

    return el('div.stepper', null, [reset, nodes.prev, nodes.next, nodes.play, nodes.readout]);
  }

  /** Local arrow keys step iterations instead of changing chapter. */
  function onKeydown(event) {
    if (event.key === 'ArrowRight') {
      event.stopPropagation();
      event.preventDefault();
      stopPlaying();
      advance(1);
    } else if (event.key === 'ArrowLeft') {
      event.stopPropagation();
      event.preventDefault();
      stopPlaying();
      advance(-1);
    } else if (event.key === 'Home') {
      event.stopPropagation();
      event.preventDefault();
      stopPlaying();
      state.step = 0;
      render();
    }
  }

  function build() {
    var controls = buildControls();
    nodes.stepper = buildStepper();
    nodes.figure = el('div');
    nodes.caption = el('figcaption.plate__caption');
    nodes.panel = el('div.mesa__panel');

    var figurePlate = el('figure.plate', null, [
      el('div.plate__body.plate__body--flush', null, nodes.figure),
      nodes.caption
    ]);

    var region = el('div.mesa', {
      'data-keys': 'local',
      tabindex: '0',
      role: 'group',
      'aria-label': 'Mesa de integración. Use las flechas para avanzar una iteración.',
      onKeydown: onKeydown
    }, [
      el('div.mesa__figure', null, figurePlate),
      nodes.panel
    ]);

    render();
    return [controls, region];
  }

  var api = {
    build: build,
    COMPARED: COMPARED,
    stepChoices: stepChoices,
    construction: construction,
    stop: stopPlaying
  };

  root.EDO = root.EDO || {};
  root.EDO.mesa = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
