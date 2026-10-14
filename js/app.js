/**
 * Boot. Wires the masthead controls, starts the theme and the router.
 * Loaded last, after every module has registered itself on window.EDO.
 */
(function (root) {
  'use strict';

  var D = root.EDO.dom;
  var CONFIG = root.EDO.config;
  var Theme = root.EDO.theme;
  var Router = root.EDO.router;

  var el = D.el;

  function labelForTheme() {
    return Theme.effectiveTheme() === 'dark' ? 'Tema claro' : 'Tema oscuro';
  }

  function buildMasthead() {
    var themeButton = el('button.btn', {
      type: 'button',
      text: labelForTheme(),
      'aria-label': 'Cambiar entre tema claro y oscuro',
      onClick: function () {
        Theme.toggleTheme();
        themeButton.textContent = labelForTheme();
      }
    });

    var projectorButton = el('button.btn.btn--accent', {
      type: 'button',
      text: 'Modo proyector',
      'aria-pressed': Theme.isProjector() ? 'true' : 'false',
      'aria-label': 'Agrandar la tipografía para proyectar en el aula',
      onClick: function () {
        var on = Theme.toggleProjector();
        projectorButton.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });

    return el('header.masthead', null, [
      el('div.masthead__identity', null, [
        el('span.masthead__group', {
          text: 'Grupo ' + CONFIG.group.number + ' · ' + CONFIG.group.subject
        }),
        el('span.masthead__title', { text: CONFIG.group.title })
      ]),
      el('div.masthead__controls', null, [themeButton, projectorButton])
    ]);
  }

  function boot() {
    Theme.init();

    var shell = document.getElementById('shell');
    var rail = document.getElementById('rail');
    if (!shell || !rail) return;

    shell.insertBefore(buildMasthead(), rail);
    Router.init(rail);

    // Keep the theme button label honest if the system theme changes.
    Theme.onChange(function () {
      var button = shell.querySelector('.masthead__controls .btn');
      if (button) button.textContent = labelForTheme();
    });

    document.documentElement.setAttribute('data-ready', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
