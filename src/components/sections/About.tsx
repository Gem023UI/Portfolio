import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimatedContent from "../AnimatedContent";
import "./About.css";

gsap.registerPlugin(ScrollTrigger);

type Frame = {
  id: number;
  src: string;
  alt: string;
  className: string;
  /** timeline start position (0 – 1 range of total scroll) */
  start: number;
  /** timeline length — shorter = faster travel */
  duration: number;
  /** extra px travelled past the top edge, adds speed variance */
  extra: number;
};

const FRAMES: Frame[] = [
  // Frame 1 — behind text, translucent, upper right
  {
    id: 1,
    src: "/about/about1.jpg",
    alt: "Placeholder 1",
    className: "about__frame about__frame--1",
    start: 0,
    duration: 0.75,
    extra: 0,
  },
  // Frame 2 — above text, lower left
  {
    id: 2,
    src: "/about/about2.jpg",
    alt: "Placeholder 2",
    className: "about__frame about__frame--2",
    start: 0.25,
    duration: 0.5,
    extra: 160,
  },
  // Frame 3 — above text, lower center-right, larger
  {
    id: 3,
    src: "/about/about3.JPG",
    alt: "Placeholder 3",
    className: "about__frame about__frame--3",
    start: 0.6,
    duration: 0.4,
    extra: 80,
  },
];

const TOTAL = 1.3; // timeline length (max of start + duration)

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      FRAMES.forEach((f, i) => {
        const el = frameRefs.current[i];
        if (!el) return;

        tl.fromTo(
          el,
          // start just below the viewport
          { y: () => window.innerHeight - el.offsetTop },
          // leave past the top edge
          {
            y: () => -(el.offsetTop + el.offsetHeight + f.extra),
            duration: f.duration,
          },
          f.start
        );
      });

      // pad so the timeline length is exactly TOTAL
      tl.set({}, {}, TOTAL);
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="about" className="about" ref={sectionRef}>
      <AnimatedContent
        distance={100}
        direction="vertical"
        duration={0.8}
        ease="power3.out"
        blur={0}
        stagger={0.08}
        delay={0.5}
        threshold={0.1}
      >
        <p className="about__text">
          I’m drawn to the space where design meets technology. I enjoy turning
          abstract ideas into thoughtful experiences, functional products, and
          solutions that make a difference. With interests spanning product
          design, full-stack development, and cloud computing, I approach every
          challenge as an opportunity to experiment, connect ideas, and build
          with purpose. Always curious, always creating, and never quite done
          exploring.
        </p>
      </AnimatedContent>

      {FRAMES.map((f, i) => (
        <div
          key={f.id}
          className={f.className}
          ref={(el) => {
            frameRefs.current[i] = el;
          }}
          aria-hidden="true"
        >
          <img className="about__frame-img" src={f.src} alt={f.alt} />
        </div>
      ))}
    </section>
  );
}