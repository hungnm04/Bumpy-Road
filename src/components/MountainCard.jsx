import React, { useState } from "react";
import "./MountainCardStyles.css";

function MountainCard({ site }) {

  const imageUrl =
    !imageError && site.photo_url
      ? `/src/assets/mountain_photos/${site.photo_url}`
      : "/placeholder-mountain.jpg";

  return (
    <div className="mountain-card">
      <img
        src={imageUrl}
        alt={site.name}
        className="mountain-image"
        onError={(e) => {
          setImageError(true);
          e.target.src = "/placeholder-mountain.jpg";
        }}
      />
      <div className="mountain-info">
        <h3>{site.name}</h3>
        <p>{site.location}</p>
      </div>
    </div>
  );
}

export default MountainCard;
