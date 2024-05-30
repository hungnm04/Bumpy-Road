import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./PlacesStyles.css";

function Places() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  
  };

  return (
    <>
      <Navbar />
      <div className="search-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for mountainous sites..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <button className="search-button" type="button">
            Search
          </button>
        </div>
      </div>
      <div className="search-results">
        {searchResults.map((site) => (
          <MountainCard key={site.id} site={site} />
        ))}
      </div>
      <Footer />
    </>
  );
}

export default Places;
