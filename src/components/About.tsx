import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CloudSurge from './CloudSurge';
import Lanyard from './Lanyard';
import { HERO_SIGNATURE_SCROLL_VH, HERO_EXIT_SCROLL_VH } from './Hero';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

// The Hero's pinned sky is also About's background (About is transparent). Scroll map, in vh,
// measured from the top of the shared .hero-stage:
//   0   -> 220  Hero signature is written                          (Hero.tsx)
//   220 -> 320  all Hero content scrolls away, About rises in     (Hero.tsx + .about__lead)
//   320 ->      About stage pins; T = scroll since it pinned:
//     T   0 ->  50  ABOUT settles 90vw -> 80vw
//     T  50 ->  80  ABOUT goes white -> white @ 25%
//     T  80 -> 110  lanyard appears in the middle
//     T 110 -> 190  lanyard slides right and settles; paragraphs fade upward on the left
//     T 190 -> 230  calm
//     T 230 -> 330  cloud descends from the top and swallows everything (solid at the end of the pin)
//   then the stage scrolls away under the solid cloud, which holds 100vh and lifts off the top,
//   revealing the pinned Projects (same as before).
// Everything is scroll-scrubbed, so scrolling back up plays it in reverse.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.25;
const LANYARD_SHIFT_VW = 25; // lanyard box is the right half, so centre -> right half centre = 25vw

const PIN_VH = 330; // how long the About stage stays pinned
const COVER_VH = 100; // cloud descends during the LAST part of the pin
const HOLD_VH = 100; // solid cloud while the stage scrolls away
const LIFT_VH = 100; // cloud lifts off the top

// Space above the pinned stage: the Hero's slot is 100vh already, so only the rest is needed
const LEAD_VH = HERO_SIGNATURE_SCROLL_VH + HERO_EXIT_SCROLL_VH - 100;

export default function About() {
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const lanyardRef = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLParagraphElement>(null);
  const p2Ref = useRef<HTMLParagraphElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const exitSurge = useRef(0); // starts transparent; scrubbed 0 -> 1 -> 0
  const [lanyardOn, setLanyardOn] = useState(false);

  // Only run the lanyard physics/WebGL while About is on (or near) the screen
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setLanyardOn(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setLanyardOn(entry.isIntersecting), {
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
    const lanyard = lanyardRef.current;
    const p1 = p1Ref.current;
    const p2 = p2Ref.current;
    const exit = exitRef.current;
    if (!track || !title || !lanyard || !p1 || !p2 || !exit) return;

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

      // 3. lanyard appears in the middle
      tl.fromTo(
        lanyard,
        { autoAlpha: 0, y: () => -window.innerHeight * 0.12 },
        { autoAlpha: 1, y: 0, duration: 30 },
        80
      );

      // 4. lanyard drifts right and settles; paragraphs fade upward on the left meanwhile
      tl.fromTo(
        lanyard,
        { x: () => (narrow() ? 0 : -(window.innerWidth * LANYARD_SHIFT_VW) / 100) },
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

      // ---- Exit cloud: descends from the top over the pinned sky, holds solid, then lifts off ----
      const exitState = { p: 0 };
      const sync = () => {
        exitSurge.current = exitState.p;
      };
      const exitTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: exit, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
      exitTl.to(exitState, { p: 1, duration: COVER_VH, onUpdate: sync });
      exitTl.to({}, { duration: HOLD_VH });
      exitTl.to(exitState, { p: 0, duration: LIFT_VH, onUpdate: sync });
    }, track.parentElement ?? track);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" aria-label="About">
      {/* Space while the Hero writes its signature and its content scrolls away */}
      <div className="about__lead" style={{ height: `${LEAD_VH}vh` }} aria-hidden="true" />

      {/* id lives here so "#about" lands on the settled start of About, not mid-signature */}
      <div className="about__track" id="about" ref={trackRef} style={{ height: `${PIN_VH + 100}vh` }}>
        <div className="about__stage">
          <div className="about__title-wrap" aria-hidden="true">
            <div className="about__title" ref={titleRef}>
              ABOUT
            </div>
          </div>

          <div className="about__lanyard" ref={lanyardRef}>
            {lanyardOn && <Lanyard />}
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

      {/* Exit cloud: its first 100vh of pin is the descent (end of the About pin) */}
      <div
        className="about__exit"
        ref={exitRef}
        aria-hidden="true"
        style={{
          bottom: `-${HOLD_VH + LIFT_VH}vh`,
          height: `${COVER_VH + HOLD_VH + LIFT_VH + 100}vh`,
        }}
      >
        <div className="about__exit-stick">
          <CloudSurge progressRef={exitSurge} fromTop timeOffset={31} className="about__exit-canvas" />
        </div>
      </div>
    </section>
  );
}