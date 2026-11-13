import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from 'gsap'; 
import Header from '../components/layout/Header';
import Hero from '../components/sections/Hero';
import About from '../components/sections/About';
import FeaturedWorks from '../components/sections/FeaturedWorks';
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
        <FeaturedWorks />
      </div>
    </main>
  );
}

export default Home;