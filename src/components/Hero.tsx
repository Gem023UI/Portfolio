import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SkyBackground from './SkyBackground';
import Birds from './Birds';
import HeroMan from './HeroMan';
import ManBubble from './ManBubble';
import AskOverlay from './AskOverlay';
import { makeCloudSprites } from './CloudSprites';
import { SKY_THEMES } from './SkyShared';
import { SIGNATURE } from './SignaturePath';
import { useTheme, type ThemeMode } from './ThemeContext';
import { askDeveloper } from '../lib/askGroq';
import { AMBIENT_LINES, HOVER_PROMPTS } from '../lib/devProfile';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Layout (matches the reference picture):
//   HI! I'M JEMUEL MALAGA                       (centered, small)
//   DESIGN      | THE FEELING                   (left: accent, big / right: white, smaller)
//   ENGINEER    | THE EXPERIENCE .              (the man sits on the end of "EXPERIENCE")
//   FULL STACK DEVELOPER | PRODUCT DESIGN       (centered, small)
//
// Stacking plan (all siblings inside the hero's own stacking context):
//   0        sky shader
//   8        birds (far)
//   15-35    clouds  <- random z each, so each one lands behind/between/in front of the lines
//   20..26   title lines (DESIGN=20, ENGINEER=22, THE FEELING=24, THE EXPERIENCE=26)
//            the man lives inside THE EXPERIENCE -> shares its z-index
//   25       "Hi!" + tagline
//   45 / 55  birds (mid / near)
//   50       signature (scroll-written)
//   60       speech bubble
// ---------------------------------------------------------------------------

/** Scroll distance (in vh) the hero stays pinned while the signature is written, BEFORE the cloud surge. */
export const HERO_SIGNATURE_SCROLL_VH = 220;
/** The pen finishes at this fraction of the signature phase; the rest is a calm hold. */
const PEN_DONE_AT = 0.85;

const SHOW_DRIFT_CLOUDS = false;
const CLOUD_COUNT = SHOW_DRIFT_CLOUDS ? 9 : 0;

const ANSWER_HOLD_MS = 3000; // after typing finishes (typing budget is 5s => 8s max total)
const AMBIENT_HOLD_MS = 2800;

type BubbleKind = 'ambient' | 'hover' | 'answer';
interface BubbleState {
  key: number;
  kind: BubbleKind;
  text: string;
  typed: boolean;
  loading: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const randomCloudZ = () => 15 + 2 * Math.floor(Math.random() * 11);
const pickFrom = (list: string[], avoid: string) => {
  const pool = list.filter((l) => l !== avoid);
  return pool[Math.floor(Math.random() * pool.length)];
};

function cloudRgb(theme: ThemeMode): [number, number, number] {
  const { high, main } = SKY_THEMES[theme].tones;
  return [0, 1, 2].map((i) => Math.round((high[i] * 0.65 + main[i] * 0.35) * 255)) as [number, number, number];
}

export default function Hero() {
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLElement>(null);
  const cloudRefs = useRef<(HTMLDivElement | null)[]>([]);
  const manRef = useRef<HTMLButtonElement>(null);
  const sigRef = useRef<SVGSVGElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);

  // ---- clouds ----
  const sprites = useMemo(
    () => (SHOW_DRIFT_CLOUDS ? makeCloudSprites(cloudRgb(resolvedTheme)) : []),
    [resolvedTheme]
  );
  const spritesRef = useRef(sprites);
  spritesRef.current = sprites;

  const cloudCfg = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => ({
        sprite: i,
        width: rand(38, 80), // vw
        top: rand(-8, 82), // % of hero height
        opacity: rand(0.7, 0.95),
        z: randomCloudZ(),
      })),
    []
  );

  // ---- man / bubble / ask state ----
  const [bubble, setBubble] = useState<BubbleState | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [talking, setTalking] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const askOpenRef = useRef(false);
  askOpenRef.current = askOpen;
  const kindRef = useRef<BubbleKind | null>(null);
  const hoverRef = useRef(false);
  const hideTimer = useRef<number | undefined>(undefined);
  const keyRef = useRef(0);
  const askIdRef = useRef(0);
  const lastAmbient = useRef('');
  const lastHover = useRef('');

  const clearHide = useCallback(() => {
    if (hideTimer.current !== undefined) window.clearTimeout(hideTimer.current);
    hideTimer.current = undefined;
  }, []);

  const hide = useCallback(() => {
    clearHide();
    kindRef.current = null;
    setBubble(null);
    setTalking(false);
  }, [clearHide]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const man = manRef.current;
    if (!root || !man) return;
    const hr = root.getBoundingClientRect();
    const mr = man.getBoundingClientRect();
    const x = Math.min(Math.max(mr.left - hr.left + mr.width * 0.35, 272), hr.width - 8);
    const y = mr.top - hr.top + mr.height * 0.08;
    setPos((p) => (Math.abs(p.x - x) < 0.5 && Math.abs(p.y - y) < 0.5 ? p : { x, y }));
  }, []);

  const show = useCallback(
    (kind: BubbleKind, text: string, opts: { typed: boolean; loading?: boolean }) => {
      clearHide();
      measure();
      kindRef.current = kind;
      setBubble({ key: ++keyRef.current, kind, text, typed: opts.typed, loading: !!opts.loading });
      setTalking(opts.typed && !opts.loading);
    },
    [clearHide, measure]
  );

  const onTyped = useCallback(() => {
    setTalking(false);
    const kind = kindRef.current;
    if (!kind || kind === 'hover') return;
    hideTimer.current = window.setTimeout(hide, kind === 'answer' ? ANSWER_HOLD_MS : AMBIENT_HOLD_MS);
  }, [hide]);

  const onManEnter = () => {
    hoverRef.current = true;
    if (askOpenRef.current || kindRef.current === 'answer') return;
    const line = pickFrom(HOVER_PROMPTS, lastHover.current);
    lastHover.current = line;
    show('hover', line, { typed: false });
  };

  const onManLeave = () => {
    hoverRef.current = false;
    if (kindRef.current === 'hover') {
      clearHide();
      hideTimer.current = window.setTimeout(hide, 900);
    }
  };

  const openAsk = () => {
    askIdRef.current += 1; // cancels any answer still on its way
    hide();
    setAskOpen(true);
  };

  const handleAsk = useCallback(
    async (question: string) => {
      setAskOpen(false);
      const id = ++askIdRef.current;
      show('answer', '', { typed: false, loading: true });
      const answer = await askDeveloper(question);
      if (id !== askIdRef.current) return;
      show('answer', answer, { typed: true });
    },
    [show]
  );

  // random thoughts / facts every so often, only while nothing else is going on
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t = window.setTimeout(() => {
        if (!hoverRef.current && !kindRef.current && !askOpenRef.current && !document.hidden) {
          const line = pickFrom(AMBIENT_LINES, lastAmbient.current);
          lastAmbient.current = line;
          show('ambient', line, { typed: true });
        }
        loop();
      }, rand(7000, 13000));
    };
    t = window.setTimeout(loop, 4500);
    return () => window.clearTimeout(t);
  }, [show]);

  useEffect(() => {
    const onResize = () => {
      if (kindRef.current) measure();
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearHide();
    };
  }, [measure, clearHide]);

  // ---- intro + cloud drift (no parallax) ----
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      gsap.from('.hero__line-inner', {
        yPercent: 35,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.2,
      });
      gsap.from('.hero__hi', {
        opacity: 0,
        y: -16,
        duration: 1,
        ease: 'power3.out',
        delay: 0.7,
      });
      gsap.from('.hero__tagline-line', {
        opacity: 0,
        y: 24,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.9,
      });

      cloudRefs.current.forEach((wrap) => {
        if (!wrap) return;
        const img = wrap.querySelector('img');
        if (!img) return;

        if (reduce) {
          gsap.set(img, { x: rand(0, window.innerWidth * 0.6) });
          return;
        }

        const reroll = () => {
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
        drift.progress(Math.random());
      });
    }, root);

    return () => ctx.revert();
  }, [cloudCfg]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    interface Layer {
      el: HTMLElement;
      depth: number | (() => number);
      x: number;
      y: number;
    }
    const layers: Layer[] = [];
    const add = (el: Element | null | undefined, depth: number | (() => number)) => {
      if (el) layers.push({ el: el as HTMLElement, depth, x: 0, y: 0 });
    };

    add(root.querySelector('.hero__hi'), 0.35);
    add(root.querySelector('.hero__tagline'), 0.35);
    // DESIGN, ENGINEER, THE FEELING, THE EXPERIENCE (the man rides with his line)
    root.querySelectorAll('.hero__line').forEach((el, i) => add(el, [0.5, 0.6, 0.9, 1.0][i] ?? 0.7));
    // clouds: the lower their z (further back), the less they move
    cloudRefs.current.forEach((wrap) => {
      if (!wrap) return;
      add(wrap, () => 0.2 + (((parseInt(wrap.style.zIndex, 10) || 25) - 15) / 20) * 0.8);
    });

    const STRENGTH = 0.016; // max shift = this * viewport width, at depth 1
    const EASE = 0.08;
    let tx = 0;
    let ty = 0;
    let raf = 0;

    const tick = () => {
      const amp = window.innerWidth * STRENGTH;
      let moving = false;
      for (const l of layers) {
        const d = typeof l.depth === 'function' ? l.depth() : l.depth;
        const gx = -tx * amp * d; // layers drift opposite to the cursor
        const gy = -ty * amp * d * 0.7;
        l.x += (gx - l.x) * EASE;
        l.y += (gy - l.y) * EASE;
        if (Math.abs(gx - l.x) > 0.05 || Math.abs(gy - l.y) > 0.05) moving = true;
        l.el.style.translate = `${l.x.toFixed(2)}px ${l.y.toFixed(2)}px`;
      }
      if (kindRef.current) measure(); // keep the bubble glued to the man
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      layers.forEach((l) => {
        l.el.style.translate = '';
      });
    };
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    const svg = sigRef.current;
    const glass = glassRef.current;
    if (!root || !svg || !glass) return;
    const pen = svg.querySelector<SVGPathElement>('.sig-pen');
    if (!pen) return;
    const stage = (root.closest('.hero-stage') as HTMLElement | null) ?? root;

    let length = 0;

    // CSS can't mask with a live SVG <mask>, so the glass layer gets an SVG data-URI mask
    // (outline clipped by the dashed pen). Quantised to STEPS and cached to keep scrolling cheap.
    const STEPS = 240;
    const maskCache = new Map<number, string>();
    const maskFor = (step: number) => {
      let v = maskCache.get(step);
      if (!v) {
        const { width: W, height: H, penWidth, pen: penD, outline } = SIGNATURE;
        const dash = (step / STEPS) * length;
        const markup =
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' width='${W}' height='${H}'>` +
          `<defs><mask id='m' maskUnits='userSpaceOnUse' x='0' y='0' width='${W}' height='${H}'>` +
          `<path d='${penD}' fill='none' stroke='white' stroke-width='${penWidth}' stroke-linecap='round' stroke-linejoin='round' stroke-dasharray='${dash} ${length * 2}'/>` +
          `</mask></defs>` +
          `<path d='${outline}' fill-rule='evenodd' mask='url(#m)'/></svg>`;
        v = `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
        maskCache.set(step, v);
      }
      return v;
    };

    const draw = (q: number) => {
      if (!length) length = pen.getTotalLength();
      const clamped = Math.min(1, Math.max(0, q));
      const visible = clamped * length;
      if (visible < 0.5) {
        pen.style.visibility = 'hidden';
        glass.style.visibility = 'hidden';
        return;
      }
      pen.style.visibility = 'visible';
      pen.style.strokeDasharray = `${visible} ${length * 2}`;
      pen.style.strokeDashoffset = '0';

      const m = maskFor(Math.round(clamped * STEPS));
      glass.style.visibility = 'visible';
      glass.style.setProperty('mask-image', m);
      glass.style.setProperty('-webkit-mask-image', m);
    };
    const pos = { q: 0 };
    draw(0);

    const toQ = (progress: number) => Math.min(1, progress / PEN_DONE_AT);

    const st = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${Math.round((window.innerHeight * HERO_SIGNATURE_SCROLL_VH) / 100)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.to(pos, {
          q: toQ(self.progress),
          duration: 0.25,
          ease: 'power1.out',
          overwrite: true,
          onUpdate: () => draw(pos.q),
        });
      },
      onRefresh: (self) => {
        pos.q = toQ(self.progress);
        draw(pos.q);
      },
    });

    return () => {
      st.kill();
      gsap.killTweensOf(pos);
    };
  }, []);

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

      {/* Centered column: Hi / title / tagline.
          No z-index / transform / opacity on this wrapper, the h1 or the two columns: they must
          NOT form a stacking context, otherwise the clouds couldn't interleave with the lines. */}
      <div className="hero__center">
        <p className="hero__hi" aria-hidden="true">
          Hi! I’m Jemuel Malaga
        </p>

        <h1 className="hero__title" aria-label="Design Engineer. The feeling, the experience.">
          <span className="hero__col hero__col--l" aria-hidden="true">
            <span className="hero__line" style={{ zIndex: 20 }}>
              <span className="hero__line-inner">Design</span>
            </span>
            <span className="hero__line" style={{ zIndex: 22 }}>
              <span className="hero__line-inner">Engineer</span>
            </span>
          </span>

          <span className="hero__col hero__col--r" aria-hidden="true">
            <span className="hero__line" style={{ zIndex: 24 }}>
              <span className="hero__line-inner">The Feeling,</span>
            </span>
            <span className="hero__line hero__line--exp" style={{ zIndex: 26 }}>
              <span className="hero__line-inner">
                <span className="hero__exp">
                  The Experience.
                  <button
                    type="button"
                    ref={manRef}
                    className="hero__man"
                    aria-label="Ask me anything about Jemuel"
                    onPointerEnter={onManEnter}
                    onPointerLeave={onManLeave}
                    onFocus={onManEnter}
                    onBlur={onManLeave}
                    onClick={openAsk}
                  >
                    <HeroMan talking={talking} paused={askOpen} />
                  </button>
                </span>
              </span>
            </span>
          </span>
        </h1>

        <p className="hero__tagline hero__tagline-line">
          <span>Full Stack Developer</span>
          <span className="hero__tagline-sep" aria-hidden="true">
            |
          </span>
          <span>Brand & Product Design</span>
        </p>
      </div>

      <Birds layer="mid" />
      <Birds layer="front" />

      <div ref={glassRef} className="hero__signature-glass" aria-hidden="true" />

      {/* Signature, written on scroll before the exit transition */}
      <svg
        ref={sigRef}
        className="hero__signature"
        viewBox={`0 0 ${SIGNATURE.width} ${SIGNATURE.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <mask
            id="hero-signature-reveal"
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={SIGNATURE.width}
            height={SIGNATURE.height}
          >
            <path
              className="sig-pen"
              d={SIGNATURE.pen}
              fill="none"
              stroke="#ffffff"
              strokeWidth={SIGNATURE.penWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        <path
          className="hero__signature-ink"
          d={SIGNATURE.outline}
          fillRule="evenodd"
          mask="url(#hero-signature-reveal)"
        />
      </svg>

      {bubble && (
        <ManBubble
          key={bubble.key}
          text={bubble.text}
          typed={bubble.typed}
          loading={bubble.loading}
          x={pos.x}
          y={pos.y}
          onTyped={onTyped}
        />
      )}

      <AskOverlay open={askOpen} onClose={() => setAskOpen(false)} onSubmit={handleAsk} />
    </section>
  );
}