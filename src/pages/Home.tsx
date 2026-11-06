import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap'; 
import Header from '../components/layout/Header';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import '../styles/Home.css';

gsap.registerPlugin(ScrollTrigger);

function Home() {
  return (
    <main className="home">
      <Header />
      <div className="hero-stage">
        <div className="hero-pin">
          <Hero />
        </div>

        <About/>
      </div>
    </main>
  );
}

export default Home;