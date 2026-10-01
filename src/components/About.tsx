import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from './ScrollReveal';
import CloudSurge from './CloudSurge';
import { SIGNATURE } from './SignaturePath';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography (S = scroll distance since the section's top reached the top of the screen):
//   before S=0   the section slides in; ABOUT is already on screen, big (90vw) and strong
//   0 -> 50vh    ABOUT settles: scales down to 80vw and fades to a faint watermark, staying centred
//   ~30vh onward the paragraphs (separate ScrollReveal each) scroll up OVER the sticky title
//   130vh        the paragraphs have SETTLED in the middle of the screen and are pinned
//   130 -> 250vh (the "hold" zone) the signature is written in one continuous pen motion, driven by scroll
//   250vh        the pins release: ABOUT, the paragraphs and the signature scroll up together.
//                At that moment the EXIT CLOUD starts: the Hero -> About surge played in reverse
//                (progress 1 -> 0) and inverted (hangs from the top), so a solid cloud (== About's
//                background, so it is invisible) lifts away upward and reveals Projects underneath.
// Everything is scroll-scrubbed, so scrolling back up plays it all in reverse.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.2;

// Fraction of the hold zone kept as a rest after the pen lifts for the last time,
// so the finished signature sits still for a moment before everything scrolls away.
const SIGNATURE_TAIL = 0.1;

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SVGSVGElement>(null);
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
    if (!section || !title || !hold || !exit || !svg) return;
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
        const target = (self: ScrollTrigger) => Math.min(1, self.progress / (1 - SIGNATURE_TAIL));
        const pos = { q: 0 };
        draw(0);

        // The copy block is pinned for exactly as long as the hold spacer scrolls through the
        // viewport, so this runs only while the paragraphs are settled and pinned.
        ScrollTrigger.create({
          trigger: hold,
          start: 'top bottom',
          end: 'bottom bottom',
          onUpdate: (self) => {
            // short ease so the pen glides between wheel notches instead of stepping
            gsap.to(pos, {
              q: target(self),
              duration: 0.25,
              ease: 'power1.out',
              overwrite: true,
              onUpdate: () => draw(pos.q),
            });
          },
          onRefresh: (self) => {
            pos.q = target(self);
            draw(pos.q);
          },
        });
      }

      // ---- Exit cloud: Hero -> About surge, reversed (1 -> 0) and inverted (fromTop) ----
      // The exit block spans the last 100vh of About plus the first 100vh of Projects and is
      // pinned for one viewport of scroll: from the moment About's pins release until Projects
      // reaches the top of the screen.
      const exitState = { p: 1 };
      gsap.to(exitState, {
        p: 0,
        ease: 'none',
        scrollTrigger: { trigger: exit, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
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
          <div className="about__text">
            <ScrollReveal
              baseRotation={1.5}
              wordAnimationEnd="bottom 85%"
              rotationEnd="bottom 85%"
            >
              {'Aspires and takes into practice the desire to materialize my ideas, bridging the gap between '}
              <span className="about__hl">real-world problems</span>
              {' and '}
              <span className="about__hl">aesthetic, functional tech solutions.</span>
            </ScrollReveal>

            <ScrollReveal
              baseRotation={1.5}
              wordAnimationEnd="bottom 85%"
              rotationEnd="bottom 85%"
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
        <div className="about__hold" ref={holdRef} />
      </div>

      {/* Exit cloud: overlaps the first viewport of Projects, sits BEHIND About's own content */}
      <div className="about__exit" ref={exitRef} aria-hidden="true">
        <div className="about__exit-stick">
          <CloudSurge progressRef={exitSurge} fromTop timeOffset={31} className="about__exit-canvas" />
        </div>
      </div>
    </section>
  );
}