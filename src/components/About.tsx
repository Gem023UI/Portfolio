import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from './ScrollReveal';
import { SIGNATURE } from './SignaturePath';
import './About.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography (S = scroll distance since the section's top reached the top of the screen):
//   before S=0   the section slides in; ABOUT is already on screen, big (90vw) and strong
//   0 -> 50vh    ABOUT settles: scales down to 80vw and fades to a faint watermark, staying centred
//   ~30vh onward the paragraphs (separate ScrollReveal each) scroll up OVER the sticky title
//   130vh        the paragraphs have SETTLED in the middle of the screen and are pinned
//   130 -> 250vh (the "hold" zone) the signature is written, driven by scroll amount (scrubbed)
//   250vh        the signature is finished and the pins release: ABOUT, the paragraphs and the
//                signature all scroll up together and leave the screen as one piece.
//                The next section simply follows below (it no longer slides over About).
// Everything is scroll-scrubbed, so scrolling back up plays it all in reverse.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.2;

// Fraction of the hold zone reserved as a short rest after the last pen stroke,
// so the finished signature sits still for a moment before everything scrolls away.
const SIGNATURE_TAIL = 0.15;

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLDivElement>(null);
  const sigRef = useRef<SVGSVGElement>(null);

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
    const svg = sigRef.current;
    if (!section || !title || !hold || !svg) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

      // ---- Signature: strokes are a reveal mask over the traced outline ----
      const pens = gsap.utils.toArray<SVGPathElement>('.sig-pen', svg);
      gsap.set(pens, { strokeDasharray: '1 2', strokeDashoffset: reduce ? 0 : 1 });

      if (!reduce) {
        const lengths = pens.map((p) => p.getTotalLength());
        const total = lengths.reduce((a, b) => a + b, 0) || 1;

        // The copy block is sticky (pinned at the centre) for exactly as long as the hold spacer
        // scrolls through the viewport: the spacer's top enters at the bottom of the screen the moment
        // the paragraphs finish settling, and its bottom arrives there the moment the pins release.
        // So this scrub runs only while the paragraphs are settled and pinned.
        const tl = gsap.timeline({
          defaults: { ease: 'none' }, // constant pen speed: the ink follows the scroll 1:1
          scrollTrigger: {
            trigger: hold,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        });

        // Strokes are written one after another, each taking time proportional to its length,
        // so the pen moves at a steady speed along the whole signature.
        pens.forEach((pen, i) => {
          tl.to(pen, { strokeDashoffset: 0, duration: lengths[i] / total }, i === 0 ? 0 : '>');
        });

        // Short rest at the end: signature is complete before the section starts scrolling away.
        tl.to({}, { duration: SIGNATURE_TAIL });
      }
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
                <g fill="none" stroke="#ffffff" strokeWidth={SIGNATURE.penWidth} strokeLinecap="round" strokeLinejoin="round">
                  {SIGNATURE.strokes.map((d, i) => (
                    <path key={i} className="sig-pen" d={d} pathLength={1} />
                  ))}
                </g>
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
    </section>
  );
}