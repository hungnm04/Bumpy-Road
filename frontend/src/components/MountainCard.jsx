import React, { useState } from "react";
import "./MountainCardStyles.css";
import { motion } from "framer-motion";
import { FALLBACK_MOUNTAIN_IMAGE, getMountainImageUrl } from "../api/assetUrls";

function attributionLabel(site) {
  if (site.attribution) return site.attribution;
  if (site.license_code) return `${site.license_code}`;
  return null;
}

function MountainCard({ site, index = 0 }) {
  const [imageError, setImageError] = useState(false);

  const imageUrl =
    !imageError && site.photo_url
      ? getMountainImageUrl(site.photo_url)
      : FALLBACK_MOUNTAIN_IMAGE;

  const credit = attributionLabel(site);

  return (
    <motion.div
      className="mountain-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -8 }}
    >
      <motion.div
        className="mountain-card-image-wrapper"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.4 }}
      >
        <img
          src={imageUrl}
          alt={site.name}
          className="mountain-image"
          onError={() => {
            setImageError(true);
          }}
        />
        {site.destination_type && (
          <motion.div
            className="mountain-card-overlay"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + index * 0.08 }}
          >
            <span className="mountain-difficulty">{site.destination_type}</span>
          </motion.div>
        )}
      </motion.div>
      <div className="mountain-info">
        <h3>{site.name}</h3>
        <p>{site.location}</p>
        {credit && (
          <p className="mountain-credit">
            {site.attribution_url ? (
              <a href={site.attribution_url} target="_blank" rel="noopener noreferrer">
                {credit}
              </a>
            ) : (
              credit
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default MountainCard;
