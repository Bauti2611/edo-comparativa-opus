'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

function walk(dir, filter, found) {
  const out = found || [];
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative, filter, out);
    else if (filter(entry.name)) out.push(relative);
  }
  return out;
}

const SOURCE_FILES = ['index.html']
  .concat(walk('js', (name) => name.endsWith('.js')))
  .concat(walk('css', (name) => name.endsWith('.css')));

test('every domain module loads under Node and registers itself on EDO', () => {
  const modules = walk('js/domain', (name) => name.endsWith('.js'));
  assert.ok(modules.length >= 7, `expected the full domain layer, found ${modules.length}`);

  for (const relative of modules) {
    const exported = require(path.join(ROOT, relative));
    assert.equal(typeof exported, 'object', relative);
    assert.ok(Object.keys(exported).length > 0, `${relative} exports nothing`);
  }
});

test('the dual-use wrapper attaches every module to one global namespace', () => {
  const namespace = {};
  const expected = {
    'js/config.js': ['config', 'APUNTE_VALUES'],
    'js/domain/mathml.js': ['mathml'],
    'js/domain/format.js': ['format'],
    'js/domain/methods.js': ['methods'],
    'js/domain/problems.js': ['problems'],
    'js/domain/errors.js': ['errors'],
    'js/domain/rounding.js': ['rounding'],
    'js/domain/slopeField.js': ['slopeField'],
    'js/domain/genericOrdinate.js': ['genericOrdinate']
  };

  for (const [relative, keys] of Object.entries(expected)) {
    const source = read(relative);
    assert.ok(
      source.includes("typeof window !== 'undefined' ? window : globalThis"),
      `${relative} must use the dual-use wrapper`
    );
    assert.ok(
      source.includes("typeof module !== 'undefined'"),
      `${relative} must export for Node`
    );
    for (const key of keys) {
      assert.ok(source.includes('root.EDO.' + key), `${relative} must attach EDO.${key}`);
      namespace[key] = true;
    }
  }
  assert.ok(Object.keys(namespace).length >= 9);
});

test('nothing references an http(s) URL that would be fetched at runtime', () => {
  // Namespace strings and citation text are fine; a loadable reference is not.
  const loadable = /(?:src|href)\s*=\s*["']https?:\/\//i;
  const cssImport = /@import[^;]*https?:\/\//i;
  const cssUrl = /url\(\s*["']?https?:\/\//i;

  for (const relative of SOURCE_FILES) {
    const source = read(relative);
    assert.doesNotMatch(source, loadable, `${relative} loads a remote resource`);
    assert.doesNotMatch(source, cssImport, `${relative} imports a remote stylesheet`);
    assert.doesNotMatch(source, cssUrl, `${relative} references a remote url()`);
  }
});

test('the only allowed https strings are the MathML/SVG namespaces', () => {
  const allowed = [
    'http://www.w3.org/1998/Math/MathML',
    'http://www.w3.org/2000/svg',
    'http://www.w3.org/1999/xhtml'
  ];
  for (const relative of SOURCE_FILES) {
    const source = read(relative);
    const matches = source.match(/https?:\/\/[^\s"'()<>]+/g) || [];
    for (const url of matches) {
      assert.ok(
        allowed.includes(url),
        `${relative} contains the unexpected URL ${url}`
      );
    }
  }
});

test('no ES module script and no fetch of a local file (both blocked on file://)', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /type\s*=\s*["']module["']/i, 'file:// blocks module scripts');
  assert.match(html, /<script src="[^"]+" defer><\/script>/, 'classic deferred scripts only');

  for (const relative of SOURCE_FILES) {
    const source = read(relative);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${relative} uses fetch, blocked on file://`);
    assert.doesNotMatch(source, /\bimport\s+[\w{*]/, `${relative} uses an ES import`);
    assert.doesNotMatch(source, /XMLHttpRequest/, `${relative} uses XHR, blocked on file://`);
  }
});

test('scripts are declared in dependency order with config and domain first', () => {
  const html = read('index.html');
  const order = [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)]
    .map((match) => match[1]);

  assert.ok(order.length >= 10, `expected the full script list, found ${order.length}`);
  assert.equal(order[0], 'js/config.js');

  const indexOf = (file) => order.indexOf(file);
  assert.ok(indexOf('js/domain/mathml.js') < indexOf('js/domain/problems.js'));
  assert.ok(indexOf('js/domain/format.js') < indexOf('js/domain/genericOrdinate.js'));
  assert.ok(indexOf('js/domain/methods.js') < indexOf('js/domain/errors.js'));
  assert.ok(indexOf('js/domain/problems.js') < indexOf('js/domain/errors.js'));
  for (const file of order) {
    assert.ok(
      fs.existsSync(path.join(ROOT, file)),
      `index.html declares ${file}, which does not exist`
    );
  }
  // app.js boots the UI, so it must come last.
  assert.equal(order[order.length - 1], 'js/app.js');
});

test('every vendored font is a real, non-trivial woff2', () => {
  const fonts = fs.readdirSync(path.join(ROOT, 'assets/fonts'))
    .filter((name) => name.endsWith('.woff2'));
  assert.ok(fonts.length >= 6, `expected the vendored faces, found ${fonts.length}`);

  for (const name of fonts) {
    const buffer = fs.readFileSync(path.join(ROOT, 'assets/fonts', name));
    assert.equal(buffer.subarray(0, 4).toString('latin1'), 'wOF2', `${name} is not woff2`);
    assert.ok(buffer.length > 4000, `${name} is only ${buffer.length} bytes`);
  }
});

test('every @font-face points at a file that exists, with a real fallback', () => {
  const css = read('css/tokens.css');
  const sources = [...css.matchAll(/url\(["']([^"']+)["']\)/g)].map((m) => m[1]);
  assert.ok(sources.length >= 6);
  for (const source of sources) {
    const resolved = path.join(ROOT, 'css', source);
    assert.ok(fs.existsSync(resolved), `@font-face references the missing ${source}`);
  }
  assert.match(css, /font-display:\s*swap/);
  // Each stack must name a generic family so a missing file still renders.
  assert.match(css, /--font-display:[^;]*sans-serif/);
  assert.match(css, /--font-body:[^;]*serif/);
  assert.match(css, /--font-mono:[^;]*monospace/);
});

test('both themes are defined, including the prefers-color-scheme fallback', () => {
  const css = read('css/tokens.css');
  assert.match(css, /:root\s*\{/);
  assert.match(css, /:root\[data-theme="dark"\]/);
  assert.match(css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
  assert.match(css, /:root:not\(\[data-theme="light"\]\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('method colours carry a secondary encoding so identity is never colour alone', () => {
  const { config } = require('../js/config.js');
  const styles = config.methodStyle;
  for (const id of ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint', 'exact']) {
    assert.ok(styles[id], `missing style for ${id}`);
    assert.equal(typeof styles[id].label, 'string');
  }
  const dashes = ['taylor2', 'eulerMejorado', 'rk2Midpoint', 'exact']
    .map((id) => styles[id].dash);
  assert.equal(new Set(dashes).size, dashes.length, 'dash patterns must be distinct');

  const markers = ['euler', 'taylor2', 'eulerMejorado', 'rk2Midpoint']
    .map((id) => styles[id].marker);
  assert.equal(new Set(markers).size, markers.length, 'markers must be distinct');
});

test('the launch configuration serves the folder on the agreed port', () => {
  const launch = JSON.parse(read('.claude/launch.json'));
  assert.equal(launch.version, '0.0.1');
  assert.equal(launch.configurations.length, 1);
  const entry = launch.configurations[0];
  assert.equal(entry.name, 'edo-static');
  assert.equal(entry.runtimeExecutable, 'python');
  assert.deepEqual(entry.runtimeArgs, ['-m', 'http.server', '5600']);
  assert.equal(entry.port, 5600);
});

test('the copied course material is present under ASCII names', () => {
  for (const file of [
    'docs/05-practica-edo-pvi.pdf',
    'docs/06-practica-edo-contorno.pdf',
    'docs/06-ejemplos-resueltos-edo-amiconi.pdf'
  ]) {
    const stat = fs.statSync(path.join(ROOT, file));
    assert.ok(stat.size > 10000, `${file} is only ${stat.size} bytes`);
    assert.match(file, /^[\x20-\x7E]+$/, `${file} must be ASCII`);
  }
});

test('no build artefact sneaked in: no package.json, no bundler config', () => {
  for (const forbidden of [
    'package.json', 'package-lock.json', 'node_modules',
    'vite.config.js', 'webpack.config.js', 'tsconfig.json'
  ]) {
    assert.equal(
      fs.existsSync(path.join(ROOT, forbidden)),
      false,
      `${forbidden} must not exist: the brief forbids any build step`
    );
  }
});

test('the optional apunte verification line is wired into the exercises chapter', () => {
  const views = read('js/ui/views.js');
  const exercises = read('js/ui/exercises.js');
  const { APUNTE_VALUES } = require('../js/config.js');

  // The builder exists, respects the switch, and is actually called.
  assert.match(views, /function apunteVerification/);
  assert.match(views, /if \(!APUNTE\.mostrarVerificacion\) return null;/);
  assert.match(exercises, /V\.apunteVerification\(/);

  // Every example must be reachable: its problem+method pair has to exist.
  const problems = require('../js/domain/problems.js');
  const methods = require('../js/domain/methods.js');
  for (const [key, example] of Object.entries(APUNTE_VALUES.examples)) {
    assert.doesNotThrow(() => problems.get(example.problem), `${key} problem`);
    assert.ok(methods.descriptors[example.method], `${key} method ${example.method}`);
  }
});

test('every chapter declared in the router has a section in index.html', () => {
  const html = read('index.html');
  const router = read('js/ui/router.js');
  const ids = [...router.matchAll(/id:\s*'([a-z]+)'/g)].map((m) => m[1]);
  assert.ok(ids.length >= 7, `expected the chapter list, found ${ids.length}`);
  for (const id of ids) {
    assert.ok(
      html.includes('id="chapter-' + id + '"'),
      `index.html has no section for chapter ${id}`
    );
  }
});
