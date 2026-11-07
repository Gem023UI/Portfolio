import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lanyard from '../Lanyard';
import './Hero.css';

gsap.registerPlugin(ScrollTrigger);

export const LANYARD_DELAY_MS = 500;
const TEXT_ENTRANCE_S = 2;
const ASSET_ENTRANCE_S = 4;

// Parallax: upward travel per element, as a fraction of one viewport height,
// scrubbed over the first viewport of scroll. Larger = nearer layer.
const PARALLAX: { selector: string; rate: number }[] = [
  { selector: '.hero__design', rate: 0.08 },
  { selector: '.hero__cloud-block', rate: 0.15 },
  { selector: 'img.hero__laptop', rate: 0.3 },
  { selector: 'img.hero__coffee', rate: 0.45 },
  { selector: 'img.hero__notebook', rate: 0.2 },
  { selector: '.hero__lanyard', rate: 0.75 },
];

const LANYARD_FRONT_IMAGE = '/coloredID.jpg';
const LANYARD_BACK_IMAGE = '';
const LANYARD_STRAP_IMAGE = '';

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const designRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const coffeeRef = useRef<HTMLDivElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);
  const [showLanyard, setShowLanyard] = useState(false);

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

  useLayoutEffect(() => {
    const laptop = laptopRef.current;
    const coffee = coffeeRef.current;
    const notebook = notebookRef.current;
    if (!laptop || !coffee) return;

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
      tl.from(laptop, {
        x: () => -window.innerWidth,
        duration: ASSET_ENTRANCE_S,
        ease: 'power3.out',
      }).from(
        coffee,
        {
          x: () => window.innerWidth,
          duration: ASSET_ENTRANCE_S,
          ease: 'power3.out',
        },
        0
      ).from(
        notebook,
        {
          y: () => window.innerHeight,
          duration: ASSET_ENTRANCE_S,
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

  // Scroll parallax. Uses `y` only (entrances use `x`, and the notebook's
  // entrance `y` lives on its wrapper while this targets the inner <img>),
  // so it never fights the entrance tweens.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          trigger: root.parentElement ?? root,
          start: 'top top',
          end: () => `+=${window.innerHeight}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      PARALLAX.forEach(({ selector, rate }) => {
        const el = root.querySelector(selector);
        if (el) tl.to(el, { y: () => -rate * window.innerHeight }, 0);
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" ref={rootRef} aria-label="Introduction">
      <div className="hero__content" ref={contentRef}>
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

        <div className="hero__laptop" ref={laptopRef}>
          <img src="/laptop.png" alt="Laptop" className="hero__laptop" />
        </div>
        <div className="hero__coffee" ref={coffeeRef}>
          <img src="/coffee.png" alt="Coffee" className="hero__coffee" />
        </div>
        <div className="hero__notebook" ref={notebookRef}>
          <img src="/notebook.png" alt="Notebook" className="hero__notebook" />
        </div>

        <div className={`hero__lanyard${showLanyard ? ' is-visible' : ''}`}>
          {showLanyard && (
            <Lanyard
              frontImage={LANYARD_FRONT_IMAGE || undefined}
              backImage={LANYARD_BACK_IMAGE || undefined}
              strapImage={LANYARD_STRAP_IMAGE || undefined}
              imageFit="cover"
              cardColor="#323232"
              orientation="portrait"
              finish="metallic"
              cornerRadius={0.3}
              size={0.5}
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