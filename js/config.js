/**
 * Everything editable in one place: who the group is, what the methods are
 * called, which colours they wear, and the values the apunte publishes.
 *
 * Only the numbers inside APUNTE_VALUES are hardcoded. Every other number the
 * site shows is produced at runtime by the modules under js/domain/.
 */
(function (root) {
  'use strict';

  var config = {
    group: {
      number: 10,
      title: 'Comparativa de los métodos: Taylor, Euler Mejorado y Runge-Kutta 2 (RK2)',
      subject: 'Análisis Numérico',
      faculty: 'UTN · Facultad Regional La Plata',
      chair: 'Cátedra Ing. Diego Amiconi · Ing. Germán Céspedes',
      date: 'Lunes 19 de octubre de 2026',
      slot: '6.º lugar · Ronda 3',
      members: [
        'Bautista Biscayart',
        'Santino Maya',
        'Milagros Belén Olivera',
        'Zoe Ramljak'
      ]
    },

    /**
     * Per-method identity. `dash` and `marker` are the secondary encodings that
     * carry identity when colour alone is not enough (projector, colour vision
     * deficiency, black-and-white printout).
     */
    methodStyle: {
      euler: { label: 'Euler', dash: null, marker: 'circle' },
      taylor2: { label: 'Taylor 2', dash: '7 3', marker: 'triangle' },
      eulerMejorado: { label: 'Euler mejorado', dash: '2 3', marker: 'square' },
      rk2Midpoint: { label: 'RK2 punto medio', dash: '10 3 2 3', marker: 'diamond' },
      exact: { label: 'Solución exacta', dash: '4 4', marker: null }
    },

    /** Steps used by the convergence study in the evidence chapter. */
    convergenceSteps: [0.2, 0.1, 0.05, 0.025, 0.0125],

    /** Decimals carried by the optional "arrastre de redondeo" mode. */
    roundingDecimals: 4,

    sources: {
      apunte: {
        title: 'Ejemplos resueltos. Ecuaciones Diferenciales Ordinarias: Problemas de Valor Inicial',
        author: 'Ing. Diego Federico Amiconi',
        publisher: 'Cátedras de Modelos Numéricos, Análisis Numérico y Cálculo Avanzado, UTN FRLP',
        file: 'docs/06-ejemplos-resueltos-edo-amiconi.pdf'
      },
      practica05: {
        title: 'Práctica de Ecuaciones Diferenciales Ordinarias (Problemas de Valor Inicial)',
        publisher: 'Cátedras de Modelos Numéricos y Cálculo Avanzado, UTN FRLP',
        file: 'docs/05-practica-edo-pvi.pdf'
      },
      practica06: {
        title: 'Práctica de Ecuaciones Diferenciales Ordinarias (2.º parte) y Problemas de Contorno',
        publisher: 'Cátedras de Modelos Numéricos, Análisis Numérico y Cálculo Avanzado, UTN FRLP',
        file: 'docs/06-practica-edo-contorno.pdf'
      },
      chapra: {
        title: 'Métodos numéricos para ingenieros',
        author: 'Steven C. Chapra y Raymond P. Canale',
        publisher: 'McGraw-Hill'
      },
      burden: {
        title: 'Análisis numérico',
        author: 'Richard L. Burden y J. Douglas Faires',
        publisher: 'Cengage Learning'
      }
    }
  };

  /**
   * Values the apunte publishes for its own worked examples.
   *
   * `mostrarVerificacion` is false by default: with it off the site shows only
   * the engine's own double-precision values and says nothing about any
   * difference. With it on, each affected example renders one neutral line.
   */
  var APUNTE_VALUES = {
    mostrarVerificacion: false,

    examples: {
      taylorCanonical: {
        method: 'taylor2',
        problem: 'p05_1c',
        title: 'Ejemplo de Taylor de grado 2 del apunte',
        published: [
          { n: 1, x: 1.1, y: 1.23 },
          { n: 2, x: 1.2, y: 1.5426 },
          { n: 3, x: 1.3, y: 1.9727 }
        ],
        recomputed: [
          { n: 1, x: 1.1, y: 1.23 },
          { n: 2, x: 1.2, y: 1.542666 },
          { n: 3, x: 1.3, y: 1.972761 }
        ],
        note: 'El apunte arrastra valores de cuatro decimales entre iteraciones.'
      },

      rk2Canonical: {
        method: 'rk2Midpoint',
        problem: 'p05_1c',
        title: 'Ejemplo de Runge-Kutta de grado 2 del apunte',
        published: [
          { n: 1, x: 1.1, y: 1.231 },
          { n: 2, x: 1.2, y: 1.5452 },
          { n: 3, x: 1.3, y: 1.9779 }
        ],
        recomputed: [
          { n: 1, x: 1.1, y: 1.231 },
          { n: 2, x: 1.2, y: 1.545274 },
          { n: 3, x: 1.3, y: 1.977951 }
        ],
        note: 'El apunte arrastra valores de cuatro decimales entre iteraciones.'
      },

      eulerSine: {
        method: 'euler',
        problem: 'p05_2b',
        title: 'Ejemplo de Euler del apunte',
        published: [
          { n: 1, x: 0.5, y: 0.5 },
          { n: 2, x: 1, y: 1.4297 }
        ],
        recomputed: [
          { n: 1, x: 0.5, y: 0.5 },
          { n: 2, x: 1, y: 1.042979 }
        ],
        note: 'Recalculado con la misma expresión del apunte: 0,5 + 0,5·[sen(0,5) + e⁻⁰˙⁵].'
      },

      eulerMejoradoLinear: {
        method: 'eulerMejorado',
        problem: 'p05_2a',
        problemStep: 0.5,
        problemEnd: 1,
        title: 'Ejemplo de Euler mejorado del apunte',
        published: [
          { n: 1, x: 0.5, y: 1.125 },
          { n: 2, x: 1, y: 1.4843 }
        ],
        recomputed: [
          { n: 1, x: 0.5, y: 1.125 },
          { n: 2, x: 1, y: 1.390625 }
        ],
        note: 'Recalculado con la misma expresión del apunte, con h = 0,5.'
      }
    }
  };

  root.EDO = root.EDO || {};
  root.EDO.config = config;
  root.EDO.APUNTE_VALUES = APUNTE_VALUES;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { config: config, APUNTE_VALUES: APUNTE_VALUES };
  }
})(typeof window !== 'undefined' ? window : globalThis);
