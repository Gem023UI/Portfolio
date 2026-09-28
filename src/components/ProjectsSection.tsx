import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SkyBackground from './SkyBackground';
import CloudSurge from './CloudSurge';
import ProjectFolders from './ProjectFolders';
import { useFitTitle } from './UseFitTitle';
import './ProjectsSection.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography for this section
// (this section overlaps the last 100vh of About, which stays pinned in its final look):
//   entering   the sky rises over About with a billowing cloud fringe along its top edge
//              (cloud colour == About background, so the seam is invisible); PROJECTS is already
//              on screen, big (90vw) and white
//   S = 0      the section top reaches the top of the screen; the fringe scrolls away upward
//   0 -> 50vh  PROJECTS settles to 80vw and fades to a watermark, sticky at the centre
//   ~50vh on   the folders (existing <ProjectFolders/>) scroll up OVER the title
// Everything is scrubbed to scroll, so it all reverses when scrolling back up.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.22;

// Cloud fringe density while entering (0.42 = thin fringe -> 0.6 = thicker, "swelling" as it rises)
const FRINGE_FROM = 0.42;
const FRINGE_TO = 0.6;

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const fringe = useRef(FRINGE_FROM);

  useFitTitle(titleRef, TITLE_SETTLED_VW, '100px "Instrument Serif"');

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    if (!section || !title) return;

    const ctx = gsap.context(() => {
      // PROJECTS: big -> settled watermark
      gsap.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 0.95 },
        {
          scale: 1,
          opacity: TITLE_SETTLED_OPACITY,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '+=50%', scrub: 0.6 },
        }
      );

      // Cloud fringe swells while the section rises from the bottom of the screen to the top
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 },
        onUpdate: () => {
          fringe.current = FRINGE_FROM + (FRINGE_TO - FRINGE_FROM) * state.p;
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="projects" ref={sectionRef} id="projects" aria-label="Projects">
      <h2 className="projects__sr-title">Projects</h2>

      {/* Sticky layer: the sky + the PROJECTS watermark */}
      <div className="projects__stick" aria-hidden="true">
        <SkyBackground
          className="projects__sky"
          style={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: 'auto' }}
        />
        <div className="projects__title" ref={titleRef}>
          PROJECTS
        </div>
      </div>

      {/* Cloud fringe along the top edge: hides the straight edge and makes it billow.
          Not sticky, so it scrolls away upward once the sky is pinned. */}
      <div className="projects__fringe" aria-hidden="true">
        <CloudSurge progressRef={fringe} fromTop timeOffset={7} className="projects__fringe-canvas" />
      </div>

      {/* Flow layer: pulled up over the sticky one; the folders scroll over the title */}
      <div className="projects__flow">
        <div className="projects__lead" />
        <ProjectFolders />
      </div>
    </section>
  );
}