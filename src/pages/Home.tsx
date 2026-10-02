import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap';
import Hero from '../components/Hero';
import About from '../components/About';
import ProjectsSection from '../components/ProjectsSection';
import CertificationsSection from '../components/CertificationsSection';
import Footer from '../components/Footer';
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
        <About />
      </div>

      <ProjectsSection />
      <CertificationsSection />
      <Footer />
    </main>
  );
}

export default Home;