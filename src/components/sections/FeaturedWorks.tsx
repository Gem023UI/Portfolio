import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ElementType, SyntheticEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import laptopSrc from '../../assets/laptopsvg.svg';
import { FEATURED_TITLE, featuredProjects } from '../data/featuredWorks';
import './FeaturedWorks.css';

gsap.registerPlugin(ScrollTrigger);

// laptopsvg.svg is transparent where the display is, and the media sits on a layer
// beneath it. These numbers describe that SVG (viewBox 1461x822).
const LAPTOP_VIEWBOX = { w: 1461, h: 822 } as const;

// Corners of the transparent screen hole (TL, TR, BR, BL), pushed outward ~2.5
// units so the media tucks under the bezel instead of leaving a hairline gap.
// If you swap the SVG, re-measure these four points.
const LAPTOP_SCREEN_QUAD: ReadonlyArray<readonly [number, number]> = [
  [159, 7.5],
  [978, 25.6],
  [977.9, 670.7],
  [159.8, 717.2],
];

// Size of the flat .fw-screen surface in FeaturedWorks.css (16:10).
const SRC_W = 960;
const SRC_H = 600;

const hideBroken = (e: SyntheticEvent<HTMLElement>) => {
  e.currentTarget.style.visibility = 'hidden';
};

// Builds a matrix3d that maps the flat SRC_W x SRC_H screen onto the glass quad
// of the laptop SVG (unit square -> quad homography), scaled to the rendered size.
function screenMatrix(boxW: number, boxH: number) {
  const sx = boxW / LAPTOP_VIEWBOX.w;
  const sy = boxH / LAPTOP_VIEWBOX.h;
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = LAPTOP_SCREEN_QUAD.map(
    ([x, y]) => [x * sx, y * sy] as const,
  );

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2;
  const g = (dx3 * dy2 - dy3 * dx2) / den;
  const h = (dx1 * dy3 - dy1 * dx3) / den;

  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;

  // normalized (u, v) -> pixel space of the SRC_W x SRC_H element
  const A = a / SRC_W;
  const B = b / SRC_H;
  const D = d / SRC_W;
  const E = e / SRC_H;
  const G = g / SRC_W;
  const H = h / SRC_H;

  return `matrix3d(${A},${D},0,${G},${B},${E},0,${H},0,0,1,0,${x0},${y0},0,1)`;
}

export default function FeaturedWorks() {
  const rootRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const laptopBoxRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
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

  // Keep the display glued to the laptop glass at any rendered size.
  useLayoutEffect(() => {
    const box = laptopBoxRef.current;
    const screen = screenRef.current;
    if (!box || !screen) return;

    const apply = () => {
      if (!box.clientWidth || !box.clientHeight) return;
      screen.style.transform = screenMatrix(box.clientWidth, box.clientHeight);
    };
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

  // Frame 1 -> frame 2 -> reveal, all scrubbed inside one pin.
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
      gsap.set(works, { x: 80 });

      // Offset from the pin's center to the center of the slot above the list.
      const toSlot = () => {
        const p = pin.getBoundingClientRect();
        const s = slot.getBoundingClientRect();
        return {
          x: s.left + s.width / 2 - (p.left + p.width / 2),
          y: s.top + s.height / 2 - (p.top + p.height / 2),
        };
      };

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
        scale: () => slot.offsetWidth / title.offsetWidth,
        x: () => toSlot().x,
        y: () => toSlot().y,
        ease: 'power2.inOut',
        duration: 1,
        delay: 0.25,
      })
        .to(laptop, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '>-0.1')
        .to(works, { autoAlpha: 1, x: 0, ease: 'power2.out', duration: 0.6 }, '<')
        .to({}, { duration: 0.4 }); // short hold before the pin releases
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
              {/* upper layer: transparent-background laptop image */}
              <img
                className="fw-laptop-svg"
                src={laptopSrc}
                alt=""
                aria-hidden="true"
                draggable={false}
              />
            </div>
          </div>

          <div className="fw-side">
            {/* reserves the title's final position; the real title animates onto it */}
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