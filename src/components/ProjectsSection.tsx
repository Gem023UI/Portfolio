import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CloudSurge from './CloudSurge';
import ProjectFolders from './ProjectFolders';
import { useFitTitle } from './UseFitTitle';
import './ProjectsSection.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography:
//   entering   the section rises with a billowing cloud fringe on top. PROJECTS is already on
//              screen (big, 90vw) underneath it, so it is revealed as the clouds clear (no fade-in).
//   S = 0 -> 1vh  PROJECTS settles to 80vw and fades to a watermark, sticky at the centre
//   S > 1vh       the folders scroll up over the title (lead spacer is long enough for this)
//   end        a cloud surge (same as Hero -> About) covers the screen in solid --cloud, which
//              is Certifications' background, so the hand-off has no seam.

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_PEAK_OPACITY = 0.95;
const TITLE_SETTLED_OPACITY = 0.22;
const TITLE_SETTLE_END = 1.0; // viewport heights of scroll after the section top hits the top

// Fringe density: lower = cloud hangs less far down (keeps the whole billow inside the canvas)
const FRINGE_FROM = 0.3;
const FRINGE_TO = 0.42;

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const fringe = useRef(FRINGE_FROM);
  const exitSurge = useRef(0);

  useFitTitle(titleRef, TITLE_SETTLED_VW, '100px "Instrument Serif"');

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const exit = exitRef.current;
    if (!section || !title || !exit) return;

    const ctx = gsap.context(() => {
      // PROJECTS: visible from the start, big -> settled watermark
      gsap.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: TITLE_PEAK_OPACITY },
        {
          scale: 1,
          opacity: TITLE_SETTLED_OPACITY,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${window.innerHeight * TITLE_SETTLE_END}`,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        }
      );

      // Entry fringe swells while the section rises
      const fringeState = { p: 0 };
      gsap.to(fringeState, {
        p: 1,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 },
        onUpdate: () => {
          fringe.current = FRINGE_FROM + (FRINGE_TO - FRINGE_FROM) * fringeState.p;
        },
      });

      // Exit surge: 0 -> 1 while the exit block is pinned (one viewport of scroll)
      const exitState = { p: 0 };
      gsap.to(exitState, {
        p: 1,
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
    <section className="projects" ref={sectionRef} id="projects" aria-label="Projects">
      <h2 className="projects__sr-title">Projects</h2>

      <div className="projects__stick" aria-hidden="true">
        <div className="projects__title" ref={titleRef}>
          PROJECTS
        </div>
      </div>

      <div className="projects__fringe" aria-hidden="true">
        <CloudSurge progressRef={fringe} fromTop timeOffset={7} className="projects__fringe-canvas" />
      </div>

      <div className="projects__flow">
        <div className="projects__lead" />
        <ProjectFolders />
      </div>

      <div className="projects__exit" ref={exitRef} aria-hidden="true">
        <div className="projects__exit-stick">
          <CloudSurge progressRef={exitSurge} timeOffset={19} className="projects__exit-canvas" />
        </div>
      </div>
    </section>
  );
}