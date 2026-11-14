// Shared laptop geometry for FeaturedWorks + CloudProjects.
// Both SVGs use viewBox 1461x822, so one box size works for both.

export const LAPTOP_VIEWBOX = { w: 1461, h: 822 } as const;

type Pt = readonly [number, number];
export type Quad = readonly [Pt, Pt, Pt, Pt]; // TL, TR, BR, BL

// Glass hole of laptopsvg.svg (angled), pushed out ~2.5 units under the bezel.
export const SIDE_QUAD: Quad = [
  [159, 7.5],
  [978, 25.6],
  [977.9, 670.7],
  [159.8, 717.2],
];

// Glass hole of laptopfront.svg (axis-aligned, measured x 175..1270, y 8..715),
// pushed out 2.5 units. Re-measure these four points if you swap the SVG.
export const FRONT_QUAD: Quad = [
  [172.5, 5.5],
  [1272.5, 5.5],
  [1272.5, 717.5],
  [172.5, 717.5],
];

// Size of the flat .fw-screen surface (16:10).
export const SRC_W = 960;
export const SRC_H = 600;

/**
 * 'crossfade' -> approach 2: side art fades into laptopfront.svg while the screen
 *                quad slides from SIDE_QUAD to FRONT_QUAD.
 * 'morph'     -> approach 1: only laptopsvg.svg is used; the whole artwork is
 *                projectively warped so its glass lands on FRONT_QUAD.
 */
export type LaptopMode = 'crossfade' | 'morph';
export const LAPTOP_MODE: LaptopMode = 'morph';

// crossfade window inside the 0..1 morph progress
const FADE_FROM = 0.35;
const FADE_TO = 0.65;

// last project shown on the Featured laptop, so Cloud's laptop opens on the same one
export const laptopShared = { index: 0 };

/* ---------- 3x3 homography helpers (row-major) ---------- */
type M3 = number[];

// unit square (0,0)(1,0)(1,1)(0,1) -> quad
function squareToQuad(q: Quad): M3 {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const h = (dx1 * dy3 - dy1 * dx3) / den;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

function mul(a: M3, b: M3): M3 {
  const r: number[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    }
  }
  return r;
}

function inv(m: M3): M3 {
  const [a, b, c, d, e, f, g, h, i] = m;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [
    e * i - f * h, -(b * i - c * h), b * f - c * e,
    -(d * i - f * g), a * i - c * g, -(a * f - c * d),
    d * h - e * g, -(a * h - b * g), a * e - b * d,
  ].map((v) => v / det);
}

function toCss(m: M3): string {
  const k = m[8];
  const [a, b, c, d, e, f, g, h] = m.slice(0, 8).map((v) => v / k);
  return `matrix3d(${a},${d},0,${g},${b},${e},0,${h},0,0,1,0,${c},${f},0,1)`;
}

const scaleQuad = (q: Quad, sx: number, sy: number): Quad =>
  q.map(([x, y]) => [x * sx, y * sy] as const) as unknown as Quad;

const lerpQuad = (a: Quad, b: Quad, t: number): Quad =>
  a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t] as const) as unknown as Quad;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export interface LaptopParts {
  box: HTMLElement; // .fw-laptop-3d
  screen: HTMLElement; // .fw-screen
  sideArt: HTMLElement; // <img> laptopsvg.svg
  frontArt: HTMLElement; // <img> laptopfront.svg
}

/** t = 0 -> angled laptop, t = 1 -> front-facing laptop. */
export function renderLaptop(p: LaptopParts, t: number, mode: LaptopMode = LAPTOP_MODE) {
  const w = p.box.clientWidth;
  const h = p.box.clientHeight;
  if (!w || !h) return;

  const sx = w / LAPTOP_VIEWBOX.w;
  const sy = h / LAPTOP_VIEWBOX.h;
  const side = scaleQuad(SIDE_QUAD, sx, sy);
  const front = scaleQuad(FRONT_QUAD, sx, sy);
  const q = lerpQuad(side, front, t);

  // flat SRC_W x SRC_H surface -> current glass quad
  p.screen.style.transform = toCss(mul(squareToQuad(q), [1 / SRC_W, 0, 0, 0, 1 / SRC_H, 0, 0, 0, 1]));

  if (mode === 'morph') {
    // warp the angled artwork so its glass quad lands on q
    p.sideArt.style.transform = toCss(mul(squareToQuad(q), inv(squareToQuad(side))));
    p.sideArt.style.opacity = '1';
    p.frontArt.style.opacity = '0';
  } else {
    const k = clamp01((t - FADE_FROM) / (FADE_TO - FADE_FROM));
    p.sideArt.style.transform = '';
    p.sideArt.style.opacity = String(1 - k);
    p.frontArt.style.opacity = String(k);
  }
}

/** Layout position of el inside `ancestor`, ignoring any CSS/GSAP transforms. */
export function layoutBox(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== ancestor) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}