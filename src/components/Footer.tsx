import SkyBackground from './SkyBackground';
import { SOCIAL_LINKS, NAV_LINKS } from './SiteLinks';
import './Footer.css';

export default function Footer() {
  return (
    <div className="footer-stage">
      <footer className="footer" aria-label="Footer">
        {/* The hero's sky, flipped upside down (see .footer__sky): its cloud mass, which sits at the
            top of the hero, ends up along the bottom of the footer. */}
        <SkyBackground
          className="footer__sky"
          style={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: 'auto' }}
        />

        <div className="footer__content">
          <div className="footer__brand">
            {/* Picture placeholder — swap for the real logo <img> later */}
            <div className="footer__logo-frame" aria-label="Logo placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
                <rect x="2.5" y="4" width="19" height="15" rx="1.5" />
                <circle cx="8.5" cy="10" r="1.75" />
                <path d="M2.5 16.5l5-4.5 3.5 3 4-4.5 6.5 6" />
              </svg>
            </div>
          </div>

          <div className="footer__columns">
            <div className="footer__col">
              <h3 className="footer__heading">Contact</h3>
              <ul className="footer__list">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a href={s.link} target="_blank" rel="noopener noreferrer" className="footer__link">
                      <i className={s.icon} aria-hidden="true" />
                      <span>{s.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer__col">
              <h3 className="footer__heading">Home</h3>
              <ul className="footer__list">
                {NAV_LINKS.map((n) => (
                  <li key={n.label}>
                    <a href={n.link} aria-label={n.ariaLabel} className="footer__link">
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      <div className="footer-stage__tail" aria-hidden="true" />
    </div>
  );
}