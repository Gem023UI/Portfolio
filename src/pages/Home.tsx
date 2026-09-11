import TiltedCard from "../components/TiltedCard";
import TextType from "../components/TextType";
import "../styles/Home.css";

function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero__content">
          <div className="hero__card">
            <TiltedCard
              imageSrc="https://res.cloudinary.com/dxnb2ozgw/image/upload/v1783658727/foodhub/profiles/vendors/vy6nu48ipgiu62cqnz3y.png"
              altText="Portfolio profile"
              captionText="Jemuel Malaga"
              containerHeight="400px"
              containerWidth="400px"
              imageHeight="350px"
              imageWidth="350px"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <p className="tilted-card-demo-text">
                  Jemuel Malaga
                </p>
              }
            />
          </div>

          <div className="hero__text">
            <p className="hero__greeting">Hello, I'm</p>

            <div className="hero__name">
              <TextType
                text={['Jemuel Malaga']}
                typingSpeed={90}
                pauseDuration={2500}
                deletingSpeed={45}
                showCursor
                cursorCharacter="▎"
                cursorBlinkDuration={0.5}
                loop={false}
              />
            </div>

            <p className="hero__description">
              A passionate IT student and aspiring software developer focused
              on building modern, intuitive, and meaningful digital
              experiences through technology and creative problem-solving.
            </p>

            <div className="hero__actions">
              <a href="#projects" className="hero__button hero__button--primary">
                View My Work
              </a>

              <a href="#contact" className="hero__button hero__button--secondary">
                Contact Me
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;