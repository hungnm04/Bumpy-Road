import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import AboutImg from "../assets/night.jpg";
import Footer from "../components/Footer";
import AboutUs from "../components/AboutUs";

function About() {
  return (
    <>
      <Navbar />
      <Hero
        cName="hero-mid"
        heroImg={AboutImg}
        kicker="About Bumpy Road"
        title="A calmer way to choose the wild."
        text="We are building a community field guide for mountain travel: practical enough for planning, personal enough to remember."
        btnClass="about-tag"
      />
      <AboutUs />
      <Footer />
    </>
  );
}

export default About;
