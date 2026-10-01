import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import SkyBackground from './SkyBackground';
import Birds from './Birds';
import HeroMan from './HeroMan';
import ManBubble from './ManBubble';
import AskOverlay from './AskOverlay';
import { makeCloudSprites } from './CloudSprites';
import { SKY_THEMES } from './SkyShared';
import { useTheme, type ThemeMode } from './ThemeContext';
import { askDeveloper } from '../lib/askGroq';
import { AMBIENT_LINES, HOVER_PROMPTS } from '../lib/devProfile';
import './Hero.css';

// ---------------------------------------------------------------------------
// Stacking plan (all siblings inside the hero's own stacking context):
//   0        sky shader
//   8        birds (far, behind everything)
//   15-35    clouds  <- random z each, so each one lands behind/between/in front of letters
//   20..30   letters (J=20, E=22, M=24, U=26, E=28, L=30)
//            "Hi, I'm" lives inside J, the man lives inside M -> they share those z-indexes
//   25       tagline (clouds can pass in front of / behind it too)
//   45       birds (mid)
//   55       birds (near)
//   60       speech bubble
// ---------------------------------------------------------------------------

const LETTERS = ['J', 'E', 'M', 'U', 'E', 'L'];
const LETTER_Z0 = 20;
const MAN_INDEX = 2; // the M
const HI_INDEX = 0; // the J

const SHOW_DRIFT_CLOUDS = false;
const CLOUD_COUNT = SHOW_DRIFT_CLOUDS ? 9 : 0;

const ANSWER_HOLD_MS = 3000; // after typing finishes (typing budget is 5s => 8s max total)
const AMBIENT_HOLD_MS = 2800;
const ACCENT_DARKEN = 0.7; // 1 = the raw palette tone, lower = deeper (more contrast on the sky)

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

  // tagline highlight = the theme's darkest sky tone
  const accent = useMemo(() => {
    const [r, g, b] = SKY_THEMES[resolvedTheme].tones.low.map((v) => Math.round(v * 255 * ACCENT_DARKEN));
    return `rgb(${r}, ${g}, ${b})`;
  }, [resolvedTheme]);

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
    const x = Math.max(8, Math.min(mr.left - hr.left + mr.width * 0.62, hr.width - 280));
    const y = mr.top - hr.top + mr.height * 0.08;
    setPos({ x, y });
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
      gsap.from('.hero__letter-inner', {
        yPercent: 35,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.09,
        delay: 0.2,
      });
      gsap.from('.hero__tagline-line', {
        opacity: 0,
        y: 24,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.18,
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

  return (
    <section
      className="hero"
      ref={rootRef}
      aria-label="Introduction"
      style={{ '--hero-accent': accent } as CSSProperties}
    >
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
          <span key={i} className="hero__letter" style={{ zIndex: LETTER_Z0 + i * 2 }}>
            <span className="hero__letter-inner">
              <span aria-hidden="true">{ch}</span>

              {i === HI_INDEX && (
                <span className="hero__hi" aria-hidden="true">
                  <span className="hero__hi-text">Hi, I’m</span>
                </span>
              )}

              {i === MAN_INDEX && (
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
              )}
            </span>
          </span>
        ))}
      </h1>

      <div className="hero__tagline">
        <p className="hero__tagline-line">
          <em className="hero__tagline-em">Design</em> the feeling.
        </p>
        <p className="hero__tagline-line">
          <em className="hero__tagline-em">Engineer</em> the function.
        </p>
      </div>

      <Birds layer="mid" />
      <Birds layer="front" />

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