import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TiltedCard from './TiltedCard';
import { HERO_SIGNATURE_SCROLL_VH, HERO_EXIT_SCROLL_VH } from './Hero';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.25;
const CARD_SHIFT_VW = 25; // card box is the right half, so centre -> right-half centre = 25vw

const PIN_VH = 250; // how long the About stage stays pinned
const ABOUT_GAP_VH = 80; // empty sky after the hero is gone, before ABOUT rises in

// Space above the pinned stage
const LEAD_VH = HERO_SIGNATURE_SCROLL_VH + HERO_EXIT_SCROLL_VH + ABOUT_GAP_VH;

export default function About() {
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLParagraphElement>(null);
  const p2Ref = useRef<HTMLParagraphElement>(null);
  const [cardOn, setCardOn] = useState(false);

  // Only mount the card while About is on (or near) the screen
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCardOn(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setCardOn(entry.isIntersecting), {
      rootMargin: '150% 0px 150% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fit the ABOUT word to exactly 80vw of width (font metrics differ, so measure instead of guessing).
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      el.style.fontSize = '100px';
      const natural = el.offsetWidth; // layout width: not affected by the GSAP scale transform
      if (natural > 0) {
        el.style.fontSize = `${(100 * ((window.innerWidth * TITLE_SETTLED_VW) / 100)) / natural}px`;
      }
    };
    fit();
    document.fonts?.load('100px Anton').then(fit).catch(() => undefined);
    document.fonts?.ready.then(fit).catch(() => undefined);
    window.addEventListener('resize', fit);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', fit);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const title = titleRef.current;
    const card = cardRef.current;
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;
    if (!track || !title || !card || !p1 || !p2) return;

    const ctx = gsap.context(() => {
      const narrow = () => window.matchMedia('(max-width: 700px)').matches;

      // Timeline units are vh of scroll: duration 50 == 50vh of scrolling.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: () => `+=${Math.round((window.innerHeight * PIN_VH) / 100)}`,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      // 1. ABOUT settles, 2. then white -> white @ 25%
      tl.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 1 },
        { scale: 1, opacity: 1, duration: 50 },
        0
      );
      tl.to(title, { opacity: TITLE_SETTLED_OPACITY, duration: 30 }, 50);

      // 3. card appears in the middle
      tl.fromTo(
        card,
        { autoAlpha: 0, y: () => -window.innerHeight * 0.12 },
        { autoAlpha: 1, y: 0, duration: 30 },
        80
      );

      // 4. card drifts right and settles; paragraphs fade upward on the left meanwhile
      tl.fromTo(
        card,
        { x: () => (narrow() ? 0 : -(window.innerWidth * CARD_SHIFT_VW) / 100) },
        { x: 0, duration: 80, ease: 'power1.inOut' },
        110
      );
      tl.fromTo(
        p1,
        { autoAlpha: 0, y: () => window.innerHeight * 0.08 },
        { autoAlpha: 1, y: 0, duration: 35 },
        120
      );
      tl.fromTo(
        p2,
        { autoAlpha: 0, y: () => window.innerHeight * 0.08 },
        { autoAlpha: 1, y: 0, duration: 35 },
        155
      );

      // pad the timeline to the full pin length so 1 unit == 1vh of scroll
      tl.set({}, {}, PIN_VH);
    }, track.parentElement ?? track);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" aria-label="About">
      {/* Space while the Hero writes its signature, scrolls away, and the sky rests */}
      <div className="about__lead" style={{ height: `${LEAD_VH}vh` }} aria-hidden="true" />

      {/* id lives here so "#about" lands on the settled start of About, not mid-signature */}
      <div className="about__track" id="about" ref={trackRef} style={{ height: `${PIN_VH + 100}vh` }}>
        <div className="about__stage">
          <div className="about__title-wrap" aria-hidden="true">
            <div className="about__title" ref={titleRef}>
              ABOUT
            </div>
          </div>

          {/* Image comes from TILTED_CARD_IMAGES in TiltedCard.tsx (per global theme).
              Size comes from --card-size (About.css); the fallback keeps it correct without it. */}
          <div className="about__card" ref={cardRef}>
            {cardOn && (
              <TiltedCard
                altText="Jemuel Malaga"
                captionText="Jemuel Malaga"
                containerHeight="var(--card-size, min(31vw, 55vh))"
                containerWidth="var(--card-size, min(31vw, 55vh))"
                imageHeight="var(--card-size, min(31vw, 55vh))"
                imageWidth="var(--card-size, min(31vw, 55vh))"
                rotateAmplitude={12}
                scaleOnHover={1.05}
                showMobileWarning={false}
                showTooltip
              />
            )}
          </div>

          <div className="about__copy">
            <p className="about__p" ref={p1Ref}>
              {'Aspires and takes into practice the desire to materialize my ideas, bridging the gap between '}
              <span className="about__hl">real-world problems</span>
              {' and '}
              <span className="about__hl">aesthetic, functional tech solutions.</span>
            </p>
            <p className="about__p" ref={p2Ref}>
              {"Right now I'm focused on learning hard skills via "}
              <span className="about__hl">certifications</span>
              {' and establishing meaningful connections with the '}
              <span className="about__hl">professionals</span>
              {' I aim to become.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}