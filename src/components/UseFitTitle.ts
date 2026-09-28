import { useEffect, type RefObject } from 'react';

/**
 * Sizes a one-line title so its rendered width is exactly `vw` percent of the viewport width.
 * Font metrics differ between fonts, so this measures the text at a reference size and scales it,
 * re-fitting once the web font has loaded and whenever the window is resized.
 *
 * `fontSpec` is a CSS font shorthand at 100px used to wait for the font, e.g. '100px "Instrument Serif"'.
 * Measurement uses offsetWidth (layout width), which a GSAP scale transform does not affect.
 */
export function useFitTitle(ref: RefObject<HTMLElement | null>, vw: number, fontSpec: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    const fit = () => {
      if (cancelled) return;
      el.style.fontSize = '100px';
      const natural = el.offsetWidth;
      if (natural > 0) {
        el.style.fontSize = `${(100 * ((window.innerWidth * vw) / 100)) / natural}px`;
      }
    };

    fit();
    document.fonts?.load(fontSpec).then(fit).catch(() => undefined);
    document.fonts?.ready.then(fit).catch(() => undefined);
    window.addEventListener('resize', fit);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', fit);
    };
  }, [ref, vw, fontSpec]);
}