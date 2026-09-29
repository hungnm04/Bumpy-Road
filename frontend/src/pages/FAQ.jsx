import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import AboutImg from "../assets/3.jpg";
import ContactForm from "../components/ContactForm";
import Footer from "../components/Footer";

function FAQ() {
  return (
    <>
      <Navbar />
      <Hero
        cName="hero-mid"
        heroImg={AboutImg}
        kicker="Contact"
        title="Ask before the next turn."
        text="Questions, corrections, route notes, or feedback for the Bumpy Road team."
        btnClass="about-tag"
      />
      <ContactForm />
      <Footer />
    </>
  );
}

export default FAQ;
