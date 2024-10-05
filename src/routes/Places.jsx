import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import MountainCard from "../components/MountainCard";
import Footer from "../components/Footer";
import "./PlacesStyles.css";
import { FaSearch } from 'react-icons/fa';

function Places() {
  const [placesSearchQuery, setPlacesSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/places?name=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(placesSearchQuery);
  }, [placesSearchQuery]);

  const handlePlacesSearchChange = (e) => {
    setPlacesSearchQuery(e.target.value);
  };

  return (
    <div className="places-container">
      <Navbar />
      <div className="places-content">
        <div className="places-search-container">
          <div className="places-search-bar">
            <FaSearch className="places-search-icon" />
            <input
              type="text"
              placeholder="Search for a mountain..."
              value={placesSearchQuery}
              onChange={handlePlacesSearchChange}
              className="places-input"
            />
          </div>
          {searchResults.length > 0 && (
            <ul className="places-search-results">
              {searchResults.map((site) => (
                <li key={site.id}>
                  <MountainCard site={site} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : searchResults.length === 0 && !placesSearchQuery ? (
          <div className="featured-places">
            <h2>Featured Mountainous Sites</h2>
            <div className="mountain-card-grid">
              <MountainCard site={{ id: 100, name: "Mount Everest", location: "Nepal" }} />
              <MountainCard site={{ id: 101, name: "Mount Kilimanjaro", location: "Tanzania" }} />
              <MountainCard site={{ id: 102, name: "Matterhorn", location: "Switzerland" }} />
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}

export default Places;