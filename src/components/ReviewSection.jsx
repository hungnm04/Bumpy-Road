import React, { useState, useEffect } from "react";
import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";
import "./ReviewListStyles.css";

function ReviewSection({ mountainId }) {
  const [reviews, setReviews] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:5000/mountains/${mountainId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews.");
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error(error);
      setReviews([]);
    }
  };

  const sortReviews = (reviewsToSort) => {
    return [...reviewsToSort].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });
  };

  useEffect(() => {
    fetchReviews();
  }, [mountainId]);

  return (
    <div className="review-section">
      <div className="review-section-header">
        <div className="review-header-top">
          <h3 className="reviews-title">Reviews ({reviews.length})</h3>
          <div className="review-sort">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
        <ReviewForm
          mountainId={mountainId}
          onNewReview={(review) => setReviews([review, ...reviews])}
        />
      </div>
      <ReviewList reviews={sortReviews(reviews)} />
    </div>
  );
}

export default ReviewSection;
