import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from './ScrollReveal';
import CloudSurge from './CloudSurge';
import { SIGNATURE } from './SignaturePath';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography (S = scroll since the section's top reached the top of the screen).
// One phase after another, each one finishing before the next begins:
//   1. ABOUT letters       on screen big (90vw), settle to 80vw / faint watermark by S = 50vh
//   2. (calm)              ABOUT sits alone in the middle until the paragraphs start rising (S = 100vh)
//   3. paragraphs          rise over ABOUT, settle in the middle and finish revealing while pinned
//   4. (calm)              paragraphs rest in the middle
//   5. signature           written in one continuous pen motion over a long scroll
//   6. (calm)              the finished signature rests in the middle
//   7. release             ABOUT, paragraphs and signature leave together as one piece, over a SOLID cloud
//                          that is the same colour as About's background, so there is no seam
//   8. cloud lifts         Hero -> About, played backwards and mirrored: the solid cloud rises off the
//                          top of the screen and reveals a pinned Projects (title already on screen)
// Everything is scroll-scrubbed, so scrolling back up plays it all in reverse.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.2;

// Paragraph reveal finishes late (their bottom edge reaches 20% of the screen height) so they keep
// filling in while pinned. Must match what ScrollReveal accepts for these two props.
const PARAGRAPH_END = 'bottom 20%';

// Hold zone (the copy is pinned for this long). Keep in sync with .about__hold in About.css.
const HOLD_VH = 700;
// Calm between "paragraphs finished" and "pen touches down", and after the pen lifts, in viewport heights
const PAUSE_BEFORE_SIGNATURE_VH = 0.4;
const REST_AFTER_SIGNATURE_VH = 0.7;

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const exitSurge = useRef(1); // starts fully covered; scrubbed 1 -> 0

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
    const section = sectionRef.current;
    const title = titleRef.current;
    const hold = holdRef.current;
    const exit = exitRef.current;
    const svg = sigRef.current;
    const text = textRef.current;
    if (!section || !title || !hold || !exit || !svg || !text) return;
    const pen = svg.querySelector<SVGPathElement>('.sig-pen');

    const ctx = gsap.context(() => {
      // ---- ABOUT: big -> settled watermark (scrubbed, so it reverses on scroll up) ----
      gsap.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 0.92 },
        {
          scale: 1,
          opacity: TITLE_SETTLED_OPACITY,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=50%', scrub: 0.6 },
        }
      );

      // ---- Signature: one continuous pen path, revealed by a plain px dash length ----
      // No pathLength attribute and no GSAP-managed dash styles: the dash is written directly.
      // The ink is drawn on scroll, so it is intentionally NOT disabled by prefers-reduced-motion.
      if (pen) {
        let length = 0;
        const draw = (q: number) => {
          if (!length) length = pen.getTotalLength();
          const visible = Math.min(1, Math.max(0, q)) * length;
          if (visible < 0.5) {
            pen.style.visibility = 'hidden';
            return;
          }
          pen.style.visibility = 'visible';
          pen.style.strokeDasharray = `${visible} ${length * 2}`;
          pen.style.strokeDashoffset = '0';
        };
        const pos = { q: 0 };
        draw(0);

        // Pen touches down only after the last paragraph has finished revealing (its bottom edge
        // reaches 20% of the screen, which happens (26.5vh + half the text height) after the copy
        // pins) plus a calm pause. It lifts REST_AFTER_SIGNATURE_VH before the pins release.
        // Offsets are plain px so ScrollTrigger parses them reliably.
        ScrollTrigger.create({
          trigger: hold,
          start: () => {
            const vh = window.innerHeight;
            const paragraphsDone = vh * 0.265 + text.offsetHeight / 2;
            return `top bottom-=${Math.round(paragraphsDone + vh * PAUSE_BEFORE_SIGNATURE_VH)}`;
          },
          end: () => `bottom bottom+=${Math.round(window.innerHeight * REST_AFTER_SIGNATURE_VH)}`,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // short ease so the pen glides between wheel notches instead of stepping
            gsap.to(pos, {
              q: self.progress,
              duration: 0.25,
              ease: 'power1.out',
              overwrite: true,
              onUpdate: () => draw(pos.q),
            });
          },
          onRefresh: (self) => {
            pos.q = self.progress;
            draw(pos.q);
          },
        });
      }

      // ---- Exit cloud: Hero -> About surge, reversed (1 -> 0) and inverted (fromTop) ----
      // The exit block is pinned for two viewports of scroll, starting the moment About's pins release:
      //   first viewport   p stays 1: a SOLID cloud (== About's background) covers the screen while
      //                    About scrolls away and Projects arrives underneath. No billowing edge ever
      //                    crosses the About/Projects boundary, so there is no seam.
      //   second viewport  p goes 1 -> 0: the cloud lifts off the top, revealing the pinned Projects.
      const exitState = { p: 1 };
      const exitTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: exit, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
      exitTl.to({}, { duration: 1 });
      exitTl.to(exitState, {
        p: 0,
        duration: 1,
        onUpdate: () => {
          exitSurge.current = exitState.p;
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" ref={sectionRef} id="about" aria-label="About">
      {/* Sticky layer: ABOUT stays centred in the viewport until the whole section is released */}
      <div className="about__stick" aria-hidden="true">
        <div className="about__title" ref={titleRef}>
          ABOUT
        </div>
      </div>

      {/* Flow layer: pulled up over the sticky layer, scrolls normally */}
      <div className="about__flow">
        <div className="about__lead" ref={leadRef} />

        <div className="about__copy" ref={copyRef}>
          <div className="about__text" ref={textRef}>
            <ScrollReveal
              baseRotation={1.5}
              wordAnimationEnd={PARAGRAPH_END}
              rotationEnd={PARAGRAPH_END}
            >
              {'Aspires and takes into practice the desire to materialize my ideas, bridging the gap between '}
              <span className="about__hl">real-world problems</span>
              {' and '}
              <span className="about__hl">aesthetic, functional tech solutions.</span>
            </ScrollReveal>

            <ScrollReveal
              baseRotation={1.5}
              wordAnimationEnd={PARAGRAPH_END}
              rotationEnd={PARAGRAPH_END}
            >
              {"Right now I'm focused on learning hard skills via "}
              <span className="about__hl">certifications</span>
              {' and establishing meaningful connections with the '}
              <span className="about__hl">professionals</span>
              {' I aim to become.'}
            </ScrollReveal>
          </div>

          <svg
            ref={sigRef}
            className="about__signature"
            viewBox={`0 0 ${SIGNATURE.width} ${SIGNATURE.height}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <mask
                id="about-signature-reveal"
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
              className="about__signature-ink"
              d={SIGNATURE.outline}
              fillRule="evenodd"
              mask="url(#about-signature-reveal)"
            />
          </svg>
        </div>

        {/* Scroll distance during which the copy stays pinned while the signature is written */}
        <div className="about__hold" ref={holdRef} style={{ height: `${HOLD_VH}vh` }} />
      </div>

      {/* Exit cloud: pinned over the first two viewports of Projects, BEHIND About's own content */}
      <div className="about__exit" ref={exitRef} aria-hidden="true">
        <div className="about__exit-stick">
          <CloudSurge progressRef={exitSurge} fromTop timeOffset={31} className="about__exit-canvas" />
        </div>
      </div>
    </section>
  );
}