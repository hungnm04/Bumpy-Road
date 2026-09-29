import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession } from "../api/session";
import Destination from "../components/Destination";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Trip from "../components/Trip";
import HeroImage from "../assets/4.jpg";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const session = await getSession();
        if (session.authenticated && session.user?.role === "admin") {
          navigate("/admindashboard", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
      setLoading(false);
    };

    checkUserRole();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <Hero
        cName="hero"
        heroImg={HeroImage}
        kicker="Routes, reviews, and field notes"
        title="Mountain trips worth the bumpy road."
        text="Scout high-altitude destinations, read traveler stories, and collect the practical details you need before the first switchback."
        btnText="Browse Places"
        url="/places"
        btnClass="tag"
        stats={[
          { value: "50+", label: "Mountain photos" },
          { value: "Live", label: "Search index" },
          { value: "Field", label: "Community notes" },
        ]}
      />
      <Destination />
      <Trip />
      <Footer />
    </>
  );
}

export default HomePage;
