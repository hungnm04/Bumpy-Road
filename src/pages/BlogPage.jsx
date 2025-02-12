import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

function BlogPage() {
  return (
    <>
      <Navbar />
      <Hero
        cName="hero"
        heroImg="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        title="Welcome to the Mountain"
        text="Choose your adventure"
        btnText="Discover More"
        url="/"
        btnClass="tag"
      />
    </>
  );
}

export default BlogPage;
