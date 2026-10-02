import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProjectFolders from './ProjectFolders';
import { useFitTitle } from './UseFitTitle';
import './ProjectsSection.css';

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography (the app-level sky, App.tsx, is the background; no cloud transitions):
//   S = 0 -> 1vh  PROJECTS settles from 90vw to 80vw and fades to a watermark, sticky at the centre
//   S > 1vh       the folders scroll up over the title (lead spacer is long enough for this)

const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_PEAK_OPACITY = 0.95;
const TITLE_SETTLED_OPACITY = 0.22;
const TITLE_SETTLE_END = 1.0; // viewport heights of scroll after the section top hits the top

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useFitTitle(titleRef, TITLE_SETTLED_VW, '100px "Poppins"');

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    if (!section || !title) return;

    const ctx = gsap.context(() => {
      // PROJECTS: big -> settled watermark
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

      <div className="projects__flow">
        <div className="projects__lead" />
        <ProjectFolders />
      </div>
    </section>
  );
}