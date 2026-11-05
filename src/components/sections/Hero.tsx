import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lanyard from '../Lanyard';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

/* Kept so other sections that read these keep working */
export const HERO_SIGNATURE_SCROLL_VH = 220;
export const HERO_EXIT_SCROLL_VH = 100;

/* ---- Tuning knobs ---- */
/** Delay (ms) between the text blocks finishing their entrance and the lanyard appearing. */
export const LANYARD_DELAY_MS = 400;
/** Duration (s) of the text blocks' entrance. */
const TEXT_ENTRANCE_S = 1.6;
/** Paste the card images here (leave '' for a plain white card). */
/** Paste the card images here (leave '' for a plain white card). */
const LANYARD_FRONT_IMAGE = '';
const LANYARD_BACK_IMAGE = '';
const LANYARD_STRAP_IMAGE = '';

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const [showLanyard, setShowLanyard] = useState(false);

  /* Entrance: text blocks slide in together, then the lanyard after LANYARD_DELAY_MS */
  useLayoutEffect(() => {
    const design = designRef.current;
    const cloud = cloudRef.current;
    if (!design || !cloud) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer: number | undefined;

    if (reduce) {
      setShowLanyard(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          timer = window.setTimeout(() => setShowLanyard(true), LANYARD_DELAY_MS);
        },
      });
      tl.from(design, {
        x: () => -window.innerWidth,
        duration: TEXT_ENTRANCE_S,
        ease: 'power3.out',
      }).from(
        cloud,
        {
          x: () => window.innerWidth,
          duration: TEXT_ENTRANCE_S,
          ease: 'power3.out',
        },
        0
      );
    }, rootRef);

    return () => {
      window.clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  /* Hero content scrolls away after the hold period */
  useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const stage = (root.closest('.hero-stage') as HTMLElement | null) ?? root;
    const tween = gsap.to(content, {
      y: () => -window.innerHeight,
      ease: 'none',
      scrollTrigger: {
        trigger: stage,
        start: () => `top+=${Math.round((window.innerHeight * HERO_SIGNATURE_SCROLL_VH) / 100)} top`,
        end: () => `+=${Math.round((window.innerHeight * HERO_EXIT_SCROLL_VH) / 100)}`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(content, { clearProps: 'transform' });
    };
  }, []);

  return (
    <section className="hero" ref={rootRef} aria-label="Introduction">
      <div className="hero__content" ref={contentRef}>
        <h1 className="visually-hidden" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          UI/UX Design. Cloud Engineer.
        </h1>

        <div className="hero__frame" aria-hidden="true">
          <div className="hero__design" ref={designRef}>
            <p className="hero__uiux">UI/UX</p>
            <p className="hero__design-word">DESIGN</p>
          </div>

          <div className="hero__cloud-block" ref={cloudRef}>
            <p className="hero__cloud-word">CLOUD</p>
            <p className="hero__engineer">ENGINEER</p>
          </div>
        </div>

        <div className={`hero__lanyard${showLanyard ? ' is-visible' : ''}`}>
          {showLanyard && (
            <Lanyard
              frontImage={LANYARD_FRONT_IMAGE || undefined}
              backImage={LANYARD_BACK_IMAGE || undefined}
              strapImage={LANYARD_STRAP_IMAGE || undefined}
              imageFit="cover"
              cardColor="#ffffff"
              orientation="portrait"
              finish="glossy"
              cornerRadius={0.3}
              size={0.54}
              anchor="center"
              strapLength={0.4}
              strapColor="#111111"
              strapWidth={0.65}
              metal="silver"
              gravity={1}
              damping={0.5}
              elasticity={0.5}
              breeze={0.5}
              interactive
              intro
            />
          )}
        </div>
      </div>
    </section>
  );
}