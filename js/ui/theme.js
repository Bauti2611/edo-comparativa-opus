/**
 * Theme and projector mode.
 *
 * Both are stored in localStorage inside try/catch: on file:// some browsers
 * refuse storage access entirely, and the site must keep working when they do.
 * Without a stored choice the theme follows prefers-color-scheme.
 */
(function (root) {
  'use strict';

  var THEME_KEY = 'edo.theme';
  var PROJECTOR_KEY = 'edo.projector';

  function readStored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStored(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function systemPrefersDark() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      return false;
    }
  }

  /** The theme actually in effect, whether chosen or inherited. */
  function effectiveTheme() {
    var explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function applyProjector(on) {
    document.documentElement.setAttribute('data-projector', on ? 'on' : 'off');
  }

  var listeners = [];

  function notify() {
    var state = { theme: effectiveTheme(), projector: isProjector() };
    listeners.forEach(function (fn) {
      try {
        fn(state);
      } catch (error) {
        /* a broken listener must not take the page down mid-presentation */
      }
    });
  }

  function isProjector() {
    return document.documentElement.getAttribute('data-projector') === 'on';
  }

  function toggleTheme() {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeStored(THEME_KEY, next);
    notify();
    return next;
  }

  function toggleProjector() {
    var next = !isProjector();
    applyProjector(next);
    writeStored(PROJECTOR_KEY, next ? 'on' : 'off');
    notify();
    return next;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  /**
   * Presentation override from the URL, so a desktop shortcut can open the
   * site already set up for the classroom:
   *   index.html?theme=dark&projector=on#/mesa
   * The override wins over the stored preference and is itself stored, so the
   * toggles keep working normally afterwards.
   */
  function readOverride(name) {
    var match = new RegExp('[?&]' + name + '=([a-z]+)').exec(window.location.search || '');
    return match ? match[1] : null;
  }

  /** Read the stored preferences and reflect them on <html>. */
  function init() {
    var overrideTheme = readOverride('theme');
    var overrideProjector = readOverride('projector');

    var storedTheme = overrideTheme || readStored(THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      applyTheme(storedTheme);
      if (overrideTheme) writeStored(THEME_KEY, storedTheme);
    }

    var projector = overrideProjector !== null
      ? overrideProjector === 'on'
      : readStored(PROJECTOR_KEY) === 'on';
    applyProjector(projector);
    if (overrideProjector !== null) writeStored(PROJECTOR_KEY, projector ? 'on' : 'off');

    // Follow the system theme while the visitor has made no explicit choice.
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!document.documentElement.hasAttribute('data-theme')) notify();
      });
    } catch (error) {
      /* older engines: no listener, the initial value still applies */
    }
  }

  var api = {
    init: init,
    effectiveTheme: effectiveTheme,
    isProjector: isProjector,
    toggleTheme: toggleTheme,
    toggleProjector: toggleProjector,
    onChange: onChange
  };

  root.EDO = root.EDO || {};
  root.EDO.theme = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
