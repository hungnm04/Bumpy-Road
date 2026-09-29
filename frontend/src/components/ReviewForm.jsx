import React, { useState } from "react";
import "./ReviewFormStyles.css";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { motion } from "framer-motion";
import { LuSend } from "react-icons/lu";
import WaveStarRating from "./WaveStarRating";

function ReviewForm({ mountainId, onNewReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setError("Please provide both rating and comment.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetchWithAuth(
        `/mountains/${mountainId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit review");

      const newReview = await response.json();

      const userResponse = await fetch("/profile", { credentials: "include" });
      const { profile } = await userResponse.json();

      const completeReview = {
        ...newReview,
        avatar_url: profile.avatar_url,
        first_name: profile.first_name,
        last_name: profile.last_name,
      };

      onNewReview(completeReview);
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-inline">
      <form onSubmit={handleSubmit}>
        <div className="review-input-area">
          <motion.textarea
            className="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you find on the trail? What would you tell someone arriving tomorrow?"
            whileFocus={{ borderColor: "var(--color-moss)", boxShadow: "0 0 0 4px rgba(49, 95, 69, 0.13)" }}
            transition={{ duration: 0.18 }}
          />
          <div className="review-actions">
            <div className="star-rating-inline">
              <WaveStarRating value={rating} onChange={setRating} size={22} />
              {rating > 0 && (
                <motion.span
                  className="rating-label"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={rating}
                >
                  {rating === 5 ? "Exceptional" : rating === 4 ? "Great" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                </motion.span>
              )}
            </div>
            <motion.button
              type="submit"
              className="submit-review-btn"
              disabled={isSubmitting || !rating || !comment.trim()}
              whileHover={!isSubmitting && rating && comment.trim() ? { scale: 1.02, y: -1 } : {}}
              whileTap={!isSubmitting && rating && comment.trim() ? { scale: 0.97 } : {}}
            >
              {isSubmitting ? (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Posting…
                </motion.span>
              ) : (
                <>
                  <LuSend />
                  Post field note
                </>
              )}
            </motion.button>
          </div>
          {error && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}
        </div>
      </form>

      <style>{`
        .rating-label {
          font-size: 0.78rem;
          font-weight: 900;
          color: var(--color-gold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      `}</style>
    </div>
  );
}

export default ReviewForm;
