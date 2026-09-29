import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * Star rating with wave-fill animation on hover and selection.
 * Each star fills left-to-right using clip-path as the user hovers.
 */
export default function WaveStarRating({ value = 0, onChange, readOnly = false, size = 22 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div
      className="wave-star-rating"
      style={{ display: "inline-flex", gap: "6px" }}
      aria-label={readOnly ? `Rating: ${value} out of 5` : `Select rating: currently ${value} stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value);
        const fillPercent = Math.max(0, Math.min(100, ((hovered || value) - (star - 1)) * 100));

        return (
          <motion.button
            key={star}
            type="button"
            className="wave-star-btn"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            onFocus={() => !readOnly && setHovered(star)}
            onBlur={() => !readOnly && setHovered(0)}
            whileTap={!readOnly ? { scale: 0.85 } : {}}
            style={{ background: "none", border: "none", cursor: readOnly ? "default" : "pointer", padding: 0 }}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Base star outline */}
              <path
                d="M12 2L14.9 8.6L22 9.3L17 14.1L18.2 21.2L12 17.8L5.8 21.2L7 14.1L2 9.3L9.1 8.6L12 2Z"
                stroke={active ? "#d7ae45" : "rgba(23,21,18,0.22)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Fill layer — clip-path sweeps left-to-right */}
              <motion.path
                d="M12 2L14.9 8.6L22 9.3L17 14.1L18.2 21.2L12 17.8L5.8 21.2L7 14.1L2 9.3L9.1 8.6L12 2Z"
                fill={active ? "#d7ae45" : "transparent"}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{
                  clipPath: `inset(0 ${100 - fillPercent}% 0 0)`,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            </svg>
          </motion.button>
        );
      })}

      <style>{`
        .wave-star-btn:focus-visible {
          outline: 2px solid var(--color-gold);
          outline-offset: 3px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
