'use strict';

/**
 * Node smoke check: require every domain module, confirm it registered itself
 * on the shared EDO namespace, and print the headline numbers the site shows.
 *
 *   node scripts/smoke.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DOMAIN = path.join(ROOT, 'js', 'domain');

const files = fs.readdirSync(DOMAIN).filter((name) => name.endsWith('.js')).sort();

console.log('--- requiring js/domain/*.js -------------------------------------');
for (const name of files) {
  const exported = require(path.join(DOMAIN, name));
  const keys = Object.keys(exported);
  console.log(`  ok  js/domain/${name}  (${keys.length} exports)`);
}
require(path.join(ROOT, 'js', 'config.js'));

const registered = Object.keys(globalThis.EDO).sort();
console.log(`\n  EDO namespace: ${registered.join(', ')}`);

const { methods, problems, errors, format: F, config } = globalThis.EDO;

console.log('\n--- canonical P.V.I. --------------------------------------------');
const canonical = problems.canonical();
console.log(`  ${canonical.odeDisplay}, y(${canonical.x0}) = ${canonical.y0}, ` +
  `h = ${canonical.h}, hasta x = ${canonical.xf}  (${methods.stepCount(canonical)} iteraciones)`);

for (const row of errors.comparisonTable(canonical)) {
  console.log(
    `  ${row.name.padEnd(38)} y = ${F.fixed(row.y, 6).padStart(10)}` +
    `   error ${F.scientific(row.absolute).padStart(11)}` +
    `   rel ${F.percent(row.relativePercent).padStart(11)}`
  );
}

console.log('\n--- observed order of convergence -------------------------------');
const studies = errors.convergenceAll(canonical, config.convergenceSteps);
for (const id of methods.order) {
  const study = studies[id];
  console.log(
    `  ${methods.descriptors[id].name.padEnd(38)} teorico ${methods.descriptors[id].order}` +
    `   observado ${F.order(study.finestOrder)}`
  );
}

console.log('\n--- catalog -----------------------------------------------------');
let withExact = 0;
for (const problem of problems.catalog) {
  if (typeof problem.exact === 'function') withExact += 1;
}
console.log(`  ${problems.catalog.length} ejercicios, ${withExact} con solucion analitica`);

for (const problem of problems.catalog) {
  const trace = methods.run(problem.assignedMethod, problem);
  console.log(
    `  ${problem.label.padEnd(24)} ${problem.assignedMethod.padEnd(14)}` +
    ` y(${F.trim(problem.xf)}) = ${F.fixed(trace.yFinal, 6)}`
  );
}

console.log('\nsmoke check passed');
