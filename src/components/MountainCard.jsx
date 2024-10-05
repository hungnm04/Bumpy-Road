import React from "react";
import { Link } from "react-router-dom";
import "./MountainCardStyles.css";

function MountainCard({ site }) {
  const imageUrl = `src/assets/mountain_photos/${site.photo_url}`;

  return (
    <div className="mountain-card">
      <div className="mountain-image">
        <img src={imageUrl} alt={site.name} />
      </div>
      <div className="mountain-details">
        <h2 className="mountain-name">{site.name}</h2>
        <div className="mountain-location">
          <span className="location-icon">&#x1F4CD;</span> {site.location}, {site.continent}
        </div>
        <p className="mountain-description">{site.description}</p>
        <div className="mountain-footer">
          <Link to={`/places/${site.id}`}>
            <button className="view-more-btn">View More</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MountainCard;
