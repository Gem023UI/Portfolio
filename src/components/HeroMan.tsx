import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// A seated silhouette. Every joint is a <g data-part> sitting inside a static
// <g transform="translate(pivot)">, so each part rotates around its own (0,0).

interface HeroManProps {
  talking: boolean; // head bobs while true
  paused: boolean; // stop starting new random poses (e.g. while the ask overlay is open)
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const REST = {
  torso: { rotation: 0 },
  head: { rotation: 0 },
  face: { scaleX: 1 },
  nearUp: { rotation: -4 },
  nearFore: { rotation: -55 },
  farUp: { rotation: 10 },
  farFore: { rotation: -15 },
  shinNear: { rotation: 0 },
  shinFar: { rotation: 0 },
} as const;
type Part = keyof typeof REST;

export default function HeroMan({ talking, paused }: HeroManProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const q = (n: string) => svg.querySelector(`[data-part="${n}"]`) as SVGGElement;
    const P = {
      torso: q('torso'),
      head: q('head'),
      face: q('face'),
      nearUp: q('nearUp'),
      nearFore: q('nearFore'),
      farUp: q('farUp'),
      farFore: q('farFore'),
      shinNear: q('shinNear'),
      shinFar: q('shinFar'),
    };
    const extras = [q('swayNear'), q('swayFar'), q('bob')];

    gsap.set([...Object.values(P), ...extras], { svgOrigin: '0 0' });
    (Object.keys(REST) as Part[]).forEach((k) => gsap.set(P[k], REST[k]));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ---- idle: gently swinging legs + breathing ----
    gsap.to(extras[0], { rotation: 7, duration: 1.9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(extras[1], { rotation: -5, duration: 2.3, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.6 });
    gsap.to(P.torso, { scaleY: 1.012, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    // ---- random poses ----
    const T = () => gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    const hold = (tl: gsap.core.Timeline, d: number) => tl.to({}, { duration: d });
    const toRest = (tl: gsap.core.Timeline, d = 0.7) => {
      (Object.keys(REST) as Part[]).forEach((k, i) => tl.to(P[k], { ...REST[k], duration: d }, i === 0 ? '>' : '<'));
      return tl;
    };

    const poses: Record<string, () => gsap.core.Timeline> = {
      lookLeft: () => {
        const tl = T().to(P.face, { scaleX: -1, duration: 0.45 }).to(P.head, { rotation: -4, duration: 0.4 }, '<');
        return toRest(hold(tl, rand(1.3, 2.2)));
      },
      lookRight: () => {
        const tl = T().to(P.head, { rotation: 8, duration: 0.5 }).to(P.torso, { rotation: 3, duration: 0.5 }, '<');
        return toRest(hold(tl, rand(1.3, 2.2)));
      },
      glance: () => {
        const tl = T().to(P.face, { scaleX: -1, duration: 0.4 });
        hold(tl, 0.8);
        tl.to(P.face, { scaleX: 1, duration: 0.4 }).to(P.head, { rotation: 7, duration: 0.4 }, '<');
        return toRest(hold(tl, 0.7));
      },
      lookUp: () => {
        const tl = T().to(P.head, { rotation: -16, duration: 0.7 }).to(P.torso, { rotation: -4, duration: 0.7 }, '<');
        return toRest(hold(tl, rand(1.6, 2.4)));
      },
      leanBack: () => {
        const tl = T()
          .to(P.torso, { rotation: -13, duration: 0.9 })
          .to(P.farUp, { rotation: 38, duration: 0.9 }, '<')
          .to(P.farFore, { rotation: 0, duration: 0.9 }, '<')
          .to(P.nearUp, { rotation: 28, duration: 0.9 }, '<')
          .to(P.nearFore, { rotation: -8, duration: 0.9 }, '<')
          .to(P.head, { rotation: -7, duration: 0.9 }, '<');
        return toRest(hold(tl, rand(1.8, 2.8)), 0.9);
      },
      stretch: () => {
        const tl = T()
          .to(P.torso, { rotation: -5, duration: 0.8 })
          .to(P.nearUp, { rotation: -172, duration: 0.8 }, '<')
          .to(P.nearFore, { rotation: -4, duration: 0.8 }, '<')
          .to(P.farUp, { rotation: -158, duration: 0.8 }, '<')
          .to(P.farFore, { rotation: 6, duration: 0.8 }, '<')
          .to(P.head, { rotation: -9, duration: 0.8 }, '<');
        tl.to(P.torso, { rotation: -8, duration: 0.5, yoyo: true, repeat: 1 });
        return toRest(hold(tl, 0.6), 0.9);
      },
      scratch: () => {
        const tl = T()
          .to(P.nearUp, { rotation: -170, duration: 0.7 })
          .to(P.nearFore, { rotation: -63, duration: 0.7 }, '<')
          .to(P.head, { rotation: 3, duration: 0.7 }, '<');
        tl.to(P.nearFore, { rotation: -52, duration: 0.16, yoyo: true, repeat: 7 });
        return toRest(hold(tl, 0.2));
      },
      wave: () => {
        const tl = T()
          .to(P.nearUp, { rotation: -150, duration: 0.6 })
          .to(P.nearFore, { rotation: -35, duration: 0.6 }, '<')
          .to(P.head, { rotation: 5, duration: 0.6 }, '<');
        tl.to(P.nearFore, { rotation: 25, duration: 0.22, yoyo: true, repeat: 5 });
        return toRest(hold(tl, 0.2));
      },
      kick: () => {
        const tl = T()
          .to(P.shinNear, { rotation: -24, duration: 0.35, yoyo: true, repeat: 3 })
          .to(P.shinFar, { rotation: -16, duration: 0.35, yoyo: true, repeat: 3 }, '<0.15');
        return toRest(tl, 0.4);
      },
    };

    let call: gsap.core.Tween | null = null;
    let current: gsap.core.Timeline | null = null;
    let last = '';
    const next = () => {
      if (pausedRef.current || document.hidden) {
        call = gsap.delayedCall(0.6, next);
        return;
      }
      const names = Object.keys(poses).filter((n) => n !== last);
      last = names[Math.floor(Math.random() * names.length)];
      current = poses[last]();
      current.eventCallback('onComplete', () => {
        call = gsap.delayedCall(rand(1.5, 3.5), next);
      });
    };
    call = gsap.delayedCall(2.2, next);

    return () => {
      call?.kill();
      current?.kill();
      gsap.killTweensOf([...Object.values(P), ...extras]);
    };
  }, []);

  // talking: little head bob while the bubble is typing
  useEffect(() => {
    if (!talking) return;
    const bob = svgRef.current?.querySelector('[data-part="bob"]');
    if (!bob) return;
    const tw = gsap.to(bob, { y: -1.6, rotation: 2, duration: 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return () => {
      tw.kill();
      gsap.to(bob, { y: 0, rotation: 0, duration: 0.25 });
    };
  }, [talking]);

  return (
    <svg ref={svgRef} className="hero__man-svg" viewBox="0 0 120 170" aria-hidden="true" focusable="false">
      <g fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* far leg */}
        <path d="M40 93 L77 95" strokeWidth="11" fill="none" />
        <g transform="translate(77 95)">
          <g data-part="swayFar">
            <g data-part="shinFar">
              <path d="M0 0 L-1 50" strokeWidth="9" fill="none" />
              <path d="M-6 49 L9 51 Q13 55 9 58 L-7 58 Z" strokeWidth="2" />
            </g>
          </g>
        </g>

        {/* near leg */}
        <path d="M44 96 L84 98" strokeWidth="13" fill="none" />
        <g transform="translate(84 98)">
          <g data-part="swayNear">
            <g data-part="shinNear">
              <path d="M0 0 L1 51" strokeWidth="11" fill="none" />
              <path d="M-5 50 L12 52 Q16 57 11 60 L-6 60 Z" strokeWidth="2" />
            </g>
          </g>
        </g>

        {/* torso (pivot = hips) */}
        <g transform="translate(46 98)">
          <g data-part="torso">
            <path d="M-13 -50 Q3 -59 18 -51 Q21 -26 13 2 L-11 2 Q-15 -26 -13 -50 Z" stroke="none" />
            <rect x="-12" y="-6" width="30" height="12" rx="6" stroke="none" />

            {/* far arm */}
            <g transform="translate(-7 -46)">
              <g data-part="farUp">
                <path d="M0 0 L0 24" strokeWidth="6.5" fill="none" />
                <g transform="translate(0 24)">
                  <g data-part="farFore">
                    <path d="M0 0 L0 21" strokeWidth="5.5" fill="none" />
                    <circle cx="0" cy="22" r="3.4" stroke="none" />
                  </g>
                </g>
              </g>
            </g>

            {/* head (pivot = neck) */}
            <g transform="translate(3 -53)">
              <g data-part="bob">
                <g data-part="head">
                  <g data-part="face">
                    <rect x="-3.5" y="-8" width="7" height="11" rx="3" stroke="none" />
                    <ellipse cx="1.5" cy="-18.5" rx="9.5" ry="11.5" stroke="none" />
                    <path d="M10 -20 L15.5 -15 L10 -14 Z" stroke="none" />
                  </g>
                </g>
              </g>
            </g>

            {/* near arm */}
            <g transform="translate(11 -45)">
              <g data-part="nearUp">
                <path d="M0 0 L0 24" strokeWidth="7.5" fill="none" />
                <g transform="translate(0 24)">
                  <g data-part="nearFore">
                    <path d="M0 0 L0 21" strokeWidth="6.5" fill="none" />
                    <circle cx="0" cy="22" r="3.8" stroke="none" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}