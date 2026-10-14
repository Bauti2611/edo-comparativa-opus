'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const errors = require('../js/domain/errors.js');
const methods = require('../js/domain/methods.js');
const problems = require('../js/domain/problems.js');
const { CANONICAL, CONVERGENCE, TOLERANCE } = require('./fixtures.js');

const H_LIST = CONVERGENCE.map((entry) => entry.h);
const METHOD_IDS = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint'];

test('relative error at x = 1,5 matches the reference percentages', () => {
  const canonical = problems.canonical();
  for (const id of METHOD_IDS) {
    const trace = methods.run(id, canonical);
    const final = errors.finalError(canonical, trace);
    assert.ok(
      Math.abs(final.relativePercent - CANONICAL.relativePercentAt1_5[id]) < 1e-3,
      `${id}: ${final.relativePercent} %, expected ${CANONICAL.relativePercentAt1_5[id]} %`
    );
  }
});

test('absolute error at x = 1,5 matches the convergence table for every h', () => {
  const canonical = problems.canonical();
  for (const id of METHOD_IDS) {
    const study = errors.convergence(canonical, id, H_LIST);
    study.entries.forEach((entry, index) => {
      const expected = CONVERGENCE[index][id];
      const relative = Math.abs(entry.error - expected) / expected;
      assert.ok(
        relative < 2e-3,
        `${id} at h = ${entry.h}: ${entry.error.toExponential(4)}, expected ${expected.toExponential(4)}`
      );
    });
  }
});

test('observed order is about 1 for Euler and about 2 for the other three', () => {
  const canonical = problems.canonical();
  const expectedOrder = { euler: 1, taylor2: 2, eulerMejorado: 2, rk2Midpoint: 2 };

  for (const id of METHOD_IDS) {
    const study = errors.convergence(canonical, id, H_LIST);
    const finest = study.finestOrder;
    assert.ok(
      Math.abs(finest - expectedOrder[id]) <= 0.2,
      `${id}: observed order ${finest}, expected ${expectedOrder[id]} +/- 0.2`
    );
    // The two finest pairs should both be close, not just the last one.
    const previous = study.entries[study.entries.length - 2].observedOrder;
    assert.ok(
      Math.abs(previous - expectedOrder[id]) <= 0.2,
      `${id}: previous observed order ${previous}, expected ${expectedOrder[id]} +/- 0.2`
    );
  }
});

test('the error table has one row per computed point and starts at zero error', () => {
  const canonical = problems.canonical();
  const trace = methods.rk2Midpoint(canonical);
  const table = errors.errorTable(canonical, trace);
  assert.equal(table.length, trace.steps + 1);
  assert.equal(table[0].n, 0);
  assert.ok(table[0].absolute < 1e-12, 'the initial condition is exact by definition');
  assert.ok(table[table.length - 1].absolute > 0);
});

test('problems with no closed form report null errors instead of guessing', () => {
  for (const id of ['p05_2c', 'p05_3c']) {
    const problem = problems.get(id);
    const table = errors.errorTable(problem, methods.euler(problem));
    for (const entry of table) {
      assert.equal(entry.exact, null, id);
      assert.equal(entry.absolute, null, id);
      assert.equal(entry.relativePercent, null, id);
    }
  }
});

test('relative error is null when the exact value is zero', () => {
  assert.equal(errors.relativeErrorPercent(0.1, 0), null);
  assert.ok(Math.abs(errors.relativeErrorPercent(0.9, 1) - 10) < 1e-12);
});

test('halving h for Euler does not reach the second-order methods at full h', () => {
  const canonical = problems.canonical();
  const study = errors.halveVersusChange(canonical, 0.1);

  assert.ok(Math.abs(study.eulerAtH.error - CONVERGENCE[1].euler) < 1e-3);
  assert.ok(Math.abs(study.eulerAtHalfH.error - CONVERGENCE[2].euler) < 1e-3);

  for (const entry of study.secondOrder) {
    assert.ok(
      entry.error < study.eulerAtHalfH.error,
      `${entry.method} at h = 0.1 must still beat Euler at h = 0.05`
    );
  }

  // Euler needs twice the evaluations to halve h and is still far behind.
  assert.equal(study.eulerAtHalfH.evaluations, study.eulerAtH.evaluations * 2);
});

test('comparisonTable reports order, cost and analytic requirements per method', () => {
  const rows = errors.comparisonTable(problems.canonical());
  assert.equal(rows.length, 4);

  const byMethod = Object.fromEntries(rows.map((r) => [r.method, r]));
  assert.equal(byMethod.euler.order, 1);
  assert.equal(byMethod.taylor2.needsPartials, true);
  assert.equal(byMethod.eulerMejorado.evaluationsPerStep, 2);
  assert.ok(Math.abs(byMethod.rk2Midpoint.y - CANONICAL.at1_5.rk2Midpoint) < TOLERANCE);

  for (const row of rows) {
    assert.ok(row.absolute > 0);
    assert.ok(row.relativePercent > 0);
  }
});

test('Ej 3e is the counterexample: Euler lands closest at the endpoint', () => {
  const problem = problems.get('p05_3e');
  const rows = errors.comparisonTable(problem);
  const best = rows.slice().sort((a, b) => a.absolute - b.absolute)[0];
  assert.equal(
    best.method,
    'euler',
    'Ej 3e must keep working as the "a single point cannot rank methods" example'
  );
});

test('the ranking among the three second-order methods is not universal', () => {
  const winners = new Set();
  for (const problem of problems.catalog) {
    if (typeof problem.exact !== 'function') continue;
    const rows = errors.comparisonTable(problem)
      .filter((r) => r.order === 2)
      .sort((a, b) => a.absolute - b.absolute);
    winners.add(rows[0].method);
  }
  assert.ok(
    winners.size > 1,
    'at least two different second-order methods must win somewhere in the catalog'
  );
});

test('convergence refuses to run without an exact solution', () => {
  assert.throws(
    () => errors.convergence(problems.get('p05_2c'), 'euler', [0.2, 0.1]),
    /exact solution/
  );
});
