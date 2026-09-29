import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SkyBackground from './SkyBackground';
import CloudSurge from './CloudSurge';
import CertificateCard from './CertificateCard';
import { useFitTitle } from './UseFitTitle';
import './CertificationsSection.css';

gsap.registerPlugin(ScrollTrigger);

// TODO: replace with the real certificates (title, date, and swap CertificateCard's SVG
// placeholder for an <img>). The first entry mirrors the sample in the provided mockup.
const CERTIFICATES = [
  { title: 'Google Analyst', date: 'March 20, 2026' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
];

// Scroll choreography, all within one pinned viewport:
//   0 -> TITLE_FRACTION       CERTIFICATIONS settles from 90vw to 80vw, sticky at centre
//   TITLE_FRACTION -> 1       the 5-card track pans right -> left under the title, ending with
//                             the last card resting fully on screen (never overshooting)
// Both are scrubbed to scroll, so the whole thing reverses cleanly on the way back up.
const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.22;
const TITLE_FRACTION = 0.3;
const SCROLL_VH = 260; // total extra scroll distance the section stays pinned for

// The seam between Projects and Certifications is two INDEPENDENT sky canvases rendered at the
// same theme — visually continuous most of the time, but nothing guarantees their cloud noise
// lines up exactly at the join. A cloud belt straddling the seam hides that join at any scroll
// position, and swells thicker as Certifications approaches so it also reads as "a surge of
// clouds" arriving, per the brief.
const BELT_FROM = 0.15;
const BELT_TO = 1;

export default function CertificationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const belt = useRef(0);

  useFitTitle(titleRef, TITLE_SETTLED_VW, '100px "Instrument Serif"');

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !title || !viewport || !track) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: '+=' + SCROLL_VH + '%', scrub: 0.6 },
      });

      tl.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 0.95 },
        { scale: 1, opacity: TITLE_SETTLED_OPACITY, ease: 'none', duration: TITLE_FRACTION }
      );

      // Measured at build time so the last card lands flush with the viewport's right edge —
      // never overshooting past it, never stopping short.
      const maxX = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      tl.fromTo(
        track,
        { x: 0 },
        { x: () => -maxX(), ease: 'none', duration: 1 - TITLE_FRACTION },
        TITLE_FRACTION
      );

      // Cloud belt: thin while Certifications is still below the fold, thicker as it arrives.
      const beltState = { p: 0 };
      gsap.to(beltState, {
        p: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 },
        onUpdate: () => {
          belt.current = BELT_FROM + (BELT_TO - BELT_FROM) * beltState.p;
        },
      });
    }, section);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="certifications"
      ref={sectionRef}
      id="certifications"
      aria-label="Certifications"
      style={{ height: `${100 + SCROLL_VH}vh` }}
    >
      <div className="certifications__belt" aria-hidden="true">
        <CloudSurge progressRef={belt} variant="belt" timeOffset={13} className="certifications__belt-canvas" />
      </div>

      <div className="certifications__stick">
        <SkyBackground
          className="certifications__sky"
          style={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: 'auto' }}
        />

        <div className="certifications__title" ref={titleRef}>
          CERTIFICATIONS
        </div>

        <div className="certifications__viewport" ref={viewportRef}>
          <div className="certifications__track" ref={trackRef}>
            {CERTIFICATES.map((cert, i) => (
              <CertificateCard key={i} title={cert.title} date={cert.date} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}