import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ElementType, SyntheticEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import laptopSrc from '../../assets/laptopsvg.svg';
import laptopFrontSrc from '../../assets/laptopfront.svg';
import { featuredProjects } from '../data/featuredWorks';
import { laptopShared, renderLaptop } from '../data/laptopWarp';
import './FeaturedWorks.css'; // reuse the .fw-* hover / laptop / media styles
import './CloudProjects.css';

gsap.registerPlugin(ScrollTrigger);

const CLOUD_TITLE = 'Cloud Projects';

const hideBroken = (e: SyntheticEvent<HTMLElement>) => {
  e.currentTarget.style.visibility = 'hidden';
};

export default function CloudProjects() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const laptopBoxRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const sideArtRef = useRef<HTMLImageElement>(null);
  const frontArtRef = useRef<HTMLImageElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [hovered, setHovered] = useState<number | null>(0);
  const [screenIndex, setScreenIndex] = useState(0);

  const activate = (i: number) => {
    setHovered(i);
    setScreenIndex(i);
  };

  // Rest pose = fully front-facing (warp t = 1), identical to where Featured Works ends.
  useLayoutEffect(() => {
    const box = laptopBoxRef.current;
    const screen = screenRef.current;
    const sideArt = sideArtRef.current;
    const frontArt = frontArtRef.current;
    if (!box || !screen || !sideArt || !frontArt) return;

    const apply = () => renderLaptop({ box, screen, sideArt, frontArt }, 1);
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Only the visible video plays.
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === screenIndex) v.play().catch(() => {});
      else v.pause();
    });
  }, [screenIndex]);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const title = titleRef.current;
    const works = worksRef.current;
    const laptop = laptopRef.current;
    if (!root || !pin || !title || !works || !laptop) return;

    const ctx = gsap.context(() => {
      gsap.set([title, works], { autoAlpha: 0, x: -80 });

      // Swap: the moment Featured Works finishes, this laptop becomes visible
      // (2px early so there is never a frame with no laptop on screen).
      ScrollTrigger.create({
        trigger: root,
        start: 'top top+=2',
        toggleClass: { targets: laptop, className: 'is-live' },
        refreshPriority: -3, // measure after both pins (Featured -1, Cloud -2) exist
        onEnter: () => {
          setScreenIndex(laptopShared.index);
          setHovered(laptopShared.index);
        },
      });

      // Pinned scene: title + list slide in from the left, then a short hold.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: pin,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: -2, // after Featured Works
          },
        })
        .to(title, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 })
        .to(works, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '<0.1')
        .to({}, { duration: 0.8 });

      // Featured Works measures this section's laptop, so re-measure now that it exists.
      ScrollTrigger.refresh();
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="fw cp" ref={rootRef} id="cloud-projects">
      <div className="fw-pin cp-pin" ref={pinRef}>
        <div className="cp-stage">
          <div className="cp-side">
            <h2 className="cp-title" ref={titleRef}>
              {CLOUD_TITLE}
            </h2>

            <div className="cp-works" ref={worksRef}>
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
                        <div className="fw-desc-inner">
                          <p>{p.description}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="cp-laptop" ref={laptopRef}>
            <div className="fw-laptop-3d" ref={laptopBoxRef}>
              <div className="fw-screen" ref={screenRef}>
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
              <img
                className="fw-laptop-svg"
                ref={sideArtRef}
                src={laptopSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
              <img
                className="fw-laptop-svg fw-laptop-svg--front"
                ref={frontArtRef}
                src={laptopFrontSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}