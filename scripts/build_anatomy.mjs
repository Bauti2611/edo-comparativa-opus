import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "file:///C:/Users/bisca/.gemini/config/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "file:///C:/Users/bisca/.gemini/config/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const WIDTH = 680;
const HEIGHT = 460;

// Dimensions
const PLATE = { x: -145, y: -75, w: 290, d: 150, r: 8 };
const PLATE_H = 14;
const FOOT_H = 6;

// Rails along X
const RAIL_Y1 = -38;
const RAIL_Y2 = 22;
const RAIL_X0 = -120;
const RAIL_X1 = 60;
const RAIL_Z = 4;
const RAIL_R = 3;

// Pillow blocks
const BLOCKS_X = [RAIL_X0 - 4, RAIL_X1 - 2];

// Carriage
const CARRIAGE_W = 48;
const CARRIAGE_D = 72;
const CARRIAGE_H = 8;
const CARRIAGE_Z = 6;

// Stand & Dial Indicator
const MAG = { x: 80, y: -25, w: 42, d: 42, r: 3 };
const MAG_H = 26;
const POST = [98, -4];
const POST_TOP = 135;
const CLAMP_Z = 108;
const DIAL = [4, -4];
const DIAL_R = 22;
const DIAL_Z = 92;
const DIAL_H = 11;
const DIAL_TOP = DIAL_Z + DIAL_H;

// Projection
const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [POST[0], POST[1], POST_TOP + 4],
    [DIAL[0] - DIAL_R, DIAL[1], DIAL_TOP + 4],
    [RAIL_X0 - 15, RAIL_Y1, RAIL_Z + 20],
    [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 0],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 44, elevation: 32 }
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

// 1. Granite Surface Plate & Feet
function buildBasePlate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  
  // 4 damped feet
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7.5, -PLATE_H - FOOT_H, 2.2, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.8, -PLATE_H - FOOT_H + 2.2, FOOT_H - 2.2, P, 28), { tone: "mid" }));
  }

  // Base slab
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5.5), 0, P), { tone: "lo" }));

  // Corner ground fixture screws
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5, tone: "mid" }));

  // Front precision millimeter ruler strip (The X axis / step h)
  const strip = { x: -115, y: PLATE.y + PLATE.d - 16, w: 180, d: 8, r: 1.2 };
  out.push(S(k.slabOf(strip, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 6, strip.x + strip.w - 6, 4, 5, strip.y + 1, 0.8, [2.2, 4.2], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 3, strip.y + 4, 0.8]), at([strip.x + strip.w - 3, strip.y + 4, 0.8])], { size: 0.45 }));

  // Engraved Spec Plaque (UTN FRLP Grupo 10)
  const plaque = { x: 78, y: PLATE.y + PLATE.d - 22, w: 58, d: 15, r: 1.5 };
  out.push(S(k.slabOf(plaque, 0, 0.6, P, 3), { tone: "mid", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plaque, 1.2), 0.6, P), { tone: "faint" }));
  const pScrews = k.corners(plaque, 2.5);
  out.push(D(pScrews.map(([x, y]) => at([x, y, 0.6])), { size: 0.35, tone: "lo" }));

  return out.join("");
}

// 2. Guide Rails & Pillow Blocks
function buildRails() {
  const out = [];

  // 4 Pillow blocks supporting the rails
  for (const bx of BLOCKS_X) {
    for (const by of [RAIL_Y1, RAIL_Y2]) {
      const block = { x: bx, y: by - 5, w: 8, d: 10, r: 1.5 };
      out.push(S(k.slabOf(block, 0, 7, P, 3, 0.5), { tone: "mid" }));
      out.push(D([at([bx + 4, by, 7])], { size: 0.45, tone: "hi" }));
    }
  }

  // Dual cylindrical guide rails
  for (const ry of [RAIL_Y1, RAIL_Y2]) {
    out.push(S(k.cylinder(RAIL_X0, ry, RAIL_R, RAIL_Z, 0.1, P, 24), { tone: "mid" }));
    // Rail cylinder along X
    const plan = { x: RAIL_X0, y: ry - RAIL_R, w: RAIL_X1 - RAIL_X0, d: RAIL_R * 2, r: 0.8 };
    out.push(S(k.slabOf(plan, RAIL_Z - 1, RAIL_R * 2, P, 3, 0.6), { tone: "mid", crease: "none" }));
  }

  // Center Acme lead screw with knurled end thumb-wheel
  const screwY = (RAIL_Y1 + RAIL_Y2) / 2;
  const screwPlan = { x: RAIL_X0, y: screwY - 1.6, w: RAIL_X1 - RAIL_X0, d: 3.2, r: 0.4 };
  out.push(S(k.slabOf(screwPlan, RAIL_Z + 1, 2.2, P, 2), { tone: "lo", crease: "none" }));

  // Knurled drive knob at rail start
  out.push(S(k.cylinder(RAIL_X0 - 8, screwY, 5.5, RAIL_Z - 1, 4, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(RAIL_X0 - 8, screwY, 5.5, RAIL_Z - 1, RAIL_Z + 3, 24, P), { tone: "lo" }));

  return out.join("");
}

// 3. Dial Indicator Stand & Magnetic Base
function buildDialStand() {
  const out = [];

  // Magnetic base
  out.push(S(k.slabOf(MAG, 0, 12, P, 5, 0.8), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(MAG, 1), 12, MAG_H - 12, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(MAG, 3), MAG_H, P), { tone: "faint" }));

  // Magnet ON/OFF rotary toggle knob
  const knob = [MAG.x + 30, MAG.y + 30];
  out.push(S(k.cylinder(knob[0], knob[1], 5.5, MAG_H, 4, P, 28), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 5.5, MAG_H, MAG_H + 4, 24, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([knob[0], knob[1]], [knob[0] + 5, knob[1]], MAG_H + 4, P), { tone: "hi" }));

  // Vertical Post
  out.push(S(k.cylinder(POST[0], POST[1], 4.8, MAG_H, 4, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(POST[0], POST[1], 3.4, MAG_H + 4, CLAMP_Z - 4 - MAG_H - 4, P, 28), { tone: "mid", crease: "none" }));
  
  // Articulated Swivel Clamp
  const clamp = { x: POST[0] - 7, y: POST[1] - 7, w: 14, d: 14, r: 2.5 };
  out.push(S(k.slabOf(clamp, CLAMP_Z - 4, 12, P, 4, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(POST[0], POST[1], 3.4, CLAMP_Z + 8, POST_TOP - CLAMP_Z - 8, P, 28), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(POST[0], POST[1], 4.2, POST_TOP, 2.5, P, 28), { tone: "mid" }));

  // Horizontal Support Arm
  const arm = { x: DIAL[0] - 2, y: POST[1] - 3, w: POST[0] - DIAL[0] + 5, d: 6, r: 2 };
  out.push(S(k.slabOf(arm, CLAMP_Z, 4.5, P, 4, 0.5), { tone: "mid" }));

  // Thumb screw on clamp
  const thumb = [clamp.x + 7, clamp.y + clamp.d + 3];
  out.push(S(k.cylinder(thumb[0], thumb[1], 2.8, CLAMP_Z, 6, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(thumb[0], thumb[1], 2.8, CLAMP_Z, CLAMP_Z + 6, 18, P), { tone: "lo" }));

  // Dial Gauge Housing
  out.push(S(k.cylinder(DIAL[0], DIAL[1], DIAL_R, DIAL_Z, DIAL_H, P, 44), { tone: "mid" }));
  out.push(L(k.knurl(DIAL[0], DIAL[1], DIAL_R, DIAL_Z + 2, DIAL_Z + DIAL_H - 2, 48, P), { tone: "lo" }));

  // Crystal Face & Inner Bezel
  out.push(L(k.ring(DIAL[0], DIAL[1], DIAL_R - 2.2, DIAL_TOP, P, 40), { tone: "mid" }));
  out.push(L(k.ring(DIAL[0], DIAL[1], DIAL_R - 4.5, DIAL_TOP, P, 40), { tone: "faint" }));

  // Dial Face Radial Ticks (0 to 100 graduations)
  const ticksD = k.radialTicks(DIAL[0], DIAL[1], DIAL_R - 5, 20, 5, DIAL_TOP, [1.8, 3.6], P);
  out.push(L(ticksD.minor, { tone: "lo" }), L(ticksD.major, { tone: "mid" }));

  // Center hub
  out.push(S(k.cylinder(DIAL[0], DIAL[1], 2.8, DIAL_TOP, 1.4, P, 24), { tone: "hi" }));

  return out.join("");
}

// 4. Moving Carriage & Method Mechanisms
function buildCarriage() {
  const out = [];

  // Carriage Base Slab with Bronze Bushings
  const carPlan = { x: -CARRIAGE_W / 2, y: -CARRIAGE_D / 2, w: CARRIAGE_W, d: CARRIAGE_D, r: 4 };
  out.push(S(k.slabOf(carPlan, CARRIAGE_Z, CARRIAGE_H, P, 6, 0.8), { tone: "mid" }));
  
  // 4 Bronze Bushing Collars
  for (const bx of [-CARRIAGE_W / 2 + 5, CARRIAGE_W / 2 - 5]) {
    for (const by of [RAIL_Y1, RAIL_Y2]) {
      out.push(S(k.cylinder(bx, by, 4.2, CARRIAGE_Z + CARRIAGE_H, 2.5, P, 20), { tone: "hi" }));
      out.push(D([at([bx, by, CARRIAGE_Z + CARRIAGE_H + 2.5])], { size: 0.45, tone: "lo" }));
    }
  }

  // Pointer Needle riding above the front ruler
  const ptrX = 0;
  const ptrY = carPlan.y + carPlan.d - 2;
  out.push(S(k.slabOf({ x: ptrX - 2, y: ptrY, w: 4, d: 8, r: 0.8 }, CARRIAGE_Z + CARRIAGE_H - 1, 2, P, 2), { tone: "lit" }));

  // Central Mode Selector Turret
  const turretX = 0;
  const turretY = 0;
  const turretZ = CARRIAGE_Z + CARRIAGE_H;
  out.push(S(k.cylinder(turretX, turretY, 11, turretZ, 5, P, 32), { tone: "hi" }));
  out.push(L(k.knurl(turretX, turretY, 11, turretZ + 1, turretZ + 4, 32, P), { tone: "lo" }));

  // Mode Indicator Pointer on Turret
  out.push(S(k.cylinder(turretX, turretY, 4, turretZ + 5, 2.5, P, 20), { tone: "lit" }));
  out.push(L(k.lineOnTop([turretX, turretY], [turretX + 9, turretY], turretZ + 5, P), { tone: "lit" }));

  // Method Mechanism 1: Taylor 2 Curvature Cam Quadrant
  const camQuadrant = { x: -16, y: -22, w: 10, d: 14, r: 2 };
  out.push(S(k.slabOf(camQuadrant, turretZ, 6, P, 3, 0.5), { tone: "mid", className: "mech-taylor" }));
  out.push(L(k.knurl(camQuadrant.x + 5, camQuadrant.y + 7, 4, turretZ, turretZ + 6, 12, P), { tone: "faint", className: "mech-taylor" }));

  // Method Mechanism 2: Heun Dual-Feeler Rocker Bar (Balancín Trapecial)
  // Feeler 1 at X0, Feeler 2 at X1, Rocker Bar pivoting at 50%
  const feeler1 = { x: -14, y: 12 };
  const feeler2 = { x: 14, y: 12 };
  out.push(S(k.cylinder(feeler1.x, feeler1.y, 2, turretZ, 12, P, 16), { tone: "mid", className: "mech-heun" }));
  out.push(S(k.cylinder(feeler2.x, feeler2.y, 2, turretZ, 15, P, 16), { tone: "mid", className: "mech-heun" }));
  // Rocker arm connecting the two feelers
  const rockerPlan = { x: -16, y: 10.5, w: 32, d: 3, r: 1 };
  out.push(S(k.slabOf(rockerPlan, turretZ + 10, 3, P, 2), { tone: "hi", className: "mech-heun" }));
  // Central 50% rocker pivot pin (Averages the two slopes!)
  out.push(S(k.cylinder(0, 12, 2.5, turretZ + 10, 4.5, P, 16), { tone: "lit", className: "mech-heun" }));

  // Method Mechanism 3: RK2 Midpoint Drop-Leg (Palpador Central xm)
  // Drops at exact midpoint, with spring coil
  const rkLeg = { x: 0, y: -16 };
  out.push(S(k.cylinder(rkLeg.x, rkLeg.y, 2.8, turretZ, 14, P, 18), { tone: "hi", className: "mech-rk2" }));
  const spring = k.coil(turretZ + 2, turretZ + 11, [rkLeg.x, rkLeg.y], 4.2, 5, "z", P);
  out.push(`<path class="iso-stroke mech-rk2" d="${spring.back}"/>`);
  out.push(`<path class="iso-stroke mech-rk2" d="${spring.front}"/>`);
  out.push(S(k.cylinder(rkLeg.x, rkLeg.y, 4, turretZ + 13, 2.5, P, 20), { tone: "lit", className: "mech-rk2" }));

  // Ordinate Lifter Platform (contacts Dial Gauge Plunger)
  const padPlan = { x: -6, y: -6, w: 12, d: 12, r: 2 };
  out.push(S(k.slabOf(padPlan, turretZ + 14, 3, P, 3, 0.5), { tone: "lit" }));
  out.push(D([at([0, 0, turretZ + 17])], { size: 0.5, tone: "lit" }));

  return out.join("");
}

// Dial Needle Line generator function for dynamic live rotation
function needleAt(turns) {
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = DIAL_R - 5;
  const tail = 3.5;
  const nx = DIAL[0] + Math.cos(angle) * len;
  const ny = DIAL[1] + Math.sin(angle) * len;
  const tx = DIAL[0] - Math.cos(angle) * tail;
  const ty = DIAL[1] - Math.sin(angle) * tail;
  return k.lineOnTop([tx, ty], [nx, ny], DIAL_TOP + 1.2, P);
}

// Assemble SVG
const baseSvg = buildBasePlate();
const railsSvg = buildRails();
const standSvg = buildDialStand();
const carriageSvg = buildCarriage();

// Plunger assembly (moves vertically)
const plungerBase = DIAL_TOP - 2;
const plungerStem = S(k.cylinder(DIAL[0], DIAL[1], 1.8, DIAL_Z - 18, 20, P, 18), { tone: "hi" });
const plungerTip = S(k.cylinder(DIAL[0], DIAL[1], 2.4, DIAL_Z - 20, 2.5, P, 18), { tone: "lit" });

const svg = `
<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" class="iso-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .mech-taylor, .mech-heun, .mech-rk2 { transition: opacity 0.3s ease, transform 0.3s ease; }
      [data-mode="taylor"] .mech-taylor { opacity: 1; filter: drop-shadow(0 0 2px var(--iso-lit)); }
      [data-mode="taylor"] .mech-heun { opacity: 0.25; }
      [data-mode="taylor"] .mech-rk2 { opacity: 0.25; }

      [data-mode="heun"] .mech-taylor { opacity: 0.25; }
      [data-mode="heun"] .mech-heun { opacity: 1; filter: drop-shadow(0 0 2px var(--iso-lit)); }
      [data-mode="heun"] .mech-rk2 { opacity: 0.25; }

      [data-mode="rk2"] .mech-taylor { opacity: 0.25; }
      [data-mode="rk2"] .mech-heun { opacity: 0.25; }
      [data-mode="rk2"] .mech-rk2 { opacity: 1; filter: drop-shadow(0 0 2px var(--iso-lit)); }

      .mode-btn {
        background: var(--iso-fill-mid, #222);
        color: var(--iso-ink-mid, #aaa);
        border: 1px solid var(--iso-stroke-mid, #444);
        border-radius: 4px;
        padding: 4px 10px;
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .mode-btn:hover {
        background: var(--iso-fill-hi, #333);
        color: var(--iso-ink-hi, #fff);
        border-color: var(--iso-stroke-hi, #888);
      }
      .mode-btn.active {
        background: var(--iso-accent, #4f46e5);
        color: #fff;
        border-color: #818cf8;
      }
      .controls-bar {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
        margin-top: 12px;
      }
    </style>
  </defs>

  <!-- Static Base, Rails, Stand -->
  <g class="iso-base">${baseSvg}</g>
  <g class="iso-rails">${railsSvg}</g>
  <g class="iso-stand">${standSvg}</g>

  <!-- Sliding Carriage -->
  <g id="carriage" transform="translate(0,0)">
    ${carriageSvg}
  </g>

  <!-- Vertical Indicator Plunger -->
  <g id="plunger" transform="translate(0,0)">
    ${plungerStem}
    ${plungerTip}
  </g>

  <!-- Moving Indicator Needle -->
  <path id="needle" class="iso-stroke" style="stroke-width:1.4px; stroke:var(--iso-lit)" d="${needleAt(0)}"/>
</svg>
`;

// Runtime Script for Interactive Stepping & Mode Switching
const live = `
const svg = document.querySelector(".iso-svg");
const stage = document.querySelector(".iso-stage");
const carriage = document.getElementById("carriage");
const plunger = document.getElementById("plunger");
const needle = document.getElementById("needle");
const readout = document.querySelector(".iso-readout");
const still = window.matchMedia("(prefers-reduced-motion: reduce)");

const P = ${JSON.stringify(P)};

// ODE Model: y' = 2xy, y(1) = 1, h = 0.1
// Modes:
// 1. Taylor 2: y1 = 1 + 0.1(2) + 0.005(6) = 1.2300 (err = 0.00368)
// 2. Heun: k1=2.0, k2=2.64, avg=2.32, y1 = 1.2320 (err = 0.00168)
// 3. RK2: k1=2.0, xm=1.05, ym=1.10, k2=2.31, y1 = 1.2310 (err = 0.00268)

const MODES = {
  taylor: {
    name: "Taylor (Grado 2)",
    tag: "Derivación analítica",
    desc: "y''=2y+4x²y evaluada por regla de la cadena analítica",
    y1: 1.2300,
    k1: 2.000,
    k2: null,
    needleRot: 0.300, // fractional turn of dial
    plungerLift: 6.0,
    error: "0.00368 (baja curvatura)"
  },
  heun: {
    name: "Euler Mejorado (Heun)",
    tag: "Predictor-Corrector",
    desc: "Balancín promedia pendiente inicial k₁=2.000 y final k₂=2.640",
    y1: 1.2320,
    k1: 2.000,
    k2: 2.640,
    needleRot: 0.320,
    plungerLift: 7.2,
    error: "0.00168 (más exacto aquí)"
  },
  rk2: {
    name: "Runge-Kutta 2 (Punto Medio)",
    tag: "Muestreo central",
    desc: "Palpador central muestrea k₂=2.3100 en el centro xm=1.05",
    y1: 1.2310,
    k1: 2.000,
    k2: 2.310,
    needleRot: 0.310,
    plungerLift: 6.6,
    error: "0.00268 (óptimo balance)"
  }
};

let currentMode = "heun";
let stepProgress = 1.0; // 0 = at x0 (1.0), 1 = at x1 (1.1)
let targetProgress = 1.0;
let last = 0, frame = 0, touring = true, clock = 0;

const DIAL = [4, -4];
const DIAL_TOP = 103;
const DIAL_R = 22;

function calcNeedle(turns) {
  const angle = turns * Math.PI * 2 - Math.PI / 2;
  const len = DIAL_R - 5;
  const tail = 3.5;
  const nx = DIAL[0] + Math.cos(angle) * len;
  const ny = DIAL[1] + Math.sin(angle) * len;
  const tx = DIAL[0] - Math.cos(angle) * tail;
  const ty = DIAL[1] - Math.sin(angle) * tail;
  return lineOnTop([tx, ty], [nx, ny], DIAL_TOP + 1.2, P);
}

function updateMode(modeKey) {
  currentMode = modeKey;
  stage.setAttribute("data-mode", modeKey);
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === modeKey);
  });
  render();
}

function render() {
  const m = MODES[currentMode];
  // Carriage slides from -70 (x=1.0) to -10 (x=1.1)
  const carX = -70 + stepProgress * 60;
  carriage.setAttribute("transform", translateAlong(P, [carX, 0, 0]));

  // Plunger lift depends on progress and mode
  const lift = stepProgress * m.plungerLift;
  plunger.setAttribute("transform", translateAlong(P, [0, 0, lift]));

  // Needle rotates to indicate computed y1
  const rot = stepProgress * m.needleRot;
  needle.setAttribute("d", calcNeedle(rot));

  // Live Readout
  const currX = (1.0 + stepProgress * 0.1).toFixed(2);
  const currY = (1.0 + stepProgress * (m.y1 - 1.0)).toFixed(4);
  const text = m.name + " · x=" + currX + " → y=" + currY + " · " + m.desc;
  if (readout.textContent !== text) readout.textContent = text;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) {
    clock += dt;
    // Auto tour: smoothly oscillate progress and switch modes every 6 seconds
    const phase = Math.sin(clock * 1.2);
    targetProgress = 0.5 + 0.5 * phase;
    const modeKeys = ["taylor", "heun", "rk2"];
    const modeIdx = Math.floor(clock / 4.5) % 3;
    if (modeKeys[modeIdx] !== currentMode) {
      updateMode(modeKeys[modeIdx]);
    }
  }

  stepProgress += (targetProgress - stepProgress) * (1 - Math.exp(-dt / 0.25));
  render();

  frame = requestAnimationFrame(tick);
}

// User Controls
document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    touring = false;
    targetProgress = 1.0;
    updateMode(btn.dataset.target);
  });
});

stage.addEventListener("pointermove", (e) => {
  touring = false;
  const box = stage.getBoundingClientRect();
  const share = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
  targetProgress = share;
});

stage.addEventListener("pointerleave", () => {
  targetProgress = 1.0;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "1") updateMode("taylor");
  if (e.key === "2") updateMode("heun");
  if (e.key === "3") updateMode("rk2");
  if (e.key === " ") touring = !touring;
});

updateMode("heun");
frame = requestAnimationFrame(tick);
`;

function buildPage(theme) {
  const cardBody = k.plateHtml({
    fig: "Fig 1",
    title: "Banco Cinemático de EDO — Comparador de Pendientes",
    hint: "Deslizá el cursor para mover el carro h=0.1 · Presioná [1], [2] o [3] para alternar métodos",
    readout: "Euler Mejorado (Heun) · x=1.10 → y=1.2320 · Balancín promedia k₁=2.000 y k₂=2.640",
    keys: [
      { mark: "lit", label: "Palpador & Cuadrante: mecanismo activo que calcula la inclinación del paso" },
      { mark: "raised", label: "Riel graduado (eje x) con división en x₀=1.00, xm=1.05 y x₁=1.10" },
    ],
    caption:
      "Un banco dinamométrico trazador de curvas diferenciales. El carro avanza sobre el riel graduado un paso h = 0.1 en la EDO y' = 2xy. En modo Taylor, un cuadrante angular impone la curvatura analítica y''. En modo Heun, un balancín basculante promedia las pendientes de los dos extremos. En modo RK2, un palpador telescópico muestrea la pendiente central en el punto medio x_m.",
    body: `
      <div class="iso-stage" data-mode="heun" tabindex="0" role="slider" aria-label="Banco cinemático de EDO: comparativa Taylor, Heun y RK2" aria-valuemin="0" aria-valuemax="1" aria-valuenow="1">
        ${svg}
      </div>
      <div class="controls-bar">
        <button class="mode-btn" data-target="taylor">[1] Taylor (Grado 2)</button>
        <button class="mode-btn active" data-target="heun">[2] Euler Mejorado (Heun)</button>
        <button class="mode-btn" data-target="rk2">[3] Runge-Kutta 2 (Punto Medio)</button>
      </div>
    `,
  });

  const fullHtml = k.pageHtml({
    title: "Anatomy: Banco Cinemático de EDO — Grupo 10",
    theme,
    body: cardBody,
    script: kitScript() + live,
  });

  const filename = theme === "light" ? "anatomy-light.html" : "anatomy.html";
  const destPath = join(ROOT, filename);
  writeFileSync(destPath, fullHtml);
  console.log("Wrote", destPath);
}

buildPage("dark");
buildPage("light");
