'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const problems = require('../js/domain/problems.js');
const { ENDPOINTS } = require('./fixtures.js');

/** Central difference, accurate enough to confirm an analytic solution. */
function derivative(fn, x, step) {
  const h = step || 1e-6;
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

test('the catalog is complete and every entry is well formed', () => {
  assert.equal(problems.catalog.length, ENDPOINTS.length);
  const seen = new Set();
  for (const problem of problems.catalog) {
    assert.ok(!seen.has(problem.id), `duplicate id ${problem.id}`);
    seen.add(problem.id);

    assert.equal(typeof problem.label, 'string');
    assert.equal(typeof problem.source, 'string');
    assert.ok(problem.varName === 'x' || problem.varName === 't', problem.id);
    assert.equal(typeof problem.f, 'function', problem.id);
    assert.equal(typeof problem.fx, 'function', problem.id);
    assert.equal(typeof problem.fy, 'function', problem.id);
    assert.equal(typeof problem.mmlF, 'function', problem.id);
    assert.equal(typeof problem.mmlFx, 'function', problem.id);
    assert.equal(typeof problem.mmlFy, 'function', problem.id);
    assert.ok(Number.isFinite(problem.x0), problem.id);
    assert.ok(Number.isFinite(problem.y0), problem.id);
    assert.ok(problem.h > 0, problem.id);
    assert.ok(problem.xf > problem.x0, problem.id);
    assert.ok(
      ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'].includes(problem.assignedMethod),
      `${problem.id} assignedMethod`
    );
  }
});

test('the analytic partials agree with numeric differentiation of f', () => {
  for (const problem of problems.catalog) {
    // Sample inside the domain, away from the endpoints.
    for (let i = 1; i <= 4; i += 1) {
      const x = problem.x0 + (problem.xf - problem.x0) * (i / 5);
      const y = problem.y0 === 0 ? 0.37 : problem.y0 * 1.1;

      const numericFx = (problem.f(x + 1e-6, y) - problem.f(x - 1e-6, y)) / 2e-6;
      const numericFy = (problem.f(x, y + 1e-6) - problem.f(x, y - 1e-6)) / 2e-6;

      assert.ok(
        Math.abs(problem.fx(x, y) - numericFx) < 1e-4 * (1 + Math.abs(numericFx)),
        `${problem.id} fx at (${x}, ${y}): ${problem.fx(x, y)} vs ${numericFx}`
      );
      assert.ok(
        Math.abs(problem.fy(x, y) - numericFy) < 1e-4 * (1 + Math.abs(numericFy)),
        `${problem.id} fy at (${x}, ${y}): ${problem.fy(x, y)} vs ${numericFy}`
      );
    }
  }
});

test('every exact solution satisfies the initial condition', () => {
  for (const problem of problems.catalog) {
    if (typeof problem.exact !== 'function') continue;
    assert.ok(
      Math.abs(problem.exact(problem.x0) - problem.y0) < 1e-9,
      `${problem.id}: y(${problem.x0}) = ${problem.exact(problem.x0)}, expected ${problem.y0}`
    );
  }
});

test('every exact solution satisfies the differential equation', () => {
  for (const problem of problems.catalog) {
    if (typeof problem.exact !== 'function') continue;
    for (let i = 1; i <= 6; i += 1) {
      const x = problem.x0 + (problem.xf - problem.x0) * (i / 7);
      const y = problem.exact(x);
      const numeric = derivative(problem.exact, x, 1e-6);
      const analytic = problem.f(x, y);
      assert.ok(
        Math.abs(numeric - analytic) < 1e-4 * (1 + Math.abs(analytic)),
        `${problem.id} at ${x}: dy/dx = ${numeric}, f(x,y) = ${analytic}`
      );
    }
  }
});

test('exact endpoint values match the reference table', () => {
  for (const fixture of ENDPOINTS) {
    const problem = problems.get(fixture.problem);
    if (fixture.exact === null) {
      assert.equal(problem.exact, null, `${fixture.problem} must declare no exact solution`);
      continue;
    }
    assert.ok(
      Math.abs(problem.exact(problem.xf) - fixture.exact) < 1e-5,
      `${fixture.problem}: exact(${problem.xf}) = ${problem.exact(problem.xf)}, expected ${fixture.exact}`
    );
  }
});

test('the canonical problem is the one the whole site threads through', () => {
  const canonical = problems.canonical();
  assert.equal(canonical.id, 'p05_3a');
  assert.equal(canonical.canonical, true);
  assert.equal(canonical.x0, 1);
  assert.equal(canonical.y0, 1);
  assert.equal(canonical.h, 0.1);
  assert.equal(canonical.xf, 1.5);
});

test('withStep clones without mutating the original problem', () => {
  const canonical = problems.canonical();
  const refined = problems.withStep(canonical, 0.025);
  assert.equal(refined.h, 0.025);
  assert.equal(canonical.h, 0.1);
  assert.equal(refined.id, canonical.id);
  assert.equal(refined.f, canonical.f);

  const shortened = problems.withStep(canonical, 0.1, 1.3);
  assert.equal(shortened.xf, 1.3);
  assert.equal(canonical.xf, 1.5);
});

test('the four P.V.I. elements are reported for every problem', () => {
  for (const problem of problems.catalog) {
    const elements = problems.elements(problem);
    assert.equal(elements.length, 4, problem.id);
    assert.match(elements[0].term, /Ecuaci/);
    assert.match(elements[1].term, /Condici/);
    assert.match(elements[2].term, /Dominio/);
    assert.match(elements[3].term, /Paso/);
    assert.ok(elements[2].value.includes(problem.varName), problem.id);
  }
});

test('the two problems used in the apunte expose a simplified y″', () => {
  assert.equal(typeof problems.get('p05_1c').mmlYSecond, 'function');
  assert.equal(typeof problems.get('p05_3a').mmlYSecond, 'function');
});
