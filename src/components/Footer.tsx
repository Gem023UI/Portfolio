import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import SkyBackground from './SkyBackground';
import { useTheme } from './ThemeContext';
import { SKY_THEMES } from './SkyShared';
import { makeCloudSprites } from './CloudSprites';
import { SOCIAL_LINKS, NAV_LINKS } from './SiteLinks';
import './Footer.css';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function cloudRgb(theme: keyof typeof SKY_THEMES): [number, number, number] {
  const { high, main } = SKY_THEMES[theme].tones;
  return [0, 1, 2].map((i) => Math.round((high[i] * 0.7 + main[i] * 0.3) * 255)) as [number, number, number];
}

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const cloudRefs = useRef<(HTMLImageElement | null)[]>([]);
  const sprites = useMemo(() => makeCloudSprites(cloudRgb(resolvedTheme)), [resolvedTheme]);

  // Same drifting-cloud technique as the hero, anchored along the bottom edge instead of scattered.
  const cloudCfg = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        sprite: i % Math.max(1, sprites.length),
        bottom: rand(-6, 10), // %
        width: rand(42, 78), // vw
        opacity: rand(0.75, 0.95),
        duration: rand(90, 160),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sprites.length]
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      cloudRefs.current.forEach((img, i) => {
        if (!img) return;
        gsap.fromTo(
          img,
          { x: () => -window.innerWidth * 0.5 },
          {
            x: () => window.innerWidth * 0.5,
            duration: cloudCfg[i].duration,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          }
        );
      });
    });
    return () => ctx.revert();
  }, [cloudCfg]);

  return (
    <footer className="footer" aria-label="Footer">
      <SkyBackground className="footer__sky" style={{ position: 'absolute', inset: 0, height: '100%', aspectRatio: 'auto' }} />

      <div className="footer__clouds" aria-hidden="true">
        {cloudCfg.map((c, i) => (
          <img
            key={i}
            ref={(el) => {
              cloudRefs.current[i] = el;
            }}
            className="footer__cloud"
            src={sprites[c.sprite]}
            alt=""
            draggable={false}
            style={{ bottom: `${c.bottom}%`, width: `${c.width}vw`, opacity: c.opacity }}
          />
        ))}
      </div>

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
  );
}