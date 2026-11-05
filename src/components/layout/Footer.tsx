import { useEffect, useRef, useState } from 'react';
import Birds from './Birds';
import HeroMan from './HeroMan';
import { SOCIAL_LINKS, NAV_LINKS } from './SiteLinks';
import './Footer.css';

const WORD_WIDTH_VW = 74; // "Just Create." is fitted to this share of the viewport width

const openContactPage = () => {
  window.history.pushState({}, '', '/contact');
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false); // one-way: fade-in plays once

  // Fit "Just Create." to WORD_WIDTH_VW (measure at 100px, then scale: font metrics differ per machine)
  useEffect(() => {
    const el = wordRef.current;
    if (!el) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled) return;
      el.style.fontSize = '100px';
      const natural = el.offsetWidth;
      if (natural > 0) {
        el.style.fontSize = `${(100 * ((window.innerWidth * WORD_WIDTH_VW) / 100)) / natural}px`;
      }
    };
    fit();
    document.fonts?.load('100px Anton').then(fit).catch(() => undefined);
    document.fonts?.ready.then(fit).catch(() => undefined);
    window.addEventListener('resize', fit);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', fit);
    };
  }, []);

  // Birds only animate while the footer is on screen; the fade-in fires the first time it is
  useEffect(() => {
    const el = footerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className={`footer${revealed ? ' footer--in' : ''}`} ref={footerRef} aria-label="Footer">
      <Birds layer="back" paused={!inView} />

      <div className="footer__content">
        <div className="footer__cta">
          <p className="footer__lead">Got a project, idea you want to come to life? Send it over.</p>
          <p className="footer__lead footer__lead--bold">Great ideas deserve good experiences.</p>
          <button type="button" className="footer__drop" onClick={openContactPage}>
            Drop a line
          </button>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <ul className="footer__list">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.label}>
                <a href={s.link} target="_blank" rel="noopener noreferrer" className="footer__link">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <ul className="footer__list">
            {NAV_LINKS.map((n) => (
              <li key={n.label}>
                <a href={n.link} aria-label={n.ariaLabel} className="footer__link">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Birds layer="mid" paused={!inView} />

      <div className="footer__wordwrap">
        <h2 className="footer__word" ref={wordRef}>
          Just Create.
          {/* The man from the hero, sitting on top of the "u" */}
          <span className="footer__man" aria-hidden="true">
            <HeroMan talking={false} paused={!inView} />
          </span>
        </h2>
      </div>

      <Birds layer="front" paused={!inView} />
    </footer>
  );
}