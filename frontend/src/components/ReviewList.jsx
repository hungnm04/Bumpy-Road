import React from "react";
import "./ReviewListStyles.css";
import { FaStar } from "react-icons/fa";

function ReviewList({ reviews }) {
  return (
    <div className="review-list">
      {reviews.length === 0 ? (
        <p>No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-avatar-section">
              <img
                src={
                  review.avatar_url
                    ? `${review.avatar_url}`
                    : "https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png"
                }
                alt=""
                className="user-avatar"
              />
            </div>
            <div className="review-content">
              <div className="review-header">
                <div className="review-info">
                  <span className="review-author">
                    {review.first_name} {review.last_name}
                  </span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="review-rating" aria-label={`${review.rating} star rating`}>
                  {Array.from({ length: review.rating || 0 }, (_, index) => (
                    <FaStar key={index} />
                  ))}
                </span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ReviewList;
