import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

// A real seated silhouette (single traced path) rigged into joints.
// The one path is drawn once in <defs> and re-used through clip-paths, so every body part is
// "the silhouette, cut to a region". Only the head and the lower legs move; the arms stay put.
// All pivots are absolute coordinates in the 235 x 471 viewBox (svgOrigin).
//
// To adjust a cut line, edit CLIPS. To adjust a joint, edit PIVOTS.

interface HeroManProps {
  talking: boolean; // head bobs while true
  paused: boolean; // stop starting new random poses (e.g. while the ask overlay is open)
}

const MAN_PATH =
  'M 120.365 2.476 C 111.999 3.994, 108.331 6.387, 103.548 13.450 C 99.080 20.047, 98.167 24.039, 97.819 38.509 C 97.540 50.110, 97.619 50.637, 100.140 54.009 C 105.727 61.485, 105.729 61.446, 99.568 68.100 C 96.513 71.400, 93.739 75.190, 93.405 76.522 C 92.865 78.674, 90.720 79.614, 74.149 84.957 C 46.942 93.729, 44.289 95.859, 33.143 117.887 C 19.345 145.154, 3.327 197.271, 5.381 208.216 C 5.782 210.355, 8.469 214.931, 12.027 219.535 C 15.312 223.786, 18 227.631, 18 228.080 C 18 229.127, 27.699 240.807, 30.990 243.724 C 32.371 244.947, 37.212 247.781, 41.750 250.022 C 46.288 252.262, 50 254.677, 50 255.388 C 50 256.099, 49.096 260.215, 47.991 264.535 C 46.714 269.529, 46.217 273.684, 46.628 275.944 C 47.384 280.113, 50.777 287.077, 54.425 291.950 C 56.058 294.131, 56.787 296.096, 56.407 297.294 C 56.008 298.549, 56.691 300.112, 58.432 301.929 C 60.333 303.913, 61.343 306.441, 62.090 311.085 C 64.185 324.113, 70.321 338.545, 83.312 361 C 86.653 366.775, 90.821 373.300, 92.573 375.500 C 96.866 380.890, 99.527 386.431, 100.873 392.783 C 102.125 398.687, 103.881 402.431, 111.532 415.500 C 114.430 420.450, 117.861 426.750, 119.156 429.500 C 120.452 432.250, 122.521 434.944, 123.756 435.487 C 124.990 436.030, 126 437.060, 126 437.777 C 126 439.594, 122.383 446.492, 118.374 452.320 C 115.476 456.533, 115 458.058, 115 463.137 C 115 468.660, 115.181 469.120, 117.750 470.124 C 121.366 471.538, 143.062 470.618, 149 468.800 C 153.450 467.437, 153.503 467.369, 153.810 462.583 L 154.120 457.745 158.810 458.531 C 161.390 458.963, 166.381 459.402, 169.901 459.506 C 175.585 459.674, 176.522 459.996, 178.257 462.379 C 180.579 465.566, 184.219 467.207, 193.794 469.385 C 207.104 472.412, 219.847 471.164, 225.213 466.307 C 228.143 463.655, 227.507 458.516, 223.750 454.480 C 221.231 451.775, 219.273 450.763, 215.040 449.981 C 211.403 449.309, 208.626 448.059, 206.721 446.236 C 201.919 441.640, 195.788 433.152, 196.472 432.045 C 196.827 431.470, 199.454 430.993, 202.309 430.985 C 205.164 430.976, 208.049 430.621, 208.720 430.194 C 210.826 428.856, 212.996 415.380, 214.538 394.064 C 216.512 366.782, 218.317 354.499, 222.997 336.500 C 226.972 321.212, 228.182 310.973, 229.704 279.714 C 230.855 256.075, 225.877 248.443, 207.990 246.419 C 203.472 245.908, 202 245.352, 202 244.155 C 202 243.283, 204.249 238.672, 206.998 233.910 C 215.151 219.782, 217.373 213.047, 217.358 202.500 C 217.346 194.501, 216.785 191.720, 212.316 177.500 C 207.060 160.775, 197.631 130.346, 193.344 116.277 C 191.118 108.970, 190.254 107.519, 185.592 103.258 C 179.579 97.763, 171.339 93.123, 162.071 90.015 C 152.908 86.941, 148.247 84.355, 147.472 81.913 C 147.027 80.511, 147.914 77.374, 150.092 72.650 C 153.053 66.225, 153.513 63.951, 154.671 50.004 C 156.362 29.627, 156.597 28.494, 159.527 26.574 C 162.704 24.493, 162.648 21.961, 159.288 15.787 C 156.568 10.791, 152.335 7.220, 144.290 3.137 C 139.385 0.647, 131.620 0.433, 120.365 2.476 M 49.255 171.590 C 48.712 172.641, 47.955 175.957, 47.572 178.959 C 47.189 181.962, 46.039 186.462, 45.017 188.959 C 43.957 191.550, 42.946 197.111, 42.663 201.907 L 42.168 210.314 46.216 216.725 C 48.449 220.261, 50.647 222.753, 51.117 222.283 C 53.915 219.485, 54.868 197.668, 52.898 181.500 C 51.628 171.080, 50.751 168.694, 49.255 171.590 M 170.765 176 C 167.881 182.516, 166.709 191.027, 167.527 199.500 C 168.496 209.524, 168.365 212.856, 166.933 214.581 C 166.069 215.621, 166.298 216.747, 167.901 219.340 C 170.517 223.573, 170.537 225.204, 168 227.500 C 166.900 228.495, 166 229.643, 166 230.051 C 166 230.943, 175.915 237.419, 176.454 236.879 C 176.661 236.670, 177.732 232.900, 178.833 228.500 C 180.174 223.140, 180.813 217.365, 180.770 211 C 180.714 202.767, 180.325 200.663, 177.851 195.222 C 176.282 191.770, 174.394 185.245, 173.656 180.722 L 172.314 172.500 170.765 176 M 111.389 296.910 C 110.228 297.417, 108.995 298.571, 108.649 299.473 C 108.295 300.394, 110.258 306.900, 113.122 314.307 C 115.929 321.563, 122.258 339.875, 127.188 355 C 138.940 391.056, 138.230 389.404, 144.793 395.935 C 152.637 403.740, 157.195 413.010, 156.989 420.741 C 156.742 430.043, 156.947 433, 157.839 433 C 159.507 433, 161 427.784, 161 421.961 C 161 416.677, 161.319 415.731, 163.867 413.461 C 166.656 410.976, 166.748 410.578, 167.272 398.703 C 167.836 385.928, 169.738 377.588, 173.198 372.725 C 174.935 370.283, 175.285 367.339, 176.109 348.225 C 176.932 329.109, 177.424 324.970, 180.203 313.764 C 181.940 306.759, 183.082 300.749, 182.741 300.408 C 182.400 300.067, 178.422 300.285, 173.901 300.894 C 160.312 302.723, 149.637 302.281, 139.500 299.471 C 129.794 296.781, 114.807 295.416, 111.389 296.910';

// Cut regions (polygon points). Neighbouring regions overlap a few px so no seam shows at rest.
const CLIPS = {
  base: '-10,248 245,248 245,304 -10,304', // hips + thighs (never moves)
  legs: '-10,296 245,296 245,490 -10,490', // lower legs + shoes
  torso: '-30,76 92,76 94,72 96,58 154,58 152,78 270,78 270,250 -30,250', // chest + both arms (static)
  head: '70,-10 180,-10 180,69 70,69',
} as const;

// Joint pivots in viewBox coordinates.
const PIVOTS = {
  torso: '115 250', // hips (breathing only)
  head: '126 66', // neck
  bob: '126 66',
  legs: '118 298', // where the thighs end
  sway: '118 298',
} as const;
type Part = keyof typeof PIVOTS;

const REST = {
  head: { rotation: 0, x: 0, scaleX: 1 },
  legs: { rotation: 0 },
} as const;
type Posed = keyof typeof REST;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// one clipped copy of the silhouette
const Piece = ({ id }: { id: keyof typeof CLIPS }) => (
  <g clipPath={`url(#hm-${id})`}>
    <use href="#hm-shape" />
  </g>
);

export default function HeroMan({ talking, paused }: HeroManProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const q = (n: Part) => svg.querySelector(`[data-part="${n}"]`) as SVGGElement;
    const E = {} as Record<Part, SVGGElement>;
    (Object.keys(PIVOTS) as Part[]).forEach((k) => {
      E[k] = q(k);
      gsap.set(E[k], { svgOrigin: PIVOTS[k] });
    });
    (Object.keys(REST) as Posed[]).forEach((k) => gsap.set(E[k], REST[k]));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ---- idle: legs swing gently + breathing ----
    gsap.to(E.sway, { rotation: 1.6, duration: 2.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(E.torso, { scaleY: 1.008, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    // ---- random poses: head looking left / right, and kicking the legs ----
    const T = () => gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    const hold = (tl: gsap.core.Timeline, d: number) => tl.to({}, { duration: d });
    const toRest = (tl: gsap.core.Timeline, d = 0.7) => {
      (Object.keys(REST) as Posed[]).forEach((k, i) => tl.to(E[k], { ...REST[k], duration: d }, i === 0 ? '>' : '<'));
      return tl;
    };

    const poses: Record<string, () => gsap.core.Timeline> = {
      lookLeft: () => {
        const tl = T().to(E.head, { rotation: -6, x: -4, scaleX: 0.94, duration: 0.5 });
        return toRest(hold(tl, rand(1.3, 2.2)));
      },
      lookRight: () => {
        const tl = T().to(E.head, { rotation: 7, x: 4, scaleX: 0.94, duration: 0.5 });
        return toRest(hold(tl, rand(1.3, 2.2)));
      },
      glance: () => {
        const tl = T().to(E.head, { rotation: -6, x: -4, scaleX: 0.94, duration: 0.45 });
        hold(tl, 0.8);
        tl.to(E.head, { rotation: 7, x: 4, scaleX: 0.94, duration: 0.6 });
        return toRest(hold(tl, 0.7));
      },
      kick: () => {
        const tl = T().to(E.legs, { rotation: -6, duration: 0.4, yoyo: true, repeat: 3 });
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
      gsap.killTweensOf(Object.values(E));
    };
  }, []);

  // talking: little head bob while the bubble is typing
  useEffect(() => {
    if (!talking) return;
    const bob = svgRef.current?.querySelector('[data-part="bob"]');
    if (!bob) return;
    const tw = gsap.to(bob, { y: -2, rotation: 1.5, duration: 0.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    return () => {
      tw.kill();
      gsap.to(bob, { y: 0, rotation: 0, duration: 0.25 });
    };
  }, [talking]);

  return (
    <svg
      ref={svgRef}
      className="hero__man-svg"
      viewBox="0 0 235 471"
      aria-hidden="true"
      focusable="false"
      style={{ transform: 'scaleX(-1)' }}
    >
      <defs>
        <path id="hm-shape" fillRule="evenodd" d={MAN_PATH} />
        {(Object.keys(CLIPS) as (keyof typeof CLIPS)[]).map((k) => (
          <clipPath key={k} id={`hm-${k}`}>
            <polygon points={CLIPS[k]} />
          </clipPath>
        ))}
      </defs>

      <g fill="currentColor">
        <Piece id="base" />

        <g data-part="sway">
          <g data-part="legs">
            <Piece id="legs" />
          </g>
        </g>

        <g data-part="torso">
          <Piece id="torso" />

          <g data-part="bob">
            <g data-part="head">
              <Piece id="head" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}