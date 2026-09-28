import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import Lanyard from './Lanyard';
import SkyBackground from './SkyBackground';
import Birds from './Birds';
import { makeCloudSprites } from './CloudSprites';
import { SKY_THEMES } from './SkyShared';
import { useTheme, type ThemeMode } from './ThemeContext';
import './Hero.css';

// ---------------------------------------------------------------------------
// Stacking plan (all siblings inside the hero's own stacking context):
//   0        sky shader
//   8        birds (far, behind everything)
//   15-35    clouds  <- random z each, so each one lands behind/between/in front of letters
//   20..30   letters (J=20, E=22, M=24, U=26, E=28, L=30)
//   40       tagline
//   45       birds (mid)
//   50       lanyard
//   55       birds (near, in front of the lanyard)
// A cloud re-rolls its z-index (plus size, height, sprite) every time it wraps around
// off-screen, so the letter/cloud overlap keeps shifting as the clouds drift.
// ---------------------------------------------------------------------------

const LETTERS = ['J', 'E', 'M', 'U', 'E', 'L'];
const LETTER_Z0 = 20;
const CLOUD_COUNT = 9;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
// odd numbers 15..35 => falls behind all letters, between them, or in front of all of them
const randomCloudZ = () => 15 + 2 * Math.floor(Math.random() * 11);

function cloudRgb(theme: ThemeMode): [number, number, number] {
  const { high, main } = SKY_THEMES[theme].tones;
  return [0, 1, 2].map((i) => Math.round((high[i] * 0.65 + main[i] * 0.35) * 255)) as [number, number, number];
}

export default function Hero() {
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cloudRefs = useRef<(HTMLDivElement | null)[]>([]);
  const taglineRef = useRef<HTMLDivElement>(null);

  const sprites = useMemo(() => makeCloudSprites(cloudRgb(resolvedTheme)), [resolvedTheme]);
  const spritesRef = useRef(sprites);
  spritesRef.current = sprites;

  // Fixed once per mount: each letter/cloud gets its own parallax rate.
  const letterCfg = useMemo(
    () => LETTERS.map(() => ({ rate: rand(0.25, 1), duration: rand(0.7, 1.5) })),
    []
  );
  const cloudCfg = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => ({
        sprite: i,
        width: rand(38, 80), // vw
        top: rand(-8, 82), // % of hero height
        opacity: rand(0.7, 0.95),
        duration: rand(70, 150), // seconds to cross the screen
        rate: rand(0.4, 1.6),
        z: randomCloudZ(),
      })),
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let removeListener: (() => void) | null = null;

    const ctx = gsap.context(() => {
      // ---- intro ----
      gsap.from('.hero__letter-inner', {
        yPercent: 35,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.09,
        delay: 0.2,
      });
      gsap.from('.hero__tagline-text', { opacity: 0, duration: 1.2, delay: 0.9, ease: 'power2.out' });

      // ---- cloud drift (left to right) ----
      cloudRefs.current.forEach((wrap) => {
        if (!wrap) return;
        const img = wrap.querySelector('img');
        if (!img) return;

        if (reduce) {
          gsap.set(img, { x: rand(0, window.innerWidth * 0.6) });
          return;
        }

        const reroll = () => {
          // invisible: the cloud is fully off-screen when it wraps
          wrap.style.zIndex = String(randomCloudZ());
          wrap.style.top = `${rand(-8, 82)}%`;
          img.style.width = `${rand(38, 80)}vw`;
          const list = spritesRef.current;
          if (list.length) img.src = list[Math.floor(Math.random() * list.length)];
        };

        const drift = gsap.fromTo(
          img,
          { x: () => -window.innerWidth * 0.9 - 120 },
          {
            x: () => window.innerWidth + 120,
            duration: rand(70, 150),
            ease: 'none',
            repeat: -1,
            repeatRefresh: true,
            onRepeat: reroll,
          }
        );
        drift.progress(Math.random()); // start clouds scattered across the screen
      });

      // ---- cursor parallax: everything moves AWAY from the cursor, each at its own rate ----
      if (!reduce) {
        type Item = { qx: (v: number) => void; qy: (v: number) => void; ax: number; ay: number };
        const items: Item[] = [];
        const add = (el: Element | null, rate: number, duration: number, amp: number) => {
          if (!el) return;
          items.push({
            qx: gsap.quickTo(el, 'x', { duration, ease: 'power3.out' }),
            qy: gsap.quickTo(el, 'y', { duration, ease: 'power3.out' }),
            ax: amp * rate,
            ay: amp * rate * 0.55,
          });
        };
        letterRefs.current.forEach((el, i) => add(el, letterCfg[i].rate, letterCfg[i].duration, 70));
        cloudRefs.current.forEach((el, i) => add(el, cloudCfg[i].rate, rand(1, 2), 170));
        add(taglineRef.current, 0.5, 1.1, 40);

        const onMove = (e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth) * 2 - 1;
          const ny = (e.clientY / window.innerHeight) * 2 - 1;
          items.forEach((it) => {
            it.qx(-nx * it.ax);
            it.qy(-ny * it.ay);
          });
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        removeListener = () => window.removeEventListener('pointermove', onMove);
      }
    }, root);

    return () => {
      removeListener?.();
      ctx.revert();
    };
  }, [letterCfg, cloudCfg]);

  return (
    <section className="hero" ref={rootRef} aria-label="Introduction">
      <SkyBackground
        className="hero__sky"
        style={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: 'auto' }}
      />

      <Birds layer="back" />

      {cloudCfg.map((c, i) => (
        <div
          key={i}
          className="hero__cloud"
          ref={(el) => {
            cloudRefs.current[i] = el;
          }}
          style={{ top: `${c.top}%`, zIndex: c.z }}
        >
          <img
            src={sprites[c.sprite % Math.max(1, sprites.length)]}
            alt=""
            draggable={false}
            style={{ width: `${c.width}vw`, opacity: c.opacity }}
          />
        </div>
      ))}

      {/* No z-index / transform / opacity on this element: it must NOT form a stacking
          context, otherwise the clouds couldn't interleave with individual letters. */}
      <h1 className="hero__letters" aria-label="Jemuel">
        {LETTERS.map((ch, i) => (
          <span
            key={i}
            className="hero__letter"
            aria-hidden="true"
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            style={{ zIndex: LETTER_Z0 + i * 2 }}
          >
            <span className="hero__letter-inner">{ch}</span>
          </span>
        ))}
      </h1>

      <div className="hero__tagline" ref={taglineRef}>
        <p className="hero__tagline-text">
          <span>FULL STACK DEVELOPER</span>
          <span className="hero__tagline-sep" aria-hidden="true">
            |
          </span>
          <span>PRODUCT DESIGN</span>
        </p>
      </div>

      <Birds layer="mid" />

      <div className="hero__lanyard">
        <Lanyard />
      </div>

      <Birds layer="front" />
    </section>
  );
}