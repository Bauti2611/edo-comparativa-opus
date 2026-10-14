/**
 * Minimal DOM helpers. No framework, no templating: the site is small enough
 * that explicit element construction stays readable.
 */
(function (root) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * el('div.block', { id: 'x' }, [child, 'text'])
   * The first argument accepts a tag plus dot-separated classes.
   */
  function el(selector, attrs, children) {
    var parts = String(selector).split('.');
    var node = document.createElement(parts[0] || 'div');
    for (var i = 1; i < parts.length; i += 1) {
      if (parts[i]) node.classList.add(parts[i]);
    }
    applyAttrs(node, attrs);
    append(node, children);
    return node;
  }

  /** Same shape as `el`, for the SVG namespace. */
  function svg(selector, attrs, children) {
    var parts = String(selector).split('.');
    var node = document.createElementNS(SVG_NS, parts[0] || 'g');
    for (var i = 1; i < parts.length; i += 1) {
      if (parts[i]) node.classList.add(parts[i]);
    }
    applyAttrs(node, attrs);
    append(node, children);
    return node;
  }

  function applyAttrs(node, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'text') {
        node.textContent = String(value);
      } else if (key === 'html') {
        node.innerHTML = value;
      } else if (key === 'class') {
        String(value).split(/\s+/).forEach(function (name) {
          if (name) node.classList.add(name);
        });
      } else if (key === 'dataset') {
        Object.keys(value).forEach(function (dataKey) {
          if (value[dataKey] !== null && value[dataKey] !== undefined) {
            node.dataset[dataKey] = value[dataKey];
          }
        });
      } else if (key.slice(0, 2) === 'on' && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, '');
      } else {
        node.setAttribute(key, String(value));
      }
    });
  }

  function append(node, children) {
    if (children === null || children === undefined) return;
    var list = Array.isArray(children) ? children : [children];
    list.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      if (Array.isArray(child)) {
        append(node, child);
      } else if (typeof child === 'string' || typeof child === 'number') {
        node.appendChild(document.createTextNode(String(child)));
      } else {
        node.appendChild(child);
      }
    });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  /**
   * Parse a MathML string into live nodes. `innerHTML` on an HTML element
   * handles MathML correctly in every target browser, and this keeps the math
   * builders free of DOM concerns.
   */
  function mathNode(markup) {
    var holder = document.createElement('div');
    holder.innerHTML = markup;
    var fragment = document.createDocumentFragment();
    while (holder.firstChild) fragment.appendChild(holder.firstChild);
    return fragment;
  }

  /** A wrapper element whose content is one block of math. */
  function mathBlock(markup, className) {
    var node = el('div' + (className ? '.' + className : ''));
    node.appendChild(mathNode(markup));
    return node;
  }

  var api = {
    SVG_NS: SVG_NS,
    el: el,
    svg: svg,
    clear: clear,
    append: append,
    mathNode: mathNode,
    mathBlock: mathBlock
  };

  root.EDO = root.EDO || {};
  root.EDO.dom = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
