import React, { useEffect, useRef, useMemo, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
  /** ScrollTrigger `start` for the word animation. Default: 'top bottom-=20%'. */
  wordAnimationStart?: string;
}

// Walks arbitrary children (plain text, highlighted <span>s, etc.), splitting
// every text run into individual .word spans while preserving any wrapping
// elements — so a highlighted phrase keeps its color, and each word inside it
// still gets its own scroll-reveal animation target.
function renderRich(node: ReactNode, keyPrefix: string): ReactNode[] {
  if (typeof node === 'string') {
    return node
      .split(/(\s+)/)
      .filter(chunk => chunk.length > 0)
      .map((chunk, i) =>
        chunk.trim() === '' ? (
          chunk
        ) : (
          <span className="word" key={`${keyPrefix}-w${i}`}>
            {chunk}
          </span>
        )
      );
  }

  if (Array.isArray(node)) {
    return node.flatMap((child, i) => renderRich(child, `${keyPrefix}-${i}`));
  }

  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: ReactNode }>;
    const nested = renderRich(el.props.children, keyPrefix);
    return [React.cloneElement(el as React.ReactElement<any>, { key: keyPrefix }, nested)];
  }

  return [node];
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
  wordAnimationStart = 'top bottom-=20%'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => renderRich(children, 'sr'), [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller = scrollContainerRef && scrollContainerRef.current ? scrollContainerRef.current : window;

    // gsap.context scopes cleanup to THIS component's tweens/triggers. The previous version
    // called ScrollTrigger.getAll().forEach(kill), which also killed every other trigger on the
    // page (hero surge, About title, pinned sections...) whenever one ScrollReveal unmounted.
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom',
            end: rotationEnd,
            scrub: true
          }
        }
      );

      const wordElements = el.querySelectorAll<HTMLElement>('.word');

      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: 'opacity' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: wordAnimationStart,
            end: wordAnimationEnd,
            scrub: true
          }
        }
      );

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: wordAnimationStart,
              end: wordAnimationEnd,
              scrub: true
            }
          }
        );
      }
    }, el);

    return () => ctx.revert();
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    wordAnimationEnd,
    wordAnimationStart,
    blurStrength
  ]);

  return (
    <div ref={containerRef} className={`scroll-reveal ${containerClassName}`}>
      <p className={`scroll-reveal-text ${textClassName}`}>{splitText}</p>
    </div>
  );
};

export default ScrollReveal;