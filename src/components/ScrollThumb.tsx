import { useEffect, useRef } from 'react';
import './ScrollThumb.css';

// A scrollbar with no track: just a pill that moves with the page. The native scrollbar is hidden in
// index.css; this one is drawn on top, so it takes no layout width and has no gutter. Its colour comes
// from the theme (var(--ink) in index.css), so it changes with morning / sunset / night.

const MARGIN = 6; // px kept free above and below the pill's travel
const MIN_HEIGHT = 44; // px

export default function ScrollThumb() {
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb) return;

    let raf = 0;
    let dragging = false;
    let dragStartY = 0;
    let dragStartScroll = 0;

    const metrics = () => {
      const vh = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const max = Math.max(0, total - vh);
      const h = Math.max(MIN_HEIGHT, (vh / Math.max(total, 1)) * vh);
      const travel = Math.max(1, vh - h - MARGIN * 2);
      return { max, h, travel };
    };

    const update = () => {
      raf = 0;
      const { max, h, travel } = metrics();
      if (max <= 0) {
        thumb.style.opacity = '0'; // nothing to scroll: no pill at all
        return;
      }
      const y = MARGIN + (Math.min(max, Math.max(0, window.scrollY)) / max) * travel;
      thumb.style.height = `${h}px`;
      thumb.style.transform = `translate3d(0, ${y}px, 0)`;
      thumb.style.opacity = '';
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragStartY = e.clientY;
      dragStartScroll = window.scrollY;
      thumb.setPointerCapture(e.pointerId);
      thumb.classList.add('scroll-thumb--drag');
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const { max, travel } = metrics();
      window.scrollTo(0, dragStartScroll + ((e.clientY - dragStartY) / travel) * max);
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
      thumb.classList.remove('scroll-thumb--drag');
    };

    thumb.addEventListener('pointerdown', onPointerDown);
    thumb.addEventListener('pointermove', onPointerMove);
    thumb.addEventListener('pointerup', onPointerUp);
    thumb.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // page height changes (fonts, ScrollTrigger spacers, ...) without any scroll event
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    ro?.observe(document.documentElement);
    ro?.observe(document.body);
    update();

    return () => {
      cancelAnimationFrame(raf);
      thumb.removeEventListener('pointerdown', onPointerDown);
      thumb.removeEventListener('pointermove', onPointerMove);
      thumb.removeEventListener('pointerup', onPointerUp);
      thumb.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
    };
  }, []);

  return <div className="scroll-thumb" ref={thumbRef} aria-hidden="true" />;
}