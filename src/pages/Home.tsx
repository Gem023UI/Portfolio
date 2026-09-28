import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero';
import CloudSurge from '../components/CloudSurge';
import About from '../components/About';
import ProjectsSection from '../components/ProjectsSection';
import '../styles/Home.css';

gsap.registerPlugin(ScrollTrigger);

// How much scrolling the hero stays pinned for while the clouds surge over it.
const HERO_SURGE_SCROLL_VH = 160;

function Home() {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroSurge = useRef(0); // 0..1, read by <CloudSurge> every frame

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const ctx = gsap.context(() => {
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: 'bottom bottom', // = HERO_SURGE_SCROLL_VH of scrolling, while the pin is stuck
          scrub: 0.6, // smoothing on top of Lenis; also makes the surge reverse smoothly
        },
        onUpdate: () => {
          heroSurge.current = state.p;
        },
      });
    }, stage);

    return () => ctx.revert();
  }, []);

  // Section heights depend on the web fonts (the big titles are fitted to the viewport width),
  // so recompute every scroll position once they have loaded.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="home">
      <div className="hero-stage" ref={stageRef} style={{ height: `${100 + HERO_SURGE_SCROLL_VH}vh` }}>
        <div className="hero-pin">
          <Hero />
          <CloudSurge progressRef={heroSurge} className="hero-pin__surge" />
        </div>
      </div>

      <About />
      <ProjectsSection />
    </main>
  );
}

export default Home;