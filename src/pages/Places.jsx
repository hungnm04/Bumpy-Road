import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MountainCard from "../components/MountainCard";
import Footer from "../components/Footer";
import "./PlacesStyles.css";
import { FaSearch, FaMapMarkerAlt, FaStar, FaRoute, FaMountain } from "react-icons/fa";

function Places() {
  const navigate = useNavigate();
  const [placesSearchQuery, setPlacesSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSearchResults = async (query) => {
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

  const fetchFeaturedPlaces = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/featured-places`);
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }
      const data = await response.json();
      setFeaturedPlaces(data);
    } catch (error) {
      console.error("Error fetching featured places:", error);
      setFeaturedPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (placesSearchQuery.trim()) {
      fetchSearchResults(placesSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [placesSearchQuery]);

  useEffect(() => {
    fetchFeaturedPlaces();
  }, []);

  const handlePlacesSearchChange = (e) => {
    setPlacesSearchQuery(e.target.value);
  };

  const handleMountainClick = (mountainId) => {
    navigate(`/places/${mountainId}`);
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
              placeholder="Search mountains, trails, or locations..."
              value={placesSearchQuery}
              onChange={handlePlacesSearchChange}
              className="places-input"
            />
          </div>
          {searchResults.length > 0 && (
            <ul className="places-search-results">
              {searchResults.map((site) => (
                <li
                  key={site.id}
                  className="search-result-item"
                  onClick={() => handleMountainClick(site.id)}
                >
                  <img
                    src={
                      site.photo_url
                        ? `/src/assets/mountain_photos/${site.photo_url}`
                        : "/placeholder-mountain.jpg"
                    }
                    alt={site.name}
                    className="search-result-image"
                    onError={(e) => {
                      e.target.src = "/placeholder-mountain.jpg";
                    }}
                  />
                  <div className="search-result-info">
                    <div className="search-result-name">{site.name}</div>
                    <div className="search-result-location">{site.location}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading amazing destinations...</div>
        ) : !placesSearchQuery.trim() ? (
          <div className="featured-places">
            <h2>Popular Mountain Destinations</h2>
            <div className="mountain-card-grid">
              {featuredPlaces.map((site) => (
                <div
                  key={site.id}
                  className="mountain-card-wrapper"
                  onClick={() => handleMountainClick(site.id)}
                >
                  <div className="mountain-card">
                    <div className="mountain-card-image">
                      <img
                        src={`/src/assets/mountain_photos/${site.photo_url}`}
                        alt={site.name}
                        onError={(e) => {
                          e.target.src = "/src/assets/mountain_photos/placeholder-mountain.png";
                        }}
                      />
                      <div className="mountain-card-badge">Featured</div>
                    </div>
                    <div className="mountain-card-content">
                      <h3 className="mountain-card-title">{site.name}</h3>
                      <div className="mountain-card-location">
                        <FaMapMarkerAlt /> {site.location}
                      </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div >
  );
}

export default Places;
