import { useEffect, useRef, useState } from 'react';
import type { ElementType, SyntheticEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LaptopSvg from '../../assets/laptopsvg';
import { FEATURED_TITLE, featuredProjects } from '../data/featuredWorks';
import './FeaturedWorks.css';

gsap.registerPlugin(ScrollTrigger);

const hideBroken = (e: SyntheticEvent<HTMLElement>) => {
  e.currentTarget.style.visibility = 'hidden';
};

export default function FeaturedWorks() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // hovered drives title scale + description; screenIndex drives the laptop
  // display and stays on the last hovered project after the cursor leaves.
  const [hovered, setHovered] = useState<number | null>(0);
  const [screenIndex, setScreenIndex] = useState(0);

  const activate = (i: number) => {
    setHovered(i);
    setScreenIndex(i);
  };

  // Only the visible video plays.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === screenIndex) v.play().catch(() => {});
      else v.pause();
    });
  }, [screenIndex]);

  // Frame 1 -> frame 2 -> reveal, all scrubbed inside one pin.
  useEffect(() => {
    const pin = pinRef.current;
    const title = titleRef.current;
    const laptop = laptopRef.current;
    const works = worksRef.current;
    if (!pin || !title || !laptop || !works) return;

    const ctx = gsap.context(() => {
      gsap.set(title, { xPercent: -50, yPercent: -50 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -1, // refresh after Hero/About triggers
        },
      });

      tl.to(title, {
        scale: 0.34,
        y: () => -(window.innerHeight / 2) + Math.max(90, window.innerHeight * 0.15),
        ease: 'power2.inOut',
        duration: 1,
        delay: 0.25,
      })
        .to(laptop, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '>-0.1')
        .to(works, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '<')
        .to({}, { duration: 0.4 }); // short hold before the pin releases

      gsap.set(laptop, { x: -80 });
      gsap.set(works, { x: 80 });
    }, rootRef);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => ctx.revert();
  }, []);

  return (
    <section className="fw" ref={rootRef} id="featured-works">
      <div className="fw-pin" ref={pinRef}>
        <h2 className="fw-title" ref={titleRef}>
          {FEATURED_TITLE}
        </h2>

        <div className="fw-stage">
          <div className="fw-laptop" ref={laptopRef}>
            <div className="fw-laptop-3d">
              <LaptopSvg className="fw-laptop-svg" />
              <div className="fw-screen">
                {featuredProjects.map((p, i) => (
                  <div
                    key={p.id}
                    className={`fw-media${i === screenIndex ? ' is-active' : ''}`}
                  >
                    {p.media.type === 'video' ? (
                      <video
                        ref={(el) => {
                          videoRefs.current[i] = el;
                        }}
                        src={p.media.src}
                        poster={p.media.poster}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onError={hideBroken}
                      />
                    ) : (
                      <img
                        src={p.media.src}
                        alt={p.media.alt ?? p.title}
                        loading="lazy"
                        onError={hideBroken}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fw-works" ref={worksRef}>
            <ul className="fw-list" onMouseLeave={() => setHovered(null)}>
              {featuredProjects.map((p, i) => {
                const Tag = (p.href ? 'a' : 'div') as ElementType;
                const linkProps = p.href ? { href: p.href } : { tabIndex: 0 };
                return (
                  <li
                    key={p.id}
                    className={`fw-item${hovered === i ? ' is-active' : ''}`}
                    onMouseEnter={() => activate(i)}
                    onFocus={() => activate(i)}
                    onBlur={() => setHovered(null)}
                  >
                    <Tag className="fw-link" {...linkProps}>
                      <span className="fw-title-row">
                        <span className="fw-num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="fw-name">{p.title}</span>
                      </span>
                    </Tag>
                    <div className="fw-desc">
                      <p>{p.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}