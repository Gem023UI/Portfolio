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
//   ~75vh onward the paragraphs (separate ScrollReveal each) scroll up OVER the sticky title
//   ~115vh       the copy is centred over the title; the signature starts writing itself (time-based)
//   130vh        section ends with the final look: watermark + text + signature
// Everything except the signature is scroll-scrubbed, so scrolling back up plays it in reverse.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.2;

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
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
    const lead = leadRef.current;
    const svg = sigRef.current;
    if (!section || !title || !lead || !svg) return;
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
        const total = lengths.reduce((a, b) => a + b, 0);
        const SECONDS = 4.4; // total writing time
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: 'power1.inOut' },
        });
        pens.forEach((pen, i) => {
          tl.to(pen, { strokeDashoffset: 0, duration: Math.max(0.12, (lengths[i] / total) * SECONDS) }, i === 0 ? 0 : '>-0.02');
        });

        ScrollTrigger.create({
          // the copy block is sticky, so trigger on the (non-sticky) spacer above it: its bottom edge
          // sits exactly where the copy's top edge would be
          trigger: lead,
          start: 'bottom 15%',
          onEnter: () => tl.timeScale(1).play(),
          onLeaveBack: () => tl.timeScale(2.2).reverse(), // un-write faster when scrolling back up
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about" ref={sectionRef} id="about" aria-label="About">
      {/* Sticky layer: ABOUT stays centred in the viewport for the whole section */}
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
      </div>
    </section>
  );
}