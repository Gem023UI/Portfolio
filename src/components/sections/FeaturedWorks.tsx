import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ElementType, SyntheticEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import laptopSrc from '../../assets/laptopsvg.svg';
import laptopFrontSrc from '../../assets/laptopfront.svg';
import { FEATURED_TITLE, featuredProjects } from '../data/featuredWorks';
import { laptopShared, layoutBox, renderLaptop } from '../data/laptopWarp';
import { useSectionScroll } from '../data/useSectionScroll';
import './FeaturedWorks.css';

gsap.registerPlugin(ScrollTrigger);

const hideBroken = (e: SyntheticEvent<HTMLElement>) => {
  e.currentTarget.style.visibility = 'hidden';
};

export default function FeaturedWorks() {
  useSectionScroll('#featured-works', '#cloud-projects');
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const laptopBoxRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const sideArtRef = useRef<HTMLImageElement>(null);
  const frontArtRef = useRef<HTMLImageElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // 0 = angled laptop, 1 = front-facing. Scrubbed by the timeline below.
  const warp = useRef({ t: 0 });
  const applyWarp = useRef<() => void>(() => {});

  // hovered drives title scale + description; screenIndex drives the laptop
  // display and stays on the last hovered project after the cursor leaves.
  const [hovered, setHovered] = useState<number | null>(0);
  const [screenIndex, setScreenIndex] = useState(0);

  const activate = (i: number) => {
    laptopShared.index = i;
    setHovered(i);
    setScreenIndex(i);
  };

  // Keep the display glued to the laptop glass at any rendered size / warp state.
  useLayoutEffect(() => {
    const box = laptopBoxRef.current;
    const screen = screenRef.current;
    const sideArt = sideArtRef.current;
    const frontArt = frontArtRef.current;
    if (!box || !screen || !sideArt || !frontArt) return;

    const apply = () => renderLaptop({ box, screen, sideArt, frontArt }, warp.current.t);
    applyWarp.current = apply;
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

  // Frame 1 -> frame 2 -> reveal -> hand the laptop off to CloudProjects,
  // all scrubbed inside one pin.
  useEffect(() => {
    const pin = pinRef.current;
    const title = titleRef.current;
    const slot = slotRef.current;
    const laptop = laptopRef.current;
    const works = worksRef.current;
    if (!pin || !title || !slot || !laptop || !works) return;

    const ctx = gsap.context(() => {
      gsap.set(title, { xPercent: -50, yPercent: -50 });
      gsap.set(laptop, { x: -80 });
      gsap.set([works, slot], { autoAlpha: 0, x: 80 });

      // CloudProjects renders the identical front-facing laptop at its rest pose.
      // Looked up lazily so it also works when that section mounts after this one
      // (CloudProjects calls ScrollTrigger.refresh() once it has mounted).
      const cloud = () => {
        const el = document.querySelector<HTMLElement>('.cp-laptop');
        const cpPin = el?.closest<HTMLElement>('.cp-pin') ?? null;
        return el && cpPin ? { el, pin: cpPin } : null;
      };

      // Move/scale needed so this laptop lands exactly on CloudProjects' laptop.
      // Both are measured from layout (no transforms), relative to their own pin.
      const toCloud = () => {
        const c = cloud();
        if (!c) return { x: 0, y: 0, s: 1 };
        const a = layoutBox(laptop, pin);
        const b = layoutBox(c.el, c.pin);
        return {
          x: b.x + b.w / 2 - (a.x + a.w / 2),
          y: b.y + b.h / 2 - (a.y + a.h / 2),
          s: b.w / a.w,
        };
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: '+=300%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -1, // refresh after Hero/About triggers
        },
      });

      // 1) big title sits settled in the middle
      tl.to({}, { duration: 0.5 })
        // 2) it drops behind and dims
        .set(title, { zIndex: 0 })
        .to(title, { opacity: 0.12, ease: 'power1.inOut', duration: 0.6 })
        // 3) on further scroll the section appears: laptop, small title + list
        .to(laptop, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 })
        .to([works, slot], { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '<')
        .to({}, { duration: 0.4 }) // short hold
        // 4) hand-off to CloudProjects: titles + list leave...
        .to([title, works, slot], { autoAlpha: 0, ease: 'power1.in', duration: 0.5 })
        // ...laptop travels to the Cloud position...
        .to(
          laptop,
          {
            x: () => toCloud().x,
            y: () => toCloud().y,
            scale: () => toCloud().s,
            ease: 'power2.inOut',
            duration: 1,
          },
          '<',
        )
        // ...while turning to face the viewer
        .to(
          warp.current,
          { t: 1, ease: 'power2.inOut', duration: 1, onUpdate: () => applyWarp.current() },
          '<',
        )
        .to({}, { duration: 0.3 }) // settle
        // CloudProjects' identical laptop takes over on the same frame
        .set(laptop, { autoAlpha: () => (cloud() ? 0 : 1) });
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
            <div className="fw-laptop-3d" ref={laptopBoxRef}>
              {/* lower layer: the display media, warped to the SVG's screen hole */}
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
              {/* upper layers: transparent-background laptop art (angled, then front) */}
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

          <div className="fw-side">
            {/* small title: same font, enters together with the list */}
            <div className="fw-title-slot" ref={slotRef} aria-hidden="true">
              {FEATURED_TITLE}
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
        </div>
      </div>
    </section>
  );
}