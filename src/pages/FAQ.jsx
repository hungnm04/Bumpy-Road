import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import AboutImg from "../assets/3.jpg";
import ContactForm from "../components/ContactForm";

function FAQ() {
  return (
    <>
      <Navbar />
      <Hero cName="hero-mid" heroImg={AboutImg} title="Contact" btnClass="about-tag" />
      <ContactForm />
    </>
  );
}

export default FAQ;
