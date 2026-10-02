import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero, { HERO_SIGNATURE_SCROLL_VH } from '../components/Hero';
import CloudSurge from '../components/CloudSurge';
import About from '../components/About';
import ProjectsSection from '../components/ProjectsSection';
import CertificationsSection from '../components/CertificationsSection';
import Footer from '../components/Footer';
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
          start: () => `top+=${Math.round((window.innerHeight * HERO_SIGNATURE_SCROLL_VH) / 100)} top`,
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
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
      <div
        className="hero-stage"
        ref={stageRef}
        style={{ height: `${100 + HERO_SIGNATURE_SCROLL_VH + HERO_SURGE_SCROLL_VH}vh` }}
      >
        <div className="hero-pin">
          <Hero />
          <CloudSurge progressRef={heroSurge} className="hero-pin__surge" />
        </div>
      </div>

      <About />
      <ProjectsSection />
      <CertificationsSection />
      <Footer />
    </main>
  );
}

export default Home;