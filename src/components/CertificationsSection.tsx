import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CertificateCard from './CertificateCard';
import { useFitTitle } from './UseFitTitle';
import './CertificationsSection.css';

gsap.registerPlugin(ScrollTrigger);

const CERTIFICATES = [
  { title: 'Google Analyst', date: 'March 20, 2026' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
  { title: 'Certification Title', date: 'Date' },
];

// One pinned viewport (timeline is normalised to 0..1):
//   0 -> 0.25      CERTIFICATIONS settles from 90vw to 80vw at the centre (cards still hidden)
//   0.25 -> 0.85   cards fade in at the right edge, then pan right -> left; the last card stops
//                  flush inside the viewport
//   0.85 -> 1      REST: header + cards sit still, then the pin releases and the whole section
//                  scrolls away together
const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.22;
const TITLE_END = 0.25;
const PAN_END = 0.85;
const SCROLL_VH = 320; // extra scroll distance the section stays pinned for

export default function CertificationsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useFitTitle(titleRef, TITLE_SETTLED_VW, '100px "Instrument Serif"');

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !title || !viewport || !track) return;

    const ctx = gsap.context(() => {
      const pad = () => parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      // last card's right edge lands exactly at the viewport's inner right edge
      const maxX = () => Math.max(0, track.scrollWidth - (viewport.clientWidth - 2 * pad()));
      // cards start just outside the right edge
      const startX = () => viewport.clientWidth - pad();

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=' + SCROLL_VH + '%',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 0.95 },
        { scale: 1, opacity: TITLE_SETTLED_OPACITY, duration: TITLE_END },
        0
      );
      tl.fromTo(track, { opacity: 0 }, { opacity: 1, duration: 0.06 }, TITLE_END);
      tl.fromTo(track, { x: startX }, { x: () => -maxX(), duration: PAN_END - TITLE_END }, TITLE_END);
      tl.to({}, { duration: 1 - PAN_END }, PAN_END); // rest before the pin releases
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
      <div className="certifications__stick">
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