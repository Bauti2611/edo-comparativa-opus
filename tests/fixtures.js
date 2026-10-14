'use strict';

/**
 * Reference values computed in double precision. Every one of these is a value
 * the site must reproduce; they are the contract of js/domain/methods.js.
 */

/** Canonical P.V.I.: y' = 2xy, y(1) = 1, h = 0.1. Exact y = e^(x^2-1). */
const CANONICAL = {
  problem: 'p05_3a',
  at1_3: {
    euler: 1.815360,
    taylor2: 1.972761,
    eulerMejorado: 1.983150,
    rk2Midpoint: 1.977951,
    exact: 1.993716
  },
  at1_5: {
    euler: 2.927813,
    taylor2: 3.418817,
    eulerMejorado: 3.450929,
    rk2Midpoint: 3.434843,
    exact: 3.490343
  },
  relativePercentAt1_5: {
    euler: 16.117,
    taylor2: 2.049,
    eulerMejorado: 1.129,
    rk2Midpoint: 1.590
  }
};

/** Global error at x = 1.5 on the canonical P.V.I., per step size. */
const CONVERGENCE = [
  { h: 0.2, euler: 1.418e0, taylor2: 1.005e0, eulerMejorado: 9.492e-1, rk2Midpoint: 9.771e-1 },
  { h: 0.1, euler: 5.625e-1, taylor2: 7.153e-2, eulerMejorado: 3.941e-2, rk2Midpoint: 5.550e-2 },
  { h: 0.05, euler: 3.171e-1, taylor2: 2.018e-2, eulerMejorado: 1.080e-2, rk2Midpoint: 1.549e-2 },
  { h: 0.025, euler: 1.694e-1, taylor2: 5.357e-3, eulerMejorado: 2.825e-3, rk2Midpoint: 4.091e-3 },
  { h: 0.0125, euler: 8.767e-2, taylor2: 1.379e-3, eulerMejorado: 7.223e-4, rk2Midpoint: 1.051e-3 }
];

/** Endpoint values for every exercise of the catalog. null = no closed form. */
const ENDPOINTS = [
  {
    problem: 'p05_1a',
    euler: 2.737305, taylor2: 2.657994, eulerMejorado: 2.640502, rk2Midpoint: 2.649143,
    exact: 2.647491
  },
  {
    problem: 'p05_1b',
    euler: 1.278470, taylor2: 1.287109, eulerMejorado: 1.287328, rk2Midpoint: 1.287218,
    exact: 1.287427
  },
  {
    problem: 'p05_1c',
    euler: 1.815360, taylor2: 1.972761, eulerMejorado: 1.983150, rk2Midpoint: 1.977951,
    exact: 1.993716
  },
  {
    problem: 'p05_1d',
    euler: -1.0, taylor2: -1.458885, eulerMejorado: -1.202087, rk2Midpoint: -1.287666,
    exact: -1.2
  },
  {
    problem: 'p05_2a',
    euler: 1.348678, taylor2: 1.368541, eulerMejorado: 1.368541, rk2Midpoint: 1.368541,
    exact: 1.367879
  },
  {
    problem: 'p05_2b',
    euler: 1.042979, taylor2: 1.076860, eulerMejorado: 1.095316, rk2Midpoint: 1.090105,
    exact: 1.091818
  },
  {
    problem: 'p05_2c',
    euler: 1.709324, taylor2: 1.635270, eulerMejorado: 1.643035, rk2Midpoint: 1.639241,
    exact: null
  },
  {
    problem: 'p05_2d_A',
    euler: 1.219446, taylor2: 1.322554, eulerMejorado: 1.325970, rk2Midpoint: 1.324191,
    exact: 1.333333
  },
  {
    problem: 'p05_2d_B',
    euler: 1.050555, taylor2: 1.066312, eulerMejorado: 1.066259, rk2Midpoint: 1.066282,
    exact: 1.066667
  },
  {
    problem: 'p05_2e_A',
    euler: 1.820740, taylor2: 2.080108, eulerMejorado: 2.080108, rk2Midpoint: 2.080108,
    exact: 2.053216
  },
  {
    problem: 'p05_2e_B',
    euler: 2.817867, taylor2: 2.945169, eulerMejorado: 2.945169, rk2Midpoint: 2.945169,
    exact: 2.938881
  },
  {
    problem: 'p05_3a',
    euler: 2.927813, taylor2: 3.418817, eulerMejorado: 3.450929, rk2Midpoint: 3.434843,
    exact: 3.490343
  },
  {
    problem: 'p05_3b',
    euler: 3.226050, taylor2: 3.751092, eulerMejorado: 3.825415, rk2Midpoint: 3.787806,
    exact: 3.908223
  },
  {
    problem: 'p05_3c',
    euler: 0.100461, taylor2: 0.126401, eulerMejorado: 0.126556, rk2Midpoint: 0.126478,
    exact: null
  },
  {
    problem: 'p05_3e',
    euler: 1.700002, taylor2: 1.720483, eulerMejorado: 1.692289, rk2Midpoint: 1.706051,
    exact: 1.701870
  }
];

/**
 * Digits the apunte publishes for its own Taylor and RK2 worked examples.
 *
 * The apunte works these by hand carrying four decimals, but it does not apply
 * one single quantization rule throughout: the second iteration of each example
 * matches a truncated carry and the third matches a rounded one. So the contract
 * the engine can hold is: the truncated carry reproduces `truncatedPrefix`
 * exactly, and every published value sits within one unit in the last place of
 * the carried run.
 */
const APUNTE_CARRIED_DIGITS = {
  taylor2: {
    problem: 'p05_1c',
    decimals: 4,
    values: [1.23, 1.5426, 1.9727],
    truncatedPrefix: [1.23, 1.5426]
  },
  rk2Midpoint: {
    problem: 'p05_1c',
    decimals: 4,
    values: [1.231, 1.5452, 1.9779],
    truncatedPrefix: [1.231, 1.5452]
  }
};

const TOLERANCE = 1e-5;

module.exports = {
  CANONICAL,
  CONVERGENCE,
  ENDPOINTS,
  APUNTE_CARRIED_DIGITS,
  TOLERANCE
};
