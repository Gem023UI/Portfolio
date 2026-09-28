import { useEffect, useRef } from 'react';
import { useTheme, type ThemeMode } from './ThemeContext';
import { SKY_THEMES } from './SkyShared';
import { drawBird } from './BirdDraw';

// A small flock that crosses the hero diagonally, left to right. Render <Birds layer="..." />
// once per depth layer; each instance only draws the birds tagged with its layer, so the
// hero can put different birds behind the letters, between letters and lanyard, and in
// front of the lanyard (each with its own z-index).

export type BirdLayer = 'back' | 'mid' | 'front';

interface BirdSpec {
  layer: BirdLayer;
  sizeVw: number; // body length as a % of viewport width
  from: [number, number]; // start (x, y) as fractions of the canvas, x < 0 => off-screen left
  to: [number, number]; // end (x, y), x > 1 => off-screen right
  duration: number; // seconds to cross
  delay: number; // seconds before the first flight
  flapHz: number;
  phase: number;
  haze: number; // 0 = full dark silhouette (near), up to ~0.5 = washed toward the sky (far)
  wobble: number; // vertical wander, fraction of height
}

// Edit this list to change the flock (count, sizes, paths, timing).
const FLOCK: BirdSpec[] = [
  { layer: 'back', sizeVw: 3.0, from: [-0.1, 0.6], to: [1.1, 0.3], duration: 12, delay: 2.4, flapHz: 3.4, phase: 0.4, haze: 0.5, wobble: 0.012 },
  { layer: 'mid', sizeVw: 5.0, from: [-0.12, 0.8], to: [1.12, 0.38], duration: 9, delay: 3.2, flapHz: 2.6, phase: 1.9, haze: 0.2, wobble: 0.018 },
  { layer: 'mid', sizeVw: 4.4, from: [-0.16, 0.9], to: [1.1, 0.5], duration: 9.6, delay: 3.9, flapHz: 2.9, phase: 3.3, haze: 0.28, wobble: 0.015 },
  { layer: 'front', sizeVw: 7.2, from: [-0.14, 0.58], to: [1.14, 0.16], duration: 7.4, delay: 4.6, flapHz: 2.2, phase: 5.0, haze: 0, wobble: 0.02 },
];

const BIRD_INK: Record<ThemeMode, string> = {
  morning: '#16233b',
  sunset: '#3a1d1a',
  night: '#080c1a',
};

const LAYER_Z: Record<BirdLayer, number> = { back: 8, mid: 45, front: 55 };

const REPEAT_MIN = 16; // seconds of rest between a bird's flights
const REPEAT_MAX = 30;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

interface BirdsProps {
  layer: BirdLayer;
  paused?: boolean;
}

export default function Birds({ layer, paused = false }: BirdsProps) {
  const { resolvedTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(resolvedTheme);
  const pausedRef = useRef(paused);
  themeRef.current = resolvedTheme;
  pausedRef.current = paused;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const birds = FLOCK.filter((b) => b.layer === layer);
    let W = 0;
    let H = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const t0 = performance.now();
    // per-bird schedule: when the current flight started, and a fresh random path tweak each time
    const state = birds.map((b) => ({
      start: t0 + b.delay * 1000,
      dy: 0, // vertical offset re-rolled per flight so repeats don't look identical
    }));

    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (pausedRef.current) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const ink = hexToRgb(BIRD_INK[themeRef.current]);
      const skyMain = SKY_THEMES[themeRef.current].tones.main.map((v) => Math.round(v * 255)) as [number, number, number];
      const seconds = now / 1000;

      birds.forEach((b, i) => {
        const s = state[i];
        let u = (now - s.start) / (b.duration * 1000);
        if (u < 0) return;
        if (u > 1) {
          s.start = now + (REPEAT_MIN + Math.random() * (REPEAT_MAX - REPEAT_MIN)) * 1000;
          s.dy = (Math.random() - 0.5) * 0.12;
          return;
        }

        const pos = (uu: number): [number, number] => {
          const x = (b.from[0] + (b.to[0] - b.from[0]) * uu) * W;
          const y =
            (b.from[1] + s.dy + (b.to[1] - b.from[1]) * uu + Math.sin(uu * Math.PI * 3 + b.phase) * b.wobble) * H;
          return [x, y];
        };

        const [x, y] = pos(u);
        const [x2, y2] = pos(Math.min(1, u + 0.01));
        // heading follows the path, softened so the bird doesn't look like it's pitching hard
        const heading = Math.atan2(y2 - y, x2 - x) * 0.8;

        // flap: continuous phase, plus a slow envelope that lets the bird glide now and then
        const glidePulse = 0.5 + 0.5 * Math.sin((seconds / 3.6) * Math.PI * 2 + b.phase * 3);
        const amp = 0.28 + 0.72 * smooth(Math.min(1, glidePulse * 1.5));
        const flapPhase = b.phase + seconds * b.flapHz * Math.PI * 2;

        const L = (b.sizeVw / 100) * window.innerWidth;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(heading);
        drawBird(ctx, L, flapPhase, amp, mixColor(ink, skyMain, b.haze));
        ctx.restore();
      });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [layer]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: LAYER_Z[layer],
      }}
    />
  );
}