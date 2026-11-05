import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import Hero from '../components/sections/Hero';
import '../styles/Home.css';

gsap.registerPlugin(ScrollTrigger);

function Home() {
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
      <div className="hero-stage">
        <div className="hero-pin">
          <Hero />
        </div>
      </div>
    </main>
  );
}

export default Home;