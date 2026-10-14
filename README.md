# Comparativa: Taylor, Euler mejorado y Runge-Kutta 2

Sitio web de la defensa oral del **Grupo 10** de Análisis Numérico
(UTN FRLP, cátedra Ing. Diego Amiconi · Ing. Germán Céspedes).

**Tema:** Comparativa de los métodos de Taylor de grado 2, Euler mejorado y
Runge-Kutta de grado 2 (punto medio) para problemas de valor inicial.

**Integrantes:** Bautista Biscayart · Santino Maya · Milagros Belén Olivera ·
Zoe Ramljak.

**Exposición:** lunes 19 de octubre de 2026, 6.º lugar, Ronda 3.

---

## Cómo abrirlo

Haga doble clic en `index.html`. Se abre en Chrome, Edge o Firefox sin
conexión a internet, sin instalar nada y sin ningún paso de compilación.

El sitio es HTML, CSS y JavaScript sin frameworks. Las tipografías están
incluidas en `assets/fonts/` y la matemática se dibuja con MathML nativo, de
modo que nada se descarga en tiempo de ejecución. Esto es deliberado: el aula
puede no tener internet.

### Abrirlo ya configurado para el aula

La página acepta dos parámetros en la dirección, útiles para dejar preparado un
acceso directo en el escritorio de la máquina que proyecta:

```
index.html?theme=dark&projector=on#/mesa
```

| Parámetro     | Valores        | Efecto                                   |
| ------------- | -------------- | ---------------------------------------- |
| `theme`       | `light`, `dark`| Fija el tema                             |
| `projector`   | `on`, `off`    | Activa el modo proyector                 |
| `#/<capítulo>`| ver más abajo  | Abre directamente ese capítulo           |

Sin parámetros, el tema sigue la preferencia del sistema operativo y se
recuerda la última elección hecha con los botones.

### Si prefiere servirlo por HTTP

No hace falta, pero funciona igual:

```
python -m http.server 5600
```

y abrir `http://localhost:5600`. La configuración ya está en
`.claude/launch.json` con el nombre `edo-static`.

---

## Atajos de teclado para exponer

| Tecla                | Acción                                              |
| -------------------- | --------------------------------------------------- |
| `→` o `AvPág`        | Capítulo siguiente                                   |
| `←` o `RePág`        | Capítulo anterior                                    |
| `1` … `8`            | Ir directamente a ese capítulo                       |
| `Inicio` / `Fin`     | Primer o último capítulo                             |
| `Tab`                | Recorrer los controles; el foco siempre se ve        |

**Dentro de la Mesa de integración**, con el foco puesto en la figura (haga
clic en ella o llegue con `Tab`), las flechas cambian de significado:

| Tecla     | Acción                      |
| --------- | --------------------------- |
| `→`       | Siguiente iteración          |
| `←`       | Iteración anterior           |
| `Inicio`  | Volver a la iteración 0      |

Los dos botones del encabezado controlan el **tema claro/oscuro** y el **modo
proyector**, que agranda toda la tipografía para que se lea desde el fondo del
aula. Ambas elecciones se recuerdan entre sesiones.

---

## Los capítulos

| #  | Dirección      | Contenido                                                        |
| -- | -------------- | ---------------------------------------------------------------- |
| 1  | `#/problema`   | La pregunta comparativa y los cuatro datos del P.V.I.            |
| 2  | `#/formulas`   | Las cuatro fórmulas en una página, con sus deducciones plegadas  |
| 3  | `#/mesa`       | Mesa de integración: la demostración interactiva                 |
| 4  | `#/ejercicios` | Los 15 planteos de las prácticas, resueltos paso a paso          |
| 5  | `#/criterios`  | Los cinco criterios de comparación, declarados antes de los datos |
| 6  | `#/evidencia`  | Curvas, errores, orden observado, contraejemplo y guía de decisión |
| 7  | `#/conclusion` | Cinco conclusiones, construidas con los números calculados        |
| 8  | `#/fuentes`    | Material de la cátedra, bibliografía y qué aporta el grupo        |

---

## Cómo correr los tests

```
node --test tests/
```

Requiere Node 20 o posterior; no hay dependencias que instalar. Los tests
verifican, entre otras cosas:

- los cuatro métodos contra los valores de referencia de los 15 ejercicios;
- que cada solución analítica satisface **la ecuación diferencial y la
  condición inicial** (no se da por buena ninguna solución sin comprobarla);
- que las derivadas parciales declaradas coinciden con la derivación numérica
  de `f`;
- que el orden de convergencia observado es ≈ 1 para Euler y ≈ 2 para los
  otros tres;
- que las cantidades intermedias de cada traza son coherentes con su fórmula
  (por ejemplo, que RK2 cumple `y_{n+1} = y_n + h·f(punto medio)`);
- que el sitio no referencia ninguna URL remota en tiempo de ejecución.

Una comprobación rápida adicional, que además imprime los números principales:

```
node scripts/smoke.js
```

---

## Cómo editar `js/config.js`

Es el único archivo que hace falta tocar para los cambios habituales.

### Datos del grupo

```js
group: {
  number: 10,
  title: '…',
  members: ['Bautista Biscayart', '…']
}
```

Los nombres, la fecha y el orden de exposición aparecen en el capítulo 1 y en
el encabezado. Cambiarlos aquí los cambia en todo el sitio.

### Pasos del estudio de convergencia

```js
convergenceSteps: [0.2, 0.1, 0.05, 0.025, 0.0125]
```

Los pasos que usa el capítulo 6 para medir el orden. Un paso que no divide
exactamente al intervalo se muestra igual, pero atenuado y sin usarse para
medir el orden: la marcha se detiene antes del extremo y la comparación no
sería válida.

### Decimales del arrastre de redondeo

```js
roundingDecimals: 4
```

Cuántos decimales arrastra el modo "arrastre de redondeo" de la Mesa de
integración, que reproduce la forma de iterar a mano.

### Valores publicados en el apunte

```js
APUNTE_VALUES: {
  mostrarVerificacion: false,
  …
}
```

`mostrarVerificacion` está en `false`. Con ese valor, el sitio muestra
únicamente los valores que calcula su propio motor en doble precisión.

Si se lo pone en `true`, cada ejemplo afectado agrega una línea neutra con el
valor publicado en el apunte junto al valor recalculado con la misma fórmula.
Es información, no una corrección: el apunte resuelve a mano arrastrando cuatro
decimales entre iteraciones.

### Colores e identidad de cada método

```js
methodStyle: {
  euler: { label: 'Euler', dash: null, marker: 'circle' },
  …
}
```

Cada método tiene color, patrón de línea y forma de marcador propios. Los
colores están en `css/tokens.css` (`--m-euler`, `--m-taylor`, `--m-mejorado`,
`--m-rk2`), definidos por separado para el tema claro y el oscuro. El patrón
de línea y el marcador existen para que la identidad **nunca dependa sólo del
color**: así se distinguen en un proyector mal calibrado, impresos en blanco y
negro, o por alguien con daltonismo.

---

## Estructura

```
index.html              Las ocho secciones vacías; los scripts las completan
css/tokens.css          Tipografías, colores de ambos temas, escala de tipos
css/base.css            Reset, tipografía, foco visible
css/app.css             Maquetado y componentes
js/config.js            Grupo, estilos de método, APUNTE_VALUES
js/domain/              Matemática pura, sin DOM, usable también desde Node
js/ui/                  Render, gráficos SVG, ruteo y la Mesa de integración
tests/                  Tests del runner propio de Node
scripts/smoke.js        Comprobación rápida por consola
docs/                   Copias de los PDF de la cátedra
assets/fonts/           Tipografías incluidas (Chivo, Source Serif 4, Azeret Mono)
```

Los módulos de `js/domain/` no tocan el DOM y se exportan tanto a
`window.EDO` como a `module.exports`, de modo que el mismo código que dibuja el
sitio es el que verifican los tests.

---

## Qué es de la cátedra y qué aporta el grupo

**De la cátedra:** la definición de P.V.I. y sus cuatro datos, el concepto de
ordenada genérica, la clasificación en paso simple y paso múltiple, las cuatro
fórmulas con su notación exacta (incluido el `h²/2!` y el `h/2!`), la variante
de punto medio para RK2, los enunciados de los ejercicios y los ejemplos
resueltos.

**Del grupo:** las soluciones analíticas y su verificación, el error absoluto y
relativo, la notación `O(hⁿ)`, el orden de convergencia y su medición empírica,
los criterios de comparación, la guía de decisión y toda la implementación
interactiva. Los cuatro PDF de la cátedra no contienen soluciones analíticas,
fórmulas de error, notación `O(hⁿ)` ni criterios de convergencia; esa parte
proviene de Chapra & Canale, *Métodos numéricos para ingenieros*
(McGraw-Hill) y de Burden & Faires, *Análisis numérico* (Cengage), y está
atribuida como tal dentro del sitio.
