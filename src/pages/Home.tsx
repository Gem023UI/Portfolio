import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import FoldText from "../components/FoldText";
import "../styles/Home.css";

const HERO_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1789182469/2e4c2c05-beaf-459c-a455-81f05e2012cf.png";

// Parallax "depth" for each layer — bigger number = moves more.
const DEPTH = {
  greeting: 12,
  bigText: 10,
  photo: 22,
  surname: 16,
  role: 8,
  tags: [26, 30, 28, 24], // product-design, full-stack, ai/ml, ui/ux
};

function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const greetingRef = useRef<HTMLDivElement | null>(null);
  const bigTextRef = useRef<HTMLDivElement | null>(null);
  const photoRef = useRef<HTMLDivElement | null>(null);
  const surnameRef = useRef<HTMLDivElement | null>(null);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const tagRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

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

    const setters = {
      photo: makeSetter(photoRef.current),
      role: makeSetter(roleRef.current),
      tags: tagRefs.current.map((el) => makeSetter(el)),
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
      const relY = (event.clientY - rect.top) / rect.height - 0.5;

      // background text drifts opposite to the cursor for depth
      setters.photo?.x(relX * DEPTH.photo);
      setters.photo?.y(relY * DEPTH.photo);

      setters.role?.x(relX * DEPTH.role);
      setters.role?.y(relY * DEPTH.role * 0.6);

      setters.tags.forEach((setter, i) => {
        const depth = DEPTH.tags[i] ?? 26;
        setter?.x(relX * depth);
        setter?.y(relY * depth);
      });
    };

    const resetParallax = () => {
      [setters.photo, setters.role, ...setters.tags].forEach(
        (setter) => {
          setter?.x(0);
          setter?.y(0);
        }
      );
    };

    window.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerleave", resetParallax);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetParallax);
    };
  }, []);

  const setTagRef = (index: number) => (el: HTMLDivElement | null) => {
    tagRefs.current[index] = el;
  };

  return (
    <main className="home">
      <section className="hero" ref={heroRef}>
        <div className="hero__stage">
          <div className="hero__greeting" ref={greetingRef}>
            Hi! My name is
          </div>

          <div className="hero__bigtext" ref={bigTextRef} aria-hidden="true">
            <FoldText
              text="JEMUEL"
              splitBy="char"
              hinge="top"
              trigger="mount"
              duration={0.85}
              stagger={0.045}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize={140}
              fontWeight={800}
              color="#5b2eff"
            />
          </div>

          <div className="hero__photo" ref={photoRef}>
            <img src={HERO_IMAGE} alt="Jemuel Malaga" draggable={false} />
          </div>

          <div className="hero__surname" ref={surnameRef}>
            Malaga
          </div>

          <svg
            className="hero__lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="26" y1="40" x2="44" y2="54" />
            <line x1="64" y1="29" x2="54" y2="34" />
            <line x1="76" y1="50" x2="60" y2="55" />
            <line x1="30" y1="69" x2="44" y2="62" />
          </svg>

          <div className="hero__tag hero__tag--product-design" ref={setTagRef(0)}>
            PRODUCT DESIGN
          </div>
          <div className="hero__tag hero__tag--full-stack" ref={setTagRef(1)}>
            FULL STACK
          </div>
          <div className="hero__tag hero__tag--ai-ml" ref={setTagRef(2)}>
            AI / ML
          </div>
          <div className="hero__tag hero__tag--ui-ux" ref={setTagRef(3)}>
            UI / UX
          </div>

          <div className="hero__role" ref={roleRef}>
            FRONT END DEVELOPER&nbsp;&nbsp;|&nbsp;&nbsp;UI/UX DESIGN
          </div>
        </div>
      </section>

      <section className="home__next"></section>
    </main>
  );
}

export default Home;