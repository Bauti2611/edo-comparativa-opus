'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const mathml = require('../js/domain/mathml.js');
const format = require('../js/domain/format.js');
const slopeField = require('../js/domain/slopeField.js');
const generic = require('../js/domain/genericOrdinate.js');
const methods = require('../js/domain/methods.js');
const problems = require('../js/domain/problems.js');

const METHOD_IDS = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

/** Every `<tag>` must be closed, in order. Enough to catch a malformed build. */
function assertBalanced(markup, label) {
  const stack = [];
  const pattern = /<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g;
  let match;
  while ((match = pattern.exec(markup)) !== null) {
    const [, closing, name, , selfClosing] = match;
    if (selfClosing === '/') continue;
    if (closing === '/') {
      assert.equal(stack.pop(), name, `${label}: unexpected </${name}>`);
    } else {
      stack.push(name);
    }
  }
  assert.equal(stack.length, 0, `${label}: unclosed ${stack.join(', ')}`);
}

test('a product of substituted numbers uses a visible dot, never invisible times', () => {
  const problem = problems.get('p05_1c');
  const trace = methods.taylor2(problem);

  // Symbolic: 2 x_n y_n keeps the invisible product, exactly as the apunte.
  const ordinate = generic.ordinate('taylor2', problem).ordinate;
  assert.ok(ordinate.includes('⁢'), 'the symbolic form must keep invisible times');

  // Substituted: 2 ⋅ 1,1 ⋅ 1,23, because "2 1,1 1,23" is not a product.
  const substituted = generic.iteration('taylor2', problem, trace.rows[1]).substituted;
  assert.ok(substituted.includes('⋅'), 'substituted numbers need a visible dot');

  // A substituted number raised to a power gets brackets: 4⋅(1,1)²⋅1,23.
  assert.match(substituted, /<msup><mrow><mo[^>]*>\(<\/mo><mn data-lit="1">1,1<\/mn>/);

  // A value that is already bracketed because it is negative is not bracketed twice.
  const negative = generic.iteration('taylor2', problems.get('p05_1d'),
    methods.taylor2(problems.get('p05_1d')).rows[0]).substituted;
  assert.ok(!/<mo[^>]*>\(<\/mo><mrow[^>]*><mo[^>]*>\(<\/mo>/.test(negative), negative);

  // Every problem of the catalog, every method: never two bare numbers in a row.
  for (const p of problems.catalog) {
    for (const id of METHOD_IDS) {
      for (const step of methods.run(id, p).rows) {
        const text = generic.iteration(id, p, step).substituted
          .replace(/<mo>⁢<\/mo>/g, '⁢')
          .replace(/<[^>]+>/g, '');
        assert.ok(
          !/[\d,]⁢[\d,]/.test(text),
          `${p.id}/${id}/n=${step.n}: invisible times between numbers in "${text}"`
        );
      }
    }
  }
});

test('mathml helpers produce balanced, namespaced markup', () => {
  const m = mathml.math(mathml.row(mathml.mi('y'), mathml.mo('='), mathml.mn('1')));
  assert.ok(m.startsWith('<math'));
  assert.ok(m.includes('http://www.w3.org/1998/Math/MathML'));
  assert.ok(m.includes('display="block"'));
  assertBalanced(m, 'math');

  assert.ok(mathml.inline(mathml.mn('1')).includes('display="inline"'));
  assert.equal(mathml.escapeText('a < b & c'), 'a &lt; b &amp; c');
  assert.ok(mathml.times(mathml.mn('2'), mathml.mi('x')).includes('⁢'));
});

test('negative numbers render with a real minus sign', () => {
  assert.ok(mathml.num(-1.5, 2).includes('−'));
  assert.equal(format.fixed(-1.5, 2), '−1,50');
  assert.equal(format.fixed(1.5, 2), '1,50');
  assert.equal(format.trim(0.1), '0,1');
  assert.equal(format.trim(1.1), '1,1');
  assert.equal(format.trim(2), '2');
  assert.equal(format.trim(-2), '−2');
  assert.equal(format.percent(16.117), '16,117 %');
  assert.equal(format.order(1.98), '1,98');
  assert.equal(format.fixed(null), '—');
});

test('scientific notation keeps the decimal comma and a signed exponent', () => {
  assert.equal(format.scientific(5.625e-1), '5,625e−1');
  assert.equal(format.scientific(1.418), '1,418e+0');
  assert.equal(format.scientific(1.0508e-3), '1,051e−3');
  assert.equal(format.scientific(-2.5e-2, 2), '−2,5e−2');
  assert.equal(format.scientific(0), '0');
});

test('the general formula and the "Donde:" block exist for every method', () => {
  for (const id of METHOD_IDS) {
    const g = generic.general(id);
    assertBalanced(g.formula, `${id} formula`);
    assert.ok(g.where.length >= 1, id);
    assert.ok(typeof g.idea === 'string' && g.idea.length > 20, id);
    for (const line of g.where) assertBalanced(line.mml, `${id} where`);
  }
  assert.throws(() => generic.general('rk4'), /Unknown method/);
});

test('Taylor states the chain rule, not the derivative of the unknown solution', () => {
  const taylor = generic.general('taylor2');
  const where = taylor.where.map((w) => w.mml).join('');
  assert.ok(where.includes('∂'), 'the partials must appear as ∂f/∂x and ∂f/∂y');
  assert.ok(taylor.formula.includes('2</mn><mo>!'), 'the apunte writes h²/2!');
});

test('Euler mejorado and RK2 write the factorial the way the apunte writes it', () => {
  assert.ok(generic.general('eulerMejorado').formula.includes('<mo>!</mo>'));
  const rk2 = generic.general('rk2Midpoint');
  assert.ok(rk2.where[0].mml.includes('<msub><mi>k</mi><mn>1</mn></msub>'));
  // Only k1 exists in the cátedra's variant: no k2 anywhere.
  assert.ok(!rk2.formula.includes('<mn>2</mn></msub>'), 'there is no k₂ in this variant');
});

test('the ordenada genérica builds for every method on every problem', () => {
  for (const problem of problems.catalog) {
    for (const id of METHOD_IDS) {
      const result = generic.ordinate(id, problem);
      assertBalanced(result.ordinate, `${problem.id}/${id} ordinate`);
      assert.ok(result.ordinate.includes('<math'), `${problem.id}/${id}`);
      for (const step of result.steps) {
        assertBalanced(step.mml, `${problem.id}/${id} step`);
        assert.ok(step.label.length > 0);
      }
    }
  }
});

test('the ordenada genérica of the canonical P.V.I. carries the problem’s own f', () => {
  const canonical = problems.get('p05_1c');
  const taylor = generic.ordinate('taylor2', canonical);
  // 2 x_n y_n substituted, and the simplified y'' the apunte publishes.
  assert.ok(taylor.ordinate.includes('<mn>2</mn>'));
  assert.ok(taylor.ordinate.includes('<mn>4</mn>'));
  assert.equal(taylor.steps.length, 2);
  assert.match(taylor.steps[1].label, /Pero/);
});

test('every iteration renders symbolic, substituted and result lines', () => {
  for (const problem of problems.catalog) {
    for (const id of METHOD_IDS) {
      const trace = methods.run(id, problem);
      for (const step of trace.rows) {
        const view = generic.iteration(id, problem, step);
        assert.equal(view.n, step.n);
        assertBalanced(view.symbolic, `${problem.id}/${id}/${step.n} symbolic`);
        assertBalanced(view.substituted, `${problem.id}/${id}/${step.n} substituted`);
        assertBalanced(view.result, `${problem.id}/${id}/${step.n} result`);
        assert.match(view.heading, /Iteración n = \d+/);
        for (const extra of view.intermediates) {
          assertBalanced(extra.mml, `${problem.id}/${id}/${step.n} intermediate`);
        }
      }
    }
  }
});

test('the first Taylor iteration of the apunte substitutes the apunte’s numbers', () => {
  const problem = problems.get('p05_1c');
  const trace = methods.taylor2(problem);
  const view = generic.iteration('taylor2', problem, trace.rows[0]);
  // y_0 = 1, x_0 = 1, h = 0.1, and the result y_1 = 1.23 at x_1 = 1.1.
  assert.match(view.substituted, /<mn data-lit="1">0,1<\/mn>/);
  assert.match(view.result, /<mn data-lit="1">1,23<\/mn>/);
  assert.match(view.result, /<mn data-lit="1">1,1<\/mn>/);
  assert.equal(view.intermediates.length, 2);
  // At n = 0: y' = 2*1*1 = 2 and y'' = 2y + 4x²y = 6.
  assert.match(view.intermediates[0].mml, /<mn data-lit="1">2<\/mn>/);
  assert.match(view.intermediates[1].mml, /<mn data-lit="1">6<\/mn>/);

  // At n = 1: y'' = 2(1,23) + 4(1,1)²(1,23) = 8,4132.
  const second = generic.iteration('taylor2', problem, trace.rows[1]);
  assert.match(second.intermediates[1].mml, /8,4132/);
  assert.match(second.result, /<mn data-lit="1">1,542666<\/mn>/);
});

test('the slope field samples a grid and clamps the tick length', () => {
  const problem = problems.canonical();
  const view = { xMin: 1, xMax: 1.5, yMin: 0.8, yMax: 3.6 };
  const field = slopeField.sample(problem, view, { columns: 10, rows: 8 });

  assert.equal(field.ticks.length, 80);
  assert.ok(field.maxSlope > 0);

  const cellX = (view.xMax - view.xMin) / 10;
  for (const tick of field.ticks) {
    assert.ok(tick.x > view.xMin && tick.x < view.xMax);
    assert.ok(tick.y > view.yMin && tick.y < view.yMax);
    assert.ok(Math.abs(tick.dx) <= cellX, 'a tick never spans more than its cell');
    assert.ok(Number.isFinite(tick.dy));
    // The drawn direction must agree with the sign of the slope.
    if (tick.slope > 0) assert.ok(tick.dy > 0);
    if (tick.slope < 0) assert.ok(tick.dy < 0);
  }
});

test('the slope field degrades instead of throwing on a degenerate view', () => {
  const field = slopeField.sample(problems.canonical(), { xMin: 1, xMax: 1, yMin: 0, yMax: 1 });
  assert.deepEqual(field.ticks, []);
  assert.equal(field.maxSlope, 0);
});

test('the exact curve is sampled only where the problem has one', () => {
  const view = { xMin: 1, xMax: 1.5, yMin: 0, yMax: 4 };
  const curve = slopeField.exactCurve(problems.canonical(), view, 20);
  assert.equal(curve.length, 21);
  assert.ok(Math.abs(curve[0].y - 1) < 1e-9);
  assert.deepEqual(slopeField.exactCurve(problems.get('p05_2c'), view, 20), []);
});
