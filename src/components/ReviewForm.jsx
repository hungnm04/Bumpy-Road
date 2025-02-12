// src/components/ReviewForm.jsx

import React, { useState } from "react";
import "./ReviewFormStyles.css";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";

function ReviewForm({ mountainId, onNewReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setError("Please provide both rating and comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `http://localhost:5000/mountains/${mountainId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit review");

      // Get the complete review data including user info
      const newReview = await response.json();

      // Get user profile to include avatar
      const userResponse = await fetch("http://localhost:5000/profile", {
        credentials: "include",
      });
      const { profile } = await userResponse.json();

      // Combine review data with user profile data
      const completeReview = {
        ...newReview,
        avatar_url: profile.avatar_url,
        first_name: profile.first_name,
        last_name: profile.last_name,
      };

      onNewReview(completeReview);
      setRating(0);
      setComment("");
      setError("");
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
          <textarea
            className="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What are your thoughts?"
          />
          <div className="review-actions">
            <div className="star-rating-inline">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    cursor: "pointer",
                    color: star <= (hoverRating || rating) ? "#ff4500" : "#ccc",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <button
              type="submit"
              className="submit-review-btn"
              disabled={isSubmitting || !rating || !comment.trim()}
            >
              {isSubmitting ? "Posting..." : "Comment"}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      </form>
    </div>
  );
}

export default ReviewForm;
