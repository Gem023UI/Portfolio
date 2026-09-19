import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import FoldText from "../components/FoldText";
import ProjectFolders from "../components/ProjectFolders";
import TextLoop from "../components/TextLoop";
import GithubContributions from "../components/Github";
import Lanyard from "../components/Lanyard";
import "../styles/Home.css";

const HERO_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789182469/2e4c2c05-beaf-459c-a455-81f05e2012cf.png";
const LAPTOP_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789194662/53d5ae24-94e5-4fb1-a683-f662978abc13.png";
const PEN_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789195779/d8890c4e-afc7-44dc-8381-7d779c24f009.png";
const PAPER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789199117/615dc822-98de-47d7-a84b-3c3cc2ed3b33.png";

type TagKey = "productDesign" | "fullStack" | "aiMl" | "uiUx";
const TAG_ORDER: TagKey[] = ["productDesign", "fullStack", "aiMl", "uiUx"];

const TAG_DEPTH: Record<TagKey, number> = {
  productDesign: 26,
  fullStack: 30,
  aiMl: 28,
  uiUx: 24,
};
const PHOTO_DEPTH = 22;
const ROLE_DEPTH = 8;

const CERTIFICATIONS: CertificationItem[] = [
  {
    id: "cert-1",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789538316/d4464715-9de5-41b1-aa6b-1c1be5b4375b.png",
    alt: "Certification 1",
    link: "#",
  },
  {
    id: "cert-2",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789538357/dc05adea-2d4f-43a0-9545-fec929ba6bb1.png",
    alt: "Certification 2",
    link: "#",
  },
  {
    id: "cert-3",
    image: "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789538471/0da6767e-0f8f-4c7e-afca-655547edff92.png",
    alt: "Certification 3",
    link: "#",
  },
];

interface CertificationItem {
  id: string;
  image: string;
  alt: string;
  link: string;
}

function CascadeWord({ word, echoCount = 5 }: { word: string; echoCount?: number }) {
  return (
    <span className="hero-cascade" aria-label={word}>
      <span className="hero-cascade__base">{word}</span>
      {Array.from({ length: echoCount }).map((_, i) => (
        <span
          key={i}
          className="hero-cascade__echo"
          aria-hidden="true"
          style={{ opacity: 0.32 - i * 0.05, top: `${(i + 1) * 0.85}em` }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

type SlideAxis = "x" | "y";
interface TileSlideConfig {
  axis: SlideAxis;
  from: number;
}

const TILE_SLIDE: Record<number, TileSlideConfig> = {
  1: { axis: "x", from: 100 },
  2: { axis: "y", from: 100 },
  3: { axis: "x", from: -100 },
  4: { axis: "y", from: -100 },
  5: { axis: "y", from: -100 },
  6: { axis: "x", from: -100 },
  7: { axis: "y", from: 100 },
  8: { axis: "x", from: 100 },
};

// Grid geometry: 4 columns × 2 rows, all percentages relative to .hero-tiles__grid
const CELL_W = 25;
const CELL_H = 50;

type Rect = { left: number; top: number };

// Path each traveling clone hops through, one grid cell at a time.
// cloneA: tile1 -> tile5 -> tile6 -> tile2 (ends exactly in tile2's cell)
const CLONE_A_PATH: Rect[] = [
  { left: 0, top: 0 },
  { left: 0, top: 50 },
  { left: 25, top: 50 },
  { left: 25, top: 0 },
];

// cloneB: tile8 -> tile4 -> tile3 -> tile7 (ends exactly in tile7's cell)
const CLONE_B_PATH: Rect[] = [
  { left: 75, top: 50 },
  { left: 75, top: 0 },
  { left: 50, top: 0 },
  { left: 50, top: 50 },
];

const HERO_TRANSITION_SCROLL_VH = 320;

// Renders one hop: collapses the clone toward the shared edge between `from`
// and `to`, then expands it back out from that same edge into the next cell.
function applyFoldHop(el: HTMLElement, from: Rect, to: Rect, t: number) {
  const vertical = from.left === to.left;
  const collapsing = t < 0.5;
  const local = collapsing ? t / 0.5 : (t - 0.5) / 0.5;
  const rect = collapsing ? from : to;

  el.style.left = `${rect.left}%`;
  el.style.top = `${rect.top}%`;
  el.style.width = `${CELL_W}%`;
  el.style.height = `${CELL_H}%`;

  if (vertical) {
    const movingDown = to.top > from.top;
    const origin = collapsing
      ? movingDown ? '50% 100%' : '50% 0%'
      : movingDown ? '50% 0%' : '50% 100%';
    el.style.transformOrigin = origin;
    el.style.transform = `scaleY(${collapsing ? 1 - local : local})`;
  } else {
    const movingRight = to.left > from.left;
    const origin = collapsing
      ? movingRight ? '100% 50%' : '0% 50%'
      : movingRight ? '0% 50%' : '100% 50%';
    el.style.transformOrigin = origin;
    el.style.transform = `scaleX(${collapsing ? 1 - local : local})`;
  }
}

function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const bigTextRef = useRef<HTMLDivElement | null>(null);
  const bigTextInnerRef = useRef<HTMLDivElement | null>(null);

  const photoRef = useRef<HTMLDivElement | null>(null);
  const roleRef = useRef<HTMLDivElement | null>(null);

  const aboutRef = useRef<HTMLElement | null>(null);
  const paperMouseRef = useRef<HTMLDivElement | null>(null);
  const penMouseRef = useRef<HTMLDivElement | null>(null);
  const laptopMouseRef = useRef<HTMLDivElement | null>(null);

  const tagRefs = useRef<Record<TagKey, HTMLDivElement | null>>({
    productDesign: null,
    fullStack: null,
    aiMl: null,
    uiUx: null,
  });
  const anchorRefs = useRef<Record<TagKey, HTMLDivElement | null>>({
    productDesign: null,
    fullStack: null,
    aiMl: null,
    uiUx: null,
  });
  const lineRefs = useRef<Record<TagKey, SVGLineElement | null>>({
    productDesign: null,
    fullStack: null,
    aiMl: null,
    uiUx: null,
  });

  const linesSvgRef = useRef<SVGSVGElement | null>(null);

  // ---- Parallax: cursor-follow motion for photo, tags, role only ----
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const makeSetter = (el: HTMLElement | null) =>
      el
        ? {
            x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
          }
        : null;

    const photoSetter = makeSetter(photoRef.current);
    const roleSetter = makeSetter(roleRef.current);
    const tagSetters = TAG_ORDER.map((key) => ({
      key,
      setter: makeSetter(tagRefs.current[key]),
    }));

    const handlePointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;

      photoSetter?.x(relX * PHOTO_DEPTH);
      photoSetter?.y(relY * PHOTO_DEPTH);

      roleSetter?.x(relX * ROLE_DEPTH);
      roleSetter?.y(relY * ROLE_DEPTH * 0.6);

      tagSetters.forEach(({ key, setter }) => {
        const depth = TAG_DEPTH[key];
        setter?.x(relX * depth);
        setter?.y(relY * depth);
      });
    };

    const resetParallax = () => {
      photoSetter?.x(0);
      photoSetter?.y(0);
      roleSetter?.x(0);
      roleSetter?.y(0);
      tagSetters.forEach(({ setter }) => {
        setter?.x(0);
        setter?.y(0);
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerleave", resetParallax);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetParallax);
    };
  }, []);

  // ---- Connector lines: always recomputed from real element positions ----
  useEffect(() => {
    const stage = stageRef.current;
    const svg = linesSvgRef.current;
    if (!stage || !svg) return;

    const updateLines = () => {
      const stageRect = stage.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height) return;

      svg.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);

      TAG_ORDER.forEach((key) => {
        const tagEl = tagRefs.current[key];
        const anchorEl = anchorRefs.current[key];
        const lineEl = lineRefs.current[key];
        if (!tagEl || !anchorEl || !lineEl) return;

        const tagRect = tagEl.getBoundingClientRect();
        const anchorRect = anchorEl.getBoundingClientRect();

        const tagX = tagRect.left + tagRect.width / 2 - stageRect.left;
        const tagY = tagRect.top + tagRect.height / 2 - stageRect.top;
        const anchorX = anchorRect.left + anchorRect.width / 2 - stageRect.left;
        const anchorY = anchorRect.top + anchorRect.height / 2 - stageRect.top;

        lineEl.setAttribute("x1", String(tagX));
        lineEl.setAttribute("y1", String(tagY));
        lineEl.setAttribute("x2", String(anchorX));
        lineEl.setAttribute("y2", String(anchorY));
      });
    };

    updateLines();

    const resizeObserver = new ResizeObserver(updateLines);
    resizeObserver.observe(stage);

    // Runs every animation frame so lines stay attached while parallax animates
    gsap.ticker.add(updateLines);

    return () => {
      resizeObserver.disconnect();
      gsap.ticker.remove(updateLines);
    };
  }, []);

  // ---- Fit the FoldText "JEMUEL" to span the stage width, no parallax ----
  useEffect(() => {
    const stage = stageRef.current;
    const inner = bigTextInnerRef.current;
    if (!stage || !inner) return;

    const fitText = () => {
      const stageWidth = stage.getBoundingClientRect().width;
      if (!stageWidth) return;

      inner.style.transform = "scale(1)";
      const naturalWidth = inner.scrollWidth;
      if (!naturalWidth) return;

      const targetWidth = stageWidth * 0.94;
      const scale = targetWidth / naturalWidth;
      inner.style.transform = `scale(${scale})`;
    };

    fitText();
    const resizeObserver = new ResizeObserver(fitText);
    resizeObserver.observe(stage);

    // Re-fit shortly after mount in case the font/FoldText layout settles late
    const timeout = window.setTimeout(fitText, 300);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  // ---- About section mouse parallax: paper, pen, laptop ----
  useEffect(() => {
  const about = aboutRef.current;
  if (!about) return;

  const makeSetter = (el: HTMLElement | null) =>
    el
      ? {
          x: gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" }),
        }
      : null;

  const paperSetter = makeSetter(paperMouseRef.current);
  const penSetter = makeSetter(penMouseRef.current);
  const laptopSetter = makeSetter(laptopMouseRef.current);

  const PAPER_DEPTH = 14;
  const PEN_DEPTH = 26;
  const LAPTOP_DEPTH = 18;

  const handlePointerMove = (event: PointerEvent) => {
    const rect = about.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    paperSetter?.x(relX * -PAPER_DEPTH);
    paperSetter?.y(relY * -PAPER_DEPTH);

    penSetter?.x(relX * PEN_DEPTH);
    penSetter?.y(relY * PEN_DEPTH);

    laptopSetter?.x(relX * -LAPTOP_DEPTH);
    laptopSetter?.y(relY * -LAPTOP_DEPTH);
  };

  const resetParallax = () => {
    paperSetter?.x(0);
    paperSetter?.y(0);
    penSetter?.x(0);
    penSetter?.y(0);
    laptopSetter?.x(0);
    laptopSetter?.y(0);
  };

  window.addEventListener("pointermove", handlePointerMove);
  about.addEventListener("pointerleave", resetParallax);

  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    about.removeEventListener("pointerleave", resetParallax);
  };
  }, []);

  const heroTileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [tileDelays] = useState<number[]>(() => Array.from({ length: 8 }, () => Math.random() * 3));

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    heroTileRefs.current.forEach((el, idx) => {
      if (!el) return;
      const config = TILE_SLIDE[idx + 1];
      if (!config) return;

      if (config.axis === "x") {
        gsap.set(el, { xPercent: config.from });
      } else {
        gsap.set(el, { yPercent: config.from });
      }

      const tween =
        config.axis === "x"
          ? gsap.to(el, { xPercent: 0, duration: 1, delay: tileDelays[idx], ease: "power4.out" })
          : gsap.to(el, { yPercent: 0, duration: 1, delay: tileDelays[idx], ease: "power4.out" });

      cleanups.push(() => tween.kill());
    });

    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTileHover = (idx: number) => {
    const el = heroTileRefs.current[idx];
    const config = TILE_SLIDE[idx + 1];
    if (!el || !config) return;

    gsap.killTweensOf(el);
    const tl = gsap.timeline();
    if (config.axis === "x") {
      tl.to(el, { xPercent: config.from, duration: 0.35, ease: "power2.in" }).to(el, {
        xPercent: 0,
        duration: 0.7,
        ease: "power4.out",
      });
    } else {
      tl.to(el, { yPercent: config.from, duration: 0.35, ease: "power2.in" }).to(el, {
        yPercent: 0,
        duration: 0.7,
        ease: "power4.out",
      });
    }
  };

  const heroTransitionRef = useRef<HTMLDivElement | null>(null);
  const cloneARef = useRef<HTMLDivElement | null>(null);
  const cloneBRef = useRef<HTMLDivElement | null>(null);
  const lanyardWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = heroTransitionRef.current;
    const cloneA = cloneARef.current;
    const cloneB = cloneBRef.current;
    if (!section || !cloneA || !cloneB) return;

    let frame = 0;
    const HIDE_IMMEDIATELY = [0, 2, 3, 4, 5, 7]; // tile1,3,4,5,6,8 (0-indexed)
    const HIDE_AT_STAGE3 = [1, 6]; // tile2, tile7

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const p = scrollable > 0 ? Math.min(Math.max(scrolled / scrollable, 0), 1) : 0;

      const raw = p * 4;
      const stage = Math.min(Math.floor(raw), 3);
      const localT = Math.min(Math.max(raw - stage, 0), 1);

      heroTileRefs.current.forEach((el, idx) => {
        if (!el) return;
        if (HIDE_IMMEDIATELY.includes(idx)) {
          el.style.opacity = p > 0.0001 ? '0' : '1';
        } else if (HIDE_AT_STAGE3.includes(idx)) {
          el.style.opacity = p >= 0.75 - 0.0001 ? '0' : '1';
        }
      });

      if (lanyardWrapRef.current) {
        const fade = Math.min(Math.max(p / 0.2, 0), 1);
        lanyardWrapRef.current.style.opacity = String(1 - fade);
      }

      const showClones = p > 0.0001 && p < 1;
      cloneA.style.opacity = showClones ? '1' : '0';
      cloneB.style.opacity = showClones ? '1' : '0';

      if (stage < 3) {
        applyFoldHop(cloneA, CLONE_A_PATH[stage], CLONE_A_PATH[stage + 1], localT);
        applyFoldHop(cloneB, CLONE_B_PATH[stage], CLONE_B_PATH[stage + 1], localT);
      } else {
        const endA = CLONE_A_PATH[3];
        const endB = CLONE_B_PATH[3];

        cloneA.style.left = `${endA.left}%`;
        cloneA.style.top = `${endA.top}%`;
        cloneA.style.width = `${CELL_W}%`;
        cloneA.style.height = `${CELL_H}%`;
        cloneA.style.transformOrigin = '50% 50%';
        cloneA.style.transform = `translateX(${-100 * localT}vw)`;

        cloneB.style.left = `${endB.left}%`;
        cloneB.style.top = `${endB.top}%`;
        cloneB.style.width = `${CELL_W}%`;
        cloneB.style.height = `${CELL_H}%`;
        cloneB.style.transformOrigin = '50% 50%';
        cloneB.style.transform = `translateX(${100 * localT}vw)`;
      }

      frame = requestAnimationFrame(update);
    };

    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="home">
      <div
        className="hero-transition"
        ref={heroTransitionRef}
        style={{ height: `${HERO_TRANSITION_SCROLL_VH}vh` }}
      >

      <section className="hero-tiles">
        <div className="hero-tiles__lanyard" ref={lanyardWrapRef}>
          <Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
        </div>

        <div className="hero-tiles__grid">
          <div className="hero-tile hero-tile--1" onMouseEnter={() => handleTileHover(0)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[0] = el; }}>
              <img src="/tileone.png" alt="" className="hero-tile__img" draggable={false} />
            </div>
          </div>

          <div className="hero-tile hero-tile--2" onMouseEnter={() => handleTileHover(1)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[1] = el; }}>
              <img src="/tiletwo.png" alt="" className="hero-tile__img" draggable={false} />
            </div>
          </div>

          <div className="hero-tile hero-tile--3 hero-tile--text" onMouseEnter={() => handleTileHover(2)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[2] = el; }}>
              <div className="hero-tile__textblock">
                <span className="hero-word hero-word--full">FULL</span>
                <CascadeWord word=" STACK DEVELOPER" />
              </div>
            </div>
          </div>

          <div className="hero-tile hero-tile--4" onMouseEnter={() => handleTileHover(3)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[3] = el; }}>
              <img src="/tilefour.png" alt="" className="hero-tile__img" draggable={false} />
              <div className="hero-tile__overlay">
                <div className="hero-tile__certs-title">CERTI</div>
                <div className="hero-tile__certs-title">FICATIONS</div>
                <p className="hero-tile__certs-sub">
                  Hard Skills &amp;<br />Tech Ventures
                </p>
              </div>
            </div>
          </div>

          <div className="hero-tile hero-tile--5" onMouseEnter={() => handleTileHover(4)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[4] = el; }}>
              <img src="/tilefive.png" alt="" className="hero-tile__img" draggable={false} />
              <div className="hero-tile__overlay hero-tile__overlay--projects">
                <p className="hero-tile__line hero-tile__line--left">
                  Web &amp; Mobile<br />Applications
                </p>
                <p className="hero-tile__line hero-tile__line--right">
                  Logos and Brand<br />Design
                </p>
                <div className="hero-tile__projects-title">PROJECTS</div>
              </div>
            </div>
          </div>

          <div className="hero-tile hero-tile--6 hero-tile--text" onMouseEnter={() => handleTileHover(5)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[5] = el; }}>
              <div className="hero-tile__textblock">
                <span className="hero-word hero-word--brand">BRAND</span>
                <CascadeWord word="PRODUCT DESIGN" />
              </div>
            </div>
          </div>

          <div className="hero-tile hero-tile--7" onMouseEnter={() => handleTileHover(6)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[6] = el; }}>
              <img src="/tileseven.png" alt="" className="hero-tile__img" draggable={false} />
            </div>
          </div>

          <div className="hero-tile hero-tile--8" onMouseEnter={() => handleTileHover(7)}>
            <div className="hero-tile__inner" ref={(el) => { heroTileRefs.current[7] = el; }}>
              <img src="/tileeight.png" alt="" className="hero-tile__img" draggable={false} />
            </div>
          </div>

          <div className="hero-fold-clone" ref={cloneARef}>
            <img src="/tileone.png" alt="" className="hero-fold-clone__img" draggable={false} />
          </div>
          <div className="hero-fold-clone" ref={cloneBRef}>
            <img src="/tileeight.png" alt="" className="hero-fold-clone__img" draggable={false} />
          </div>
        </div>
      </section>
      </div>

      <section className="about" ref={aboutRef}>
        <div className="about__stage">
            <div className="about__paper" ref={paperMouseRef}>
            <img src={PAPER_IMAGE} alt="" draggable={false} />
            </div>

            <div className="about__pen" ref={penMouseRef}>
            <img src={PEN_IMAGE} alt="" draggable={false} />
            </div>

            <div className="about__laptop" ref={laptopMouseRef}>
            <img src={LAPTOP_IMAGE} alt="" draggable={false} />
            </div>

            <div className="about__text">
            <p>
                Aspires and takes into practice the desire to materialize my ideas, bridging the gap
                between{" "}
                <span className="about__highlight about__highlight--purple">
                real-world problems
                </span>{" "}
                and{" "}
                <span className="about__highlight about__highlight--green">
                aesthetic, functional tech solutions.
                </span>
            </p>
            <p>
                Right now I&apos;m focused on learning hard skills via{" "}
                <span className="about__highlight about__highlight--purple">certifications</span>{" "}
                and establishing meaningful connections with the{" "}
                <span className="about__highlight about__highlight--green">professionals</span> I
                aim to become.
            </p>
            <div className="about__links">
                <a
                href="https://www.linkedin.com/in/jemuel-malaga-870740287"
                target="_blank"
                rel="noopener noreferrer"
                >
                LinkedIn
                </a>
                <a href="https://github.com/Gem023UI" target="_blank" rel="noopener noreferrer">
                Github
                </a>
                <a
                href="https://www.instagram.com/chase.jml/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                >
                Instagram
                </a>
                <a
                href="https://www.facebook.com/jemuel.malaga.023/"
                target="_blank"
                rel="noopener noreferrer"
                >
                Facebook
                </a>
            </div>
            </div>
        </div>
      </section>

      <section className="projects-heading-wrap">
        <h2 className="projects__heading">
          <FoldText
            text="PROJECTS"
            splitBy="char"
            hinge="bottom"
            trigger="hover"
            duration={0.65}
            stagger={0.045}
            ease="power3.out"
            perspective={700}
            creaseShading={0.55}
            fontSize={100}
            fontWeight={500}
            color="#734dff"
          />
        </h2>

        <ProjectFolders />
      </section>

      <section className="certifications">
        <div className="certifications__loop">
          <TextLoop
            text="Certifications"
            shape="wave"
            speed={70}
            separator="✦"
            curviness={25}
            fontSize={20}
            fontWeight={800}
            letterSpacing={2}
            color="#ffffff"
            ribbon
            ribbonColor="#5b2eff"
            ribbonWidth={50}
            pauseOnHover={false}
          />
        </div>

        <div className="certifications__panel">
          <div className="certifications__cards">
            {CERTIFICATIONS.map((cert) => (
              <a
                key={cert.id}
                href={cert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="certifications__card"
              >
                <img src={cert.image} alt={cert.alt} draggable={false} />
              </a>
            ))}
          </div>
        </div>

        <a href="/certifications" className="certifications__all-link">
          All Certifications  ↗
        </a>
      </section>

      <GithubContributions />
    </main>
  );
}

export default Home;