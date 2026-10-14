'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const methods = require('../js/domain/methods.js');
const problems = require('../js/domain/problems.js');
const { ENDPOINTS, CANONICAL, TOLERANCE } = require('./fixtures.js');

const METHOD_IDS = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

test('every catalog exercise reproduces its endpoint value for every method', () => {
  for (const fixture of ENDPOINTS) {
    const problem = problems.get(fixture.problem);
    for (const id of METHOD_IDS) {
      const trace = methods.run(id, problem);
      assert.ok(
        Math.abs(trace.yFinal - fixture[id]) < TOLERANCE,
        `${fixture.problem} / ${id}: got ${trace.yFinal}, expected ${fixture[id]}`
      );
      assert.equal(
        trace.points.length,
        trace.steps + 1,
        `${fixture.problem} / ${id}: point list must include the initial point`
      );
      assert.ok(
        Math.abs(trace.xFinal - problem.xf) < 1e-9,
        `${fixture.problem} / ${id}: must land exactly on x_f`
      );
    }
  }
});

test('the canonical P.V.I. matches the published values at x = 1,3 and x = 1,5', () => {
  const to1_3 = problems.get('p05_1c');
  const to1_5 = problems.get('p05_3a');

  for (const id of METHOD_IDS) {
    assert.ok(
      Math.abs(methods.run(id, to1_3).yFinal - CANONICAL.at1_3[id]) < TOLERANCE,
      `${id} at x = 1.3`
    );
    assert.ok(
      Math.abs(methods.run(id, to1_5).yFinal - CANONICAL.at1_5[id]) < TOLERANCE,
      `${id} at x = 1.5`
    );
  }
  assert.ok(Math.abs(to1_3.exact(1.3) - CANONICAL.at1_3.exact) < TOLERANCE);
  assert.ok(Math.abs(to1_5.exact(1.5) - CANONICAL.at1_5.exact) < TOLERANCE);
});

test('iteration count follows (x_f - x_0)/h without floating point drift', () => {
  assert.equal(methods.stepCount(problems.get('p05_1c')), 3);
  assert.equal(methods.stepCount(problems.get('p05_3a')), 5);
  assert.equal(methods.stepCount(problems.get('p05_1d')), 4);
  assert.equal(methods.stepCount(problems.get('p05_2a')), 10);
  assert.equal(methods.stepCount(problems.get('p05_2b')), 2);
  assert.equal(methods.stepCount(problems.get('p05_2c')), 3);
  assert.equal(methods.stepCount(problems.get('p05_2d_B')), 5);
  assert.equal(methods.stepCount(problems.get('p05_3e')), 4);
});

test('each method reports its order, cost and analytic requirements', () => {
  const canonical = problems.canonical();
  const euler = methods.euler(canonical);
  const taylor = methods.taylor2(canonical);
  const mejorado = methods.eulerMejorado(canonical);
  const rk2 = methods.rk2Midpoint(canonical);

  assert.equal(euler.order, 1);
  assert.equal(taylor.order, 2);
  assert.equal(mejorado.order, 2);
  assert.equal(rk2.order, 2);

  assert.equal(euler.evaluationsPerStep, 1);
  assert.equal(taylor.evaluationsPerStep, 1);
  assert.equal(mejorado.evaluationsPerStep, 2);
  assert.equal(rk2.evaluationsPerStep, 2);

  assert.equal(taylor.needsPartials, true);
  assert.equal(euler.needsPartials, false);
  assert.equal(mejorado.needsPartials, false);
  assert.equal(rk2.needsPartials, false);
});

test('taylor2 refuses to run without the analytic partials', () => {
  const problem = problems.get('p05_3a');
  const stripped = problems.withStep(problem, problem.h);
  stripped.fx = undefined;
  assert.throws(() => methods.taylor2(stripped), /analytic partials/);
});

test('trace extras are internally consistent with each formula', () => {
  for (const fixture of ENDPOINTS) {
    const problem = problems.get(fixture.problem);
    const h = problem.h;

    for (const step of methods.euler(problem).rows) {
      assert.ok(Math.abs(step.yNext - (step.y + h * step.yPrime)) < 1e-12,
        `euler ${fixture.problem} n=${step.n}`);
      assert.ok(Math.abs(step.extras.term - h * step.yPrime) < 1e-12);
    }

    for (const step of methods.taylor2(problem).rows) {
      const e = step.extras;
      assert.ok(Math.abs(e.ySecond - (e.fx + e.fy * step.yPrime)) < 1e-12,
        `taylor2 chain rule ${fixture.problem} n=${step.n}`);
      assert.ok(Math.abs(e.termFirst - h * step.yPrime) < 1e-12);
      assert.ok(Math.abs(e.termSecond - (h * h / 2) * e.ySecond) < 1e-12);
      assert.ok(Math.abs(step.yNext - (step.y + e.termFirst + e.termSecond)) < 1e-12,
        `taylor2 sum ${fixture.problem} n=${step.n}`);
    }

    for (const step of methods.eulerMejorado(problem).rows) {
      const e = step.extras;
      assert.ok(Math.abs(e.predictor - (step.y + h * step.yPrime)) < 1e-12,
        `eulerMejorado predictor ${fixture.problem} n=${step.n}`);
      assert.ok(Math.abs(e.fPredictor - problem.f(step.xNext, e.predictor)) < 1e-12);
      assert.ok(Math.abs(e.slopeAverage - (step.yPrime + e.fPredictor) / 2) < 1e-12);
      assert.ok(Math.abs(step.yNext - (step.y + (h / 2) * (step.yPrime + e.fPredictor))) < 1e-12,
        `eulerMejorado sum ${fixture.problem} n=${step.n}`);
    }

    for (const step of methods.rk2Midpoint(problem).rows) {
      const e = step.extras;
      assert.ok(Math.abs(e.k1 - h * step.yPrime) < 1e-12,
        `rk2 k1 ${fixture.problem} n=${step.n}`);
      assert.ok(Math.abs(e.xMid - (step.x + h / 2)) < 1e-12);
      assert.ok(Math.abs(e.yMid - (step.y + e.k1 / 2)) < 1e-12);
      assert.ok(Math.abs(e.fMid - problem.f(e.xMid, e.yMid)) < 1e-12);
      assert.ok(Math.abs(step.yNext - (step.y + h * e.fMid)) < 1e-12,
        `rk2 y_{n+1} = y_n + h*fMid ${fixture.problem} n=${step.n}`);
    }
  }
});

test('on a linear f with constant partials the three second-order methods coincide', () => {
  for (const id of ['p05_2a', 'p05_2e_A', 'p05_2e_B']) {
    const problem = problems.get(id);
    const taylor = methods.taylor2(problem).yFinal;
    const mejorado = methods.eulerMejorado(problem).yFinal;
    const rk2 = methods.rk2Midpoint(problem).yFinal;
    assert.ok(Math.abs(taylor - mejorado) < 1e-12, `${id}: Taylor 2 vs Euler mejorado`);
    assert.ok(Math.abs(taylor - rk2) < 1e-12, `${id}: Taylor 2 vs RK2`);
  }
});

test('runAll covers the four methods of the catalog', () => {
  const traces = methods.runAll(problems.canonical());
  assert.deepEqual(Object.keys(traces).sort(), METHOD_IDS.slice().sort());
});
