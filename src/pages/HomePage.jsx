import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";
import Destination from "../components/Destination";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Navbar from "../components/Navbar";
import Trip from "../components/Trip";

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:5000/auth-status");
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user.role === "admin") {
            navigate("/admindashboard", { replace: true });
            return;
          }
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
        heroImg="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        title="Welcome to the Mountain"
        text="Choose your adventure"
        btnText="Discover More"
        url="/places"
        btnClass="tag"
      />
      <Destination />
      <Trip />
      <Footer />
    </>
  );
}

export default HomePage;
