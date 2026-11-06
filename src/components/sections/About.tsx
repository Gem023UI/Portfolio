import AnimatedContent from "../AnimatedContent";
import "./About.css";

export default function About() {
  return (
    <section id="about" className="about">
      <AnimatedContent
        distance={100}
        direction="vertical"
        duration={0.8}
        ease="power3.out"
        blur={0}
        stagger={0.08}
        delay={0.5}
        threshold={0.1}
      >
        <p className="about__text">
        I’m drawn to the space where design meets technology. I enjoy turning
        abstract ideas into thoughtful experiences, functional products, and
        solutions that make a difference. With interests spanning product
        design, full-stack development, and cloud computing, I approach every
        challenge as an opportunity to experiment, connect ideas, and build
        with purpose. Always curious, always creating, and never quite done
        exploring.
        </p>
      </AnimatedContent>
    </section>
  );
}