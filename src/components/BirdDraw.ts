// Pure canvas-2D bird renderer (no assets). A bird is modelled in tiny 3D:
// a body along +x, and two wings that each have an arm segment and a hand segment
// flapping at different phases (the hand lags the arm), with separated primary
// feathers at the tip. Points are projected orthographically from a camera that is
// rotated (yaw) and raised (elevation) so both wings read as a real three-quarter view.
//
// Units: body length = 1. The caller scales by the bird's pixel length L and
// translates/rotates the canvas so the bird faces +x (screen right).

type P2 = [number, number];
type P3 = [number, number, number];

const YAW = 0.3; // ~17deg: how far the camera is rotated around the bird
const ELEV = -0.42; // camera sits BELOW the bird (a viewer on the ground looking up), so the near wing rises on screen
const CY = Math.cos(YAW);
const SY = Math.sin(YAW);
const CE = Math.cos(ELEV);
const SE = Math.sin(ELEV);

function proj(x: number, y: number, z: number): P2 {
  const x1 = x * CY + z * SY;
  const z1 = -x * SY + z * CY;
  const y1 = y * CE - z1 * SE;
  return [x1, -y1];
}

/**
 * Flap waveform with a faster downstroke than upstroke.
 * (Peak at ~111deg, trough at ~249deg => 2.4 rad down vs 3.9 rad up.)
 */
export function flapWave(p: number): number {
  return Math.sin(p) - 0.25 * Math.sin(2 * p);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function drawWing(ctx: CanvasRenderingContext2D, side: 1 | -1, phase: number, amp: number) {
  const w1 = flapWave(phase); // arm
  const w2 = flapWave(phase - 0.75); // hand lags the arm

  const base = 0.1; // resting dihedral (radians above horizontal)
  const th1 = base + 0.62 * amp * w1;
  const th2 = base * 0.5 + 0.98 * amp * w2;
  // hand folds in slightly while it is raised
  const fold = 1 - 0.26 * amp * clamp01((w2 + 0.25) / 1.25);
  const handLen = 0.5 * fold;

  const sh: P3 = [0.08, 0.02, 0];
  const armLen = 0.34;
  const wr: P3 = [sh[0] - 0.03, sh[1] + armLen * Math.sin(th1), side * armLen * Math.cos(th1)];

  // hand direction, swept back a little
  let hx = -0.3;
  let hy = Math.sin(th2);
  let hz = side * Math.cos(th2);
  const hl = Math.hypot(hx, hy, hz);
  hx /= hl;
  hy /= hl;
  hz /= hl;
  const tip: P3 = [wr[0] + hx * handLen, wr[1] + hy * handLen, wr[2] + hz * handLen];

  const add = (p: P3, dx: number, dy = 0, dz = 0): P3 => [p[0] + dx, p[1] + dy, p[2] + dz];
  const mix3 = (a: P3, b: P3, t: number): P3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const P = (p: P3): P2 => proj(p[0], p[1], p[2]);

  // leading edge
  const lead0 = add(sh, 0.13);
  const lead1 = add(wr, 0.09);
  const lead2 = add(tip, 0.03);
  // trailing anchor points
  const trailShoulder = add(sh, -0.2, -0.02);
  const trailWrist = add(wr, -0.21);

  ctx.beginPath();
  const a = P(lead0);
  ctx.moveTo(a[0], a[1]);
  const c1 = P(lead1);
  const e1 = P(lead2);
  ctx.quadraticCurveTo(c1[0], c1[1], e1[0], e1[1]);

  // primary feathers: fingers from the tip back toward the wrist
  const us = [1, 0.78, 0.56, 0.34, 0.12];
  const tips: P3[] = us.map((u) => {
    const b = mix3(trailWrist, tip, u);
    return add(b, -0.13 * (1 - u) - 0.05, -0.02 - 0.03 * (1 - u));
  });
  for (let i = 0; i < tips.length; i++) {
    const ft = P(tips[i]);
    let end: P2;
    if (i < tips.length - 1) {
      const n = mix3(tips[i], tips[i + 1], 0.5);
      end = P(add(n, 0.035));
    } else {
      end = P(trailWrist);
    }
    // control point at the fingertip => each primary becomes a soft, pointed tooth
    ctx.quadraticCurveTo(ft[0], ft[1], end[0], end[1]);
  }
  // secondaries: gentle scallops back to the body
  const sMid = P(add(mix3(trailWrist, trailShoulder, 0.5), -0.01, -0.03));
  const ts = P(trailShoulder);
  ctx.quadraticCurveTo(sMid[0], sMid[1], ts[0], ts[1]);
  ctx.closePath();
  ctx.fill();
}

function drawBody(ctx: CanvasRenderingContext2D, phase: number, amp: number) {
  const w1 = flapWave(phase);
  const P = (x: number, y: number): P2 => proj(x, y, 0);

  // tail: a 3D fan (spread in z) so it reads as a fan from the raised camera
  const tilt = 0.035 * amp * w1;
  const tb0 = proj(-0.22, 0.02, -0.03);
  const tb1 = proj(-0.22, 0.02, 0.03);
  const tl = proj(-0.52, 0.02 + tilt, -0.11);
  const tr = proj(-0.52, 0.02 + tilt, 0.11);
  const tm = proj(-0.6, 0.02 + tilt, 0);
  ctx.beginPath();
  ctx.moveTo(tb0[0], tb0[1]);
  ctx.lineTo(tl[0], tl[1]);
  ctx.quadraticCurveTo(tm[0], tm[1], tr[0], tr[1]);
  ctx.lineTo(tb1[0], tb1[1]);
  ctx.closePath();
  ctx.fill();

  // torso + neck
  const p = (x: number, y: number) => P(x, y);
  ctx.beginPath();
  let q = p(0.44, 0.105);
  ctx.moveTo(q[0], q[1]);
  let c = p(0.2, 0.135);
  q = p(-0.02, 0.1);
  ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  c = p(-0.18, 0.07);
  q = p(-0.27, 0.025);
  ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  c = p(-0.2, -0.04);
  q = p(-0.05, -0.1);
  ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  c = p(0.22, -0.14);
  q = p(0.42, -0.05);
  ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  c = p(0.48, -0.01);
  q = p(0.47, 0.03);
  ctx.quadraticCurveTo(c[0], c[1], q[0], q[1]);
  ctx.closePath();
  ctx.fill();

  // head
  const h = P(0.5, 0.085);
  ctx.beginPath();
  ctx.ellipse(h[0], h[1], 0.06 * CY + 0.02, 0.052, 0, 0, Math.PI * 2);
  ctx.fill();

  // beak
  const b0 = P(0.545, 0.1);
  const b1 = P(0.66, 0.06);
  const b2 = P(0.545, 0.055);
  ctx.beginPath();
  ctx.moveTo(b0[0], b0[1]);
  ctx.lineTo(b1[0], b1[1]);
  ctx.lineTo(b2[0], b2[1]);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draws one bird facing +x at the current transform origin.
 * @param L     body length in pixels
 * @param phase flap phase in radians (advance with time * flap frequency)
 * @param amp   flap amplitude 0..1 (low = gliding)
 * @param color solid fill colour (use opaque colours so overlapping parts don't darken)
 */
export function drawBird(ctx: CanvasRenderingContext2D, L: number, phase: number, amp: number, color: string) {
  ctx.save();
  ctx.scale(L, L);
  ctx.fillStyle = color;
  // the whole bird bobs a little: it lifts on the downstroke
  const bob = -0.03 * amp * flapWave(phase - Math.PI / 2);
  ctx.translate(0, bob);
  drawWing(ctx, -1, phase, amp); // far wing first
  drawBody(ctx, phase, amp);
  drawWing(ctx, 1, phase, amp); // near wing on top
  ctx.restore();
}