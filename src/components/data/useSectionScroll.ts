import { useEffect } from 'react';
import { gsap } from 'gsap';

interface Options {
  /** Max px a single wheel event may add (a flick fires dozens of events). */
  maxStep?: number;
  /** Burst allowance in px: the most a sudden flick can add at once. */
  burst?: number;
  /** Sustained speed cap in px/second, however hard or long the flick is. */
  maxSpeed?: number;
  /** 0..1 smoothing per 60fps frame. Lower = floatier. */
  ease?: number;
}

/**
 * Smooths wheel scrolling only while the viewport is inside [startSel top, endSel bottom]
 * (i.e. Featured Works -> Cloud Projects). Outside that range the page scrolls natively.
 * Input goes through a token bucket (`burst` px, refilled at `maxSpeed` px/s) and each
 * wheel event is clamped to `maxStep`, so a hard flick travels no further per second than
 * a steady scroll; the motion is then eased every frame.
 * Touch, keyboard and scrollbar drags stay native.
 */
export function useSectionScroll(
  startSel: string,
  endSel: string,
  { maxStep = 100, burst = 500, maxSpeed = 700, ease = 0.1 }: Options = {},
) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let busy = false;
    let current = 0;
    let target = 0;
    let tokens = burst;
    let lastT = performance.now();

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

    const range = () => {
      const a = document.querySelector<HTMLElement>(startSel);
      const b = document.querySelector<HTMLElement>(endSel);
      if (!a || !b) return null;
      const y = window.scrollY;
      return {
        min: a.getBoundingClientRect().top + y,
        max: b.getBoundingClientRect().bottom + y - window.innerHeight,
      };
    };

    const stop = () => {
      if (!busy) return;
      gsap.ticker.remove(tick);
      busy = false;
    };

    function tick(_time: number, dt: number) {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        current = target;
        window.scrollTo(0, current);
        stop();
        return;
      }
      current += diff * (1 - Math.pow(1 - ease, dt / 16.667));
      window.scrollTo(0, current);
    }

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom / sideways
      const r = range();
      if (!r) return;

      const y = window.scrollY;
      const raw = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!raw) return;

      // Take over only while there is still room to travel inside the range;
      // at either end the page scrolls on natively.
      const canDown = raw > 0 && y >= r.min - 0.5 && y < r.max - 0.5;
      const canUp = raw < 0 && y <= r.max + 0.5 && y > r.min + 0.5;
      if (!canDown && !canUp) return;

      e.preventDefault();

      if (!busy) {
        current = y;
        target = y;
        busy = true;
        gsap.ticker.add(tick);
      }

      const now = performance.now();
      tokens = Math.min(burst, tokens + ((now - lastT) / 1000) * maxSpeed);
      lastT = now;

      const step = Math.min(Math.abs(raw), maxStep, tokens);
      tokens -= step;
      target = clamp(target + Math.sign(raw) * step, r.min, r.max);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      stop();
    };
  }, [startSel, endSel, maxStep, burst, maxSpeed, ease]);
}