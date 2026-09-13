import { useEffect, useRef } from "react";
import "./ProjectFolders.css";

// All values are percentages of the panel's own width, read off the
// three reference folder shapes (folderblack.png / foldergreen.png / folderviolet.png).
interface TabShape {
  tabStart: number; // where the rise from baseline begins
  peakStart: number; // where the flat plateau (full tab height) begins
  peakEnd: number; // where the flat plateau ends
  tabEnd: number; // where the fall back to baseline ends
  flushLeft?: boolean; // true when the plateau starts at the very left edge (no left slope)
  flushRight?: boolean; // true when the plateau ends at the very right edge (no right slope)
}

interface ProjectFolder {
  id: string;
  label: string;
  title: string;
  description: string;
  tags: string[];
  color: string;
  textColor: string;
  image: string;
  link: string;
  tab: TabShape;
}

const TAB_HEIGHT = 9; // px — fixed regardless of viewport width
const SCROLL_LENGTH_PER_PROJECT_VH = 180; // higher = slower, more scroll distance per folder

const PROJECTS: ProjectFolder[] = [
  {
    id: "wayline",
    label: "PROJECT 01",
    title: "TOMATOGUARD",
    description: "Sample Frontend Interface for AI/ML Project.",
    tags: ["FRONTEND", "DESIGN", "UX/UI"],
    color: "#7ed957",
    textColor: "#141414",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789283498/38125e49-76c9-4b76-950b-1f0ee1e0e4ee.png",
    link: "https://tomatoguard.vercel.app/",
    tab: { tabStart: 0, peakStart: 0, peakEnd: 20, tabEnd: 28, flushLeft: true },   // wayline (green)
  },
  {
    id: "tandem",
    label: "PROJECT 02",
    title: "TYPEVENTURE",
    description: "Gamified Learning Hub for Design Principles and Theory.",
    tags: ["DESIGN THEORY", "GAMIFIED", "WORKSPACE"],
    color: "#5e1de0",
    textColor: "#ffffff",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789282925/a2e452f5-4172-4919-9474-0ce63d8c1ab4.png",
    link: "https://type-venture.vercel.app/",
    tab: { tabStart: 20, peakStart: 28, peakEnd: 52, tabEnd: 60 },   // tandem (violet)
  },
  {
    id: "forge",
    label: "PROJECT 03",
    title: "CSPT",
    description: "Report Compilation and Learning Hub for CSPT Lessons and Materials.",
    tags: ["GOOGLE SLIDES", "QUIZZES", "VIDEO LESSONS"],
    color: "#0a0a0a",
    textColor: "#ffffff",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789282381/f1f14e81-f96d-49fc-85aa-a130fb804a93.png",
    link: "https://github.com/Gem023UI/CSPT",
    tab: { tabStart: 52, peakStart: 60, peakEnd: 84, tabEnd: 92 },   // forge (black)
  },
];

function buildClipPath(tab: TabShape): string {
  const h = `${TAB_HEIGHT}vh`;

  if (tab.flushLeft && tab.flushRight) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%)`;
  }
  if (tab.flushLeft) {
    return `polygon(0 0, ${tab.peakEnd}% 0, ${tab.tabEnd}% ${h}, 100% ${h}, 100% 100%, 0 100%)`;
  }
  if (tab.flushRight) {
    return `polygon(0 ${h}, ${tab.tabStart}% ${h}, ${tab.peakStart}% 0, 100% 0, 100% 100%, 0 100%)`;
  }
  return `polygon(0 ${h}, ${tab.tabStart}% ${h}, ${tab.peakStart}% 0, ${tab.peakEnd}% 0, ${tab.tabEnd}% ${h}, 100% ${h}, 100% 100%, 0 100%)`;
}

function ProjectFolders() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const totalTransitions = PROJECTS.length;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollableDistance = section.offsetHeight - window.innerHeight;
      const scrolledIntoSection = -rect.top;

      const progress =
        scrollableDistance > 0
          ? Math.min(Math.max(scrolledIntoSection / scrollableDistance, 0), 1)
          : 0;

      const p = progress * totalTransitions;

      PROJECTS.forEach((_, i) => {
        const panel = panelRefs.current[i];
        if (!panel) return;

        let translateY: number;

        if (i === 0) {
          translateY = 0;
        } else {
          const offset = p - i;
          if (offset < 0) {
            translateY = 100; // fully below viewport — tab included, so nothing shows early
          } else if (offset < 1) {
            translateY = (1 - offset) * 100;
          } else {
            translateY = 0;
          }
        }

        panel.style.transform = `translateY(${translateY}%)`;
      });

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="project-folders"
      ref={sectionRef}
      style={{ height: `${PROJECTS.length * SCROLL_LENGTH_PER_PROJECT_VH}vh` }}
    >
      <div className="project-folders__sticky">
        <div className="project-folders__center">
          {PROJECTS.map((project, i) => {
            const plateauStart = project.tab.flushLeft ? 0 : project.tab.peakStart;
            const plateauEnd = project.tab.flushRight ? 100 : project.tab.peakEnd;
            const plateauWidth = plateauEnd - plateauStart;

            return (
              <div
                key={project.id}
                className="project-panel"
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                style={{
                  backgroundColor: project.color,
                  color: project.textColor,
                  zIndex: i + 1,
                  clipPath: buildClipPath(project.tab),
                  transform: i === 0 ? "translateY(0%)" : "translateY(100%)",
                }}
              >
                {/* Tab label — a child of the panel, so it moves and hides with it */}
                <div
                  className="project-panel__tab-label"
                  style={{ left: `${plateauStart}%`, width: `${plateauWidth}%` }}
                >
                  <span className="project-panel__tab-icon">✦</span>
                  {project.label}
                </div>

                <div className="project-panel__inner">
                  <div className="project-panel__text">
                    <h3 className="project-panel__title">{project.title}</h3>
                    <p className="project-panel__desc">{project.description}</p>
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-panel__link">
                      VIEW PROJECT ↗
                    </a>
                    <div className="project-panel__tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className="project-panel__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="project-panel__media">
                    <img src={project.image} alt={project.title} draggable={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ProjectFolders;