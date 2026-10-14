/**
 * Shared view builders: plates, legends, tables, derivation blocks and the
 * audience-interaction card. Chapters compose these.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var F = root.EDO.format;
  var M = root.EDO.methods;
  var P = root.EDO.problems;
  var E = root.EDO.errors;
  var G = root.EDO.genericOrdinate;
  var CONFIG = root.EDO.config;
  var APUNTE = root.EDO.APUNTE_VALUES;

  var el = D.el;

  var plateCounter = { value: 0 };

  function resetPlateNumbers() {
    plateCounter.value = 0;
  }

  /** Read the counter, so a block that re-renders can restore its own numbers. */
  function plateNumber() {
    return plateCounter.value;
  }

  function setPlateNumber(value) {
    plateCounter.value = value;
  }

  /**
   * A figure with a hairline border and a numbered caption.
   * `caption` is the text after "Fig. N — ".
   */
  function plate(content, caption, options) {
    var opts = options || {};
    plateCounter.value += 1;
    var number = plateCounter.value;
    var body = el('div.plate__body' + (opts.flush ? '.plate__body--flush' : ''), null, content);
    var children = [body];
    if (caption) {
      children.push(el('figcaption.plate__caption', null, [
        el('b', { text: 'Fig. ' + number + ' — ' }),
        caption
      ]));
    }
    return el('figure.plate', null, children);
  }

  /** Legend entries, each a coloured rule plus its marker glyph and name. */
  function legend(methodIds, options) {
    var opts = options || {};
    var items = methodIds.map(function (id) {
      var style = CONFIG.methodStyle[id];
      return el('li', null, [
        el('span.swatch.swatch--' + id, { class: 'legend__glyph', 'aria-hidden': 'true' }),
        style ? style.label : id
      ]);
    });
    if (opts.exact) {
      items.push(el('li', null, [
        el('span.swatch.swatch--exact', { class: 'legend__glyph', 'aria-hidden': 'true' }),
        CONFIG.methodStyle.exact.label
      ]));
    }
    return el('ul.legend', null, items);
  }

  /** A table inside its own horizontal scroll container. */
  function table(spec) {
    var head = el('thead', null, el('tr', null, spec.columns.map(function (column) {
      return el('th', {
        scope: 'col',
        class: column.muted ? 'is-exact' : null,
        html: column.label
      });
    })));

    var body = el('tbody', null, spec.rows.map(function (row) {
      return el('tr', { class: row.className || null }, (row.cells || row).map(function (cell, index) {
        var column = spec.columns[index] || {};
        var attrs = {
          class: column.muted ? 'is-exact' : null
        };
        if (index === 0 && spec.rowHeader !== false) attrs.scope = 'row';
        var node = el(index === 0 && spec.rowHeader !== false ? 'th' : 'td', attrs);
        if (cell && cell.nodeType) node.appendChild(cell);
        else if (cell && cell.html !== undefined) node.innerHTML = cell.html;
        else node.textContent = cell === null || cell === undefined ? '—' : String(cell);
        return node;
      }));
    }));

    var children = [head, body];
    if (spec.caption) children.unshift(el('caption', { text: spec.caption }));
    return el('div.tablewrap', null, el('table', null, children));
  }

  /** A labelled coloured name, for use inside a table header. */
  function methodHeader(methodId) {
    var style = CONFIG.methodStyle[methodId];
    return '<span class="swatch swatch--' + methodId + '" aria-hidden="true"></span>' +
      (style ? style.label : methodId);
  }

  /** The four elements of the P.V.I., as the apunte enumerates them. */
  function pviElements(problem) {
    return el('dl.elements', null, P.elements(problem).map(function (entry) {
      return el('div', null, [
        el('dt', { text: entry.term }),
        el('dd', { text: entry.value })
      ]);
    }));
  }

  /** "Donde:" / "Pero:" style steps followed by the highlighted result. */
  function derivation(steps) {
    return el('div.derivation', null, (steps || []).map(function (step) {
      return el('div.derivation__step', null, [
        step.label ? el('span.derivation__label', { text: step.label }) : null,
        D.mathBlock(step.mml)
      ]);
    }));
  }

  /** The ordenada genérica, flagged as such the way the apunte flags it. */
  function ordinateBlock(markup, tag) {
    return el('div.ordinate', null, [
      el('span.ordinate__tag', { text: tag || 'Ordenada genérica' }),
      D.mathBlock(markup)
    ]);
  }

  /**
   * The neutral verification line, rendered only when the group turns
   * `mostrarVerificacion` on in js/config.js. With it off the site shows only
   * the engine's own values and says nothing about any difference.
   */
  function apunteVerification(exampleKey) {
    if (!APUNTE.mostrarVerificacion) return null;
    var example = APUNTE.examples[exampleKey];
    if (!example) return null;

    var lines = example.published.map(function (entry, index) {
      var recomputed = example.recomputed[index];
      return el('li', null, [
        'Valor publicado en el apunte: ' + F.trim(entry.y, 6) +
        ' · Valor recalculado con la misma fórmula: ' +
        F.trim(recomputed.y, 6)
      ]);
    });

    return el('div.note', null, [
      el('p', { text: example.title }),
      el('ul', null, lines),
      el('p', { text: example.note })
    ]);
  }

  /**
   * An audience-interaction card: a question, answer buttons, and a reveal.
   * The rubric rewards audience interaction, so the reveal is a real control
   * the presenter clicks, not decoration.
   */
  function audienceCard(spec) {
    var reveal = el('div.audience__reveal', { hidden: true, id: spec.id + '-reveal' }, spec.reveal());
    var button = el('button.btn.btn--accent', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': reveal.id,
      text: spec.revealLabel || 'Mostrar la respuesta'
    });

    button.addEventListener('click', function () {
      var open = reveal.hidden;
      reveal.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.textContent = open
        ? (spec.hideLabel || 'Ocultar la respuesta')
        : (spec.revealLabel || 'Mostrar la respuesta');
    });

    var options = (spec.options || []).map(function (text) {
      return el('span.btn.btn--ghost', { text: text });
    });
    options.push(button);

    return el('section.audience', { 'aria-labelledby': spec.id + '-q' }, [
      el('div.audience__head', null, [
        el('span.audience__tag', { text: spec.tag || 'Para el aula' }),
        el('h3.audience__question', { id: spec.id + '-q', text: spec.question })
      ]),
      el('div.audience__options', null, options),
      reveal
    ]);
  }

  /** A collapsible derivation, present for the grade but out of the main flow. */
  function deduction(title, content) {
    return el('details.deduccion', null, [
      el('summary', { text: title }),
      el('div.deduccion__body', null, content)
    ]);
  }

  /** The iteration table for one method, with its own intermediate columns. */
  function iterationTable(problem, trace, options) {
    var opts = options || {};
    var v = problem.varName;
    var decimals = opts.decimals === undefined ? 6 : opts.decimals;
    var hasExact = typeof problem.exact === 'function';

    var columns = [
      { label: 'n' },
      { label: v + '<sub>n</sub>' },
      { label: 'y<sub>n</sub>' },
      { label: 'y&prime;<sub>n</sub>' }
    ];

    var extraKeys = [];
    if (trace.method === 'taylor2') {
      extraKeys = [
        { key: 'ySecond', label: 'y&Prime;<sub>n</sub>' },
        { key: 'termFirst', label: 'h&middot;y&prime;<sub>n</sub>' },
        { key: 'termSecond', label: '(h&sup2;/2!)&middot;y&Prime;<sub>n</sub>' }
      ];
    } else if (trace.method === 'eulerMejorado') {
      extraKeys = [
        { key: 'predictor', label: 'y<sub>n</sub> + h&middot;y&prime;<sub>n</sub>' },
        { key: 'fPredictor', label: 'f(' + v + '<sub>n+1</sub>, predicho)' }
      ];
    } else if (trace.method === 'rk2Midpoint') {
      extraKeys = [
        { key: 'k1', label: 'k<sub>1</sub>' },
        { key: 'xMid', label: v + '<sub>n</sub> + h/2' },
        { key: 'yMid', label: 'y<sub>n</sub> + k<sub>1</sub>/2' },
        { key: 'fMid', label: 'f(punto medio)' }
      ];
    }

    columns = columns.concat(extraKeys.map(function (extra) {
      return { label: extra.label };
    }));
    columns.push({ label: 'y<sub>n+1</sub>' });
    if (hasExact) {
      columns.push({ label: 'y(' + v + '<sub>n+1</sub>)', muted: true });
      columns.push({ label: 'error abs.', muted: true });
    }

    var rows = trace.rows.map(function (step, index) {
      var cells = [
        String(step.n),
        F.trim(step.x, 6),
        F.fixed(step.y, decimals),
        F.fixed(step.yPrime, decimals)
      ];
      extraKeys.forEach(function (extra) {
        cells.push(F.fixed(step.extras[extra.key], decimals));
      });
      cells.push(F.fixed(step.yNext, decimals));
      if (hasExact) {
        var exact = problem.exact(step.xNext);
        cells.push(F.fixed(exact, decimals));
        cells.push(F.scientific(Math.abs(exact - step.yNext), 3));
      }
      return {
        cells: cells,
        className: index === trace.rows.length - 1 ? 'is-final' : null
      };
    });

    return table({ columns: columns, rows: rows, caption: opts.caption });
  }

  /** The side-by-side table of the compared methods on one problem. */
  function sideBySideTable(problem, methodIds, options) {
    var opts = options || {};
    var v = problem.varName;
    var hasExact = typeof problem.exact === 'function';
    var traces = methodIds.map(function (id) { return M.run(id, problem, opts.runOptions); });
    var steps = traces[0].points.length;

    var columns = [{ label: 'n' }, { label: v + '<sub>n</sub>' }];
    methodIds.forEach(function (id) {
      columns.push({ label: methodHeader(id) });
    });
    if (hasExact) columns.push({ label: 'exacta', muted: true });

    var rows = [];
    for (var i = 0; i < steps; i += 1) {
      var x = traces[0].points[i].x;
      var cells = [String(i), F.trim(x, 6)];
      traces.forEach(function (trace) {
        cells.push(F.fixed(trace.points[i].y, 6));
      });
      if (hasExact) cells.push(F.fixed(problem.exact(x), 6));
      rows.push({ cells: cells, className: i === steps - 1 ? 'is-final' : null });
    }

    return table({ columns: columns, rows: rows, caption: opts.caption });
  }

  /** "Resultado" strip under an exercise. */
  function answerStrip(entries) {
    return el('dl.exercise__answer', null, entries.map(function (entry) {
      return el('div', null, [
        el('dt', { text: entry.term }),
        el('dd', null, el('b', { text: entry.value }))
      ]);
    }));
  }

  var api = {
    resetPlateNumbers: resetPlateNumbers,
    plateNumber: plateNumber,
    setPlateNumber: setPlateNumber,
    plate: plate,
    legend: legend,
    table: table,
    methodHeader: methodHeader,
    pviElements: pviElements,
    derivation: derivation,
    ordinateBlock: ordinateBlock,
    apunteVerification: apunteVerification,
    audienceCard: audienceCard,
    deduction: deduction,
    iterationTable: iterationTable,
    sideBySideTable: sideBySideTable,
    answerStrip: answerStrip
  };

  root.EDO = root.EDO || {};
  root.EDO.views = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
