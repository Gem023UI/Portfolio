import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import FoldText from "../components/FoldText";
import ProjectFolders from "../components/ProjectFolders";
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

  return (
    <main className="home">
      <section className="hero" ref={heroRef}>
        <div className="hero__stage" ref={stageRef}>
          <div className="hero__text">
            <div className="hero__greeting">Hi! My name is</div>

            <div className="hero__bigtext" ref={bigTextRef} aria-hidden="true">
                <div className="hero__bigtext-inner" ref={bigTextInnerRef}>
                <FoldText
                    text="JEMUEL"
                    splitBy="char"
                    hinge="top"
                    trigger="mount"
                    duration={1.85}
                    stagger={0.045}
                    ease="power3.out"
                    perspective={500}
                    creaseShading={0.55}
                    fontSize={170}
                    fontWeight={550}
                    color="#6442df"
                />
                </div>
            </div>

            <div className="hero__surname">MALAGA</div>
          </div>

          {/* Parallax */}
          <div className="hero__photo" ref={photoRef}>
            <img src={HERO_IMAGE} alt="Jemuel Malaga" draggable={false} />

            <div
              className="hero__anchor hero__anchor--product-design"
              ref={(el) => {
                anchorRefs.current.productDesign = el;
              }}
            />
            <div
              className="hero__anchor hero__anchor--full-stack"
              ref={(el) => {
                anchorRefs.current.fullStack = el;
              }}
            />
            <div
              className="hero__anchor hero__anchor--ai-ml"
              ref={(el) => {
                anchorRefs.current.aiMl = el;
              }}
            />
            <div
              className="hero__anchor hero__anchor--ui-ux"
              ref={(el) => {
                anchorRefs.current.uiUx = el;
              }}
            />
          </div>

          <svg className="hero__lines" ref={linesSvgRef} aria-hidden="true">
            <line
              ref={(el) => {
                lineRefs.current.productDesign = el;
              }}
            />
            <line
              ref={(el) => {
                lineRefs.current.fullStack = el;
              }}
            />
            <line
              ref={(el) => {
                lineRefs.current.aiMl = el;
              }}
            />
            <line
              ref={(el) => {
                lineRefs.current.uiUx = el;
              }}
            />
          </svg>

          {/* Parallax */}
          <div
            className="hero__tag hero__tag--product-design"
            ref={(el) => {
              tagRefs.current.productDesign = el;
            }}
          >
            PRODUCT DESIGN
          </div>
          <div
            className="hero__tag hero__tag--full-stack"
            ref={(el) => {
              tagRefs.current.fullStack = el;
            }}
          >
            FULL STACK
          </div>
          <div
            className="hero__tag hero__tag--ai-ml"
            ref={(el) => {
              tagRefs.current.aiMl = el;
            }}
          >
            AI / ML
          </div>
          <div
            className="hero__tag hero__tag--ui-ux"
            ref={(el) => {
              tagRefs.current.uiUx = el;
            }}
          >
            UI / UX
          </div>

          {/* Parallax */}
          <div className="hero__role" ref={roleRef}>
            FRONT END DEVELOPER&nbsp;&nbsp;|&nbsp;&nbsp;UI/UX DESIGN
          </div>
        </div>
      </section>

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
        <h2 className="projects__heading">PROJECTS</h2>
      </section>

      <ProjectFolders />
    </main>
  );
}

export default Home;