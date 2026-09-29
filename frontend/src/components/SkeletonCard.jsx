import React from "react";
import { motion } from "framer-motion";

/**
 * Pulsing skeleton card — matches MountainCard dimensions exactly.
 * Renders during data fetches so layout doesn't jump.
 */
export default function SkeletonCard({ index = 0 }) {
  return (
    <motion.div
      className="skeleton-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      aria-hidden="true"
    >
      <div className="skeleton-image shimmer" />
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title shimmer" />
        <div className="skeleton-line skeleton-subtitle shimmer" />
        <div className="skeleton-tags">
          <div className="skeleton-tag shimmer" />
          <div className="skeleton-tag shimmer" />
        </div>
      </div>

      <style>{`
        .skeleton-card {
          border: 1px solid var(--color-line);
          border-radius: 8px;
          background: #fff8ec;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(39, 31, 20, 0.08);
        }

        .skeleton-image {
          aspect-ratio: 1.26;
          background: linear-gradient(
            135deg,
            rgba(49, 95, 69, 0.08) 0%,
            rgba(110, 159, 178, 0.12) 50%,
            rgba(49, 95, 69, 0.08) 100%
          );
        }

        .skeleton-content {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 20px;
        }

        .skeleton-line {
          height: 16px;
          border-radius: 4px;
          background: rgba(49, 95, 69, 0.1);
        }

        .skeleton-title {
          width: 75%;
          height: 22px;
          border-radius: 4px;
        }

        .skeleton-subtitle {
          width: 55%;
        }

        .skeleton-tags {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .skeleton-tag {
          width: 60px;
          height: 26px;
          border-radius: 5px;
        }

        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(49, 95, 69, 0.06) 0%,
            rgba(49, 95, 69, 0.14) 40%,
            rgba(49, 95, 69, 0.06) 80%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.6s ease-in-out infinite;
        }

        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </motion.div>
  );
}
