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
              imageSrc="https://res.cloudinary.com/dxnb2ozgw/image/upload/v1775610577/typeventure/profile%20pictures/rp1gdygzna2hbnhllgtq.jpg"
              altText="Portfolio profile"
              captionText="Jemuel Malaga"
              containerHeight="200px"
              containerWidth="200px"
              imageHeight="200px"
              imageWidth="200px"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
            />
          </div>

          <div className="hero__text">
            <div className="hero__name">
              <TextType
                text={['Jemuel Malaga', 'Frontend Developer']}
                typingSpeed={90}
                pauseDuration={2500}
                deletingSpeed={45}
                showCursor
                cursorCharacter="▎"
                cursorBlinkDuration={0.5}
                loop={true}
              />
            </div>

            <p className="hero__description">
              A passionate IT student and aspiring software developer focused
              on building modern, intuitive, and meaningful digital
              experiences through technology and creative problem-solving.
            </p>
          </div>
        </div>
      </section>

      <section>

      </section>
    </main>
  );
}

export default Home;