'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const rounding = require('../js/domain/rounding.js');
const methods = require('../js/domain/methods.js');
const problems = require('../js/domain/problems.js');
const { APUNTE_CARRIED_DIGITS } = require('./fixtures.js');
const { APUNTE_VALUES } = require('../js/config.js');

test('the truncating carry reproduces the apunte’s digits exactly where it is consistent', () => {
  for (const [methodId, spec] of Object.entries(APUNTE_CARRIED_DIGITS)) {
    const problem = problems.get(spec.problem);
    const trace = rounding.runRounded(methodId, problem, spec.decimals, { mode: 'truncate' });
    const produced = trace.points.slice(1).map((p) => p.y);

    spec.truncatedPrefix.forEach((expected, index) => {
      assert.ok(
        Math.abs(produced[index] - expected) < 1e-9,
        `${methodId} iteration ${index + 1}: carried ${produced[index]}, apunte publishes ${expected}`
      );
    });
  }
});

test('the carry lands within one unit in the last place of every published value', () => {
  for (const [methodId, spec] of Object.entries(APUNTE_CARRIED_DIGITS)) {
    const problem = problems.get(spec.problem);
    const ulp = Math.pow(10, -spec.decimals);

    for (const mode of ['round', 'truncate']) {
      const produced = rounding
        .runRounded(methodId, problem, spec.decimals, { mode })
        .points.slice(1)
        .map((p) => p.y);

      assert.equal(produced.length, spec.values.length, `${methodId}/${mode}`);
      produced.forEach((value, index) => {
        assert.ok(
          Math.abs(value - spec.values[index]) <= ulp + 1e-12,
          `${methodId}/${mode} iteration ${index + 1}: carried ${value}, published ${spec.values[index]}`
        );
      });
    }
  }
});

test('the carry stays at the declared number of decimals', () => {
  const problem = problems.get('p05_1c');
  for (const mode of ['round', 'truncate']) {
    const trace = rounding.runRounded('taylor2', problem, 4, { mode });
    assert.equal(trace.decimals, 4);
    assert.equal(trace.mode, mode);
    for (const point of trace.points) {
      assert.ok(
        Math.abs(point.y * 1e4 - Math.round(point.y * 1e4)) < 1e-6,
        `${mode}: ${point.y} carries more than four decimals`
      );
    }
  }
});

test('truncation never rounds a value up', () => {
  assert.equal(rounding.truncateTo(1.98765, 4), 1.9876);
  assert.equal(rounding.truncateTo(-1.98765, 4), -1.9876);
  assert.equal(rounding.truncateTo(1.23456, null), 1.23456);
  assert.equal(rounding.quantize(1.98765, 4, 'truncate'), 1.9876);
  assert.equal(rounding.quantize(1.98765, 4, 'round'), 1.9877);
  assert.equal(rounding.quantize(1.98765, 4), 1.9877);
});

test('the rounding carry is off by default and changes nothing when off', () => {
  const problem = problems.canonical();
  const plain = methods.taylor2(problem);
  assert.equal(plain.decimals, null);
  const explicit = methods.taylor2(problem, { decimals: null });
  assert.equal(plain.yFinal, explicit.yFinal);
});

test('compare puts both runs side by side with their difference', () => {
  const problem = problems.get('p05_1c');
  const comparison = rounding.compare('taylor2', problem, 4);

  assert.equal(comparison.decimals, 4);
  assert.equal(comparison.rows.length, 4);
  assert.equal(comparison.rows[0].difference, 0);

  const last = comparison.rows[comparison.rows.length - 1];
  assert.ok(Math.abs(last.full - 1.972761) < 1e-5);
  assert.ok(Math.abs(last.rounded - 1.9728) < 1e-9);
  assert.ok(last.difference > 0 && last.difference < 1e-3);
});

test('roundTo rounds half away from zero on both signs', () => {
  assert.equal(rounding.roundTo(1.23456, 4), 1.2346);
  assert.equal(rounding.roundTo(-1.23456, 4), -1.2346);
  assert.equal(rounding.roundTo(1.5, 0), 2);
  assert.equal(rounding.roundTo(-1.5, 0), -2);
  assert.equal(rounding.roundTo(1.23456, null), 1.23456);
  assert.equal(rounding.roundTo(1.23456, undefined), 1.23456);
});

test('APUNTE_VALUES keeps the verification line off by default', () => {
  assert.equal(APUNTE_VALUES.mostrarVerificacion, false);
});

test('APUNTE_VALUES recomputed figures agree with the engine', () => {
  const taylor = APUNTE_VALUES.examples.taylorCanonical;
  const engineTaylor = methods.taylor2(problems.get(taylor.problem));
  assert.ok(
    Math.abs(engineTaylor.yFinal - taylor.recomputed[taylor.recomputed.length - 1].y) < 1e-5
  );

  const rk2 = APUNTE_VALUES.examples.rk2Canonical;
  const engineRk2 = methods.rk2Midpoint(problems.get(rk2.problem));
  assert.ok(Math.abs(engineRk2.yFinal - rk2.recomputed[rk2.recomputed.length - 1].y) < 1e-5);

  const euler = APUNTE_VALUES.examples.eulerSine;
  const engineEuler = methods.euler(problems.get(euler.problem));
  assert.ok(Math.abs(engineEuler.yFinal - euler.recomputed[euler.recomputed.length - 1].y) < 1e-5);

  // The Euler mejorado example of the apunte uses h = 0.5 on Ej 2a's equation.
  const mejorado = APUNTE_VALUES.examples.eulerMejoradoLinear;
  const base = problems.get(mejorado.problem);
  const atHalf = problems.withStep(base, mejorado.problemStep, mejorado.problemEnd);
  const engineMejorado = methods.eulerMejorado(atHalf);
  assert.ok(
    Math.abs(engineMejorado.yFinal - mejorado.recomputed[mejorado.recomputed.length - 1].y) < 1e-5,
    `engine ${engineMejorado.yFinal}`
  );
});

test('every APUNTE_VALUES example carries a published list and a neutral note', () => {
  for (const [key, example] of Object.entries(APUNTE_VALUES.examples)) {
    assert.ok(Array.isArray(example.published) && example.published.length > 0, key);
    assert.ok(Array.isArray(example.recomputed), key);
    assert.equal(example.published.length, example.recomputed.length, key);
    assert.equal(typeof example.note, 'string', key);
    assert.ok(example.note.length > 0, key);
    // The note must stay neutral: no judgement about the material or its author.
    assert.doesNotMatch(example.note, /error|equivoc|incorrect|mal\b|falla/i, key);
  }
});
