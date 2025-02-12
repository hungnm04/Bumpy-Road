// src/components/MountainDetails.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import ReviewList from "./ReviewList.jsx";
import "./MountainDetailsStyles.css";

function MountainDetails() {
  const { id } = useParams();
  const [mountain, setMountain] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (!id) {
      setError("Invalid mountain ID.");
      return;
    }

    fetch(`http://localhost:5000/places/${id}`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch mountain details.");
        }
        return response.json();
      })
      .then((data) => setMountain(data))
      .catch((err) => {
        console.error(err);
        setError("Error fetching mountain details, please try again.");
      });

    fetch(`http://localhost:5000/mountains/${id}/reviews`, {
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in.");
        }
        if (!response.ok) {
          throw new Error("Failed to fetch reviews.");
        }
        return response.json();
      })
      .then((data) => setReviews(data))
      .catch((err) => {
        console.error(err);
        setError(err.message || "Error fetching reviews.");
      });
  }, [id]);

  const sortReviews = (reviewsToSort) => {
    return [...reviewsToSort].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!mountain) {
    return <div>Loading...</div>;
  }

  // Replace the existing imageUrl construction with this:
  const imageUrl = mountain.photo_url
    ? `/src/assets/mountain_photos/${mountain.photo_url}`
    : "/placeholder-mountain.jpg";

  return (
    <div className="mountain-details-page">
      <div className="mountain-overview">
        <div className="mountain-image-container">
          <img
            className="mountain-image"
            src={imageUrl}
            alt={mountain.name}
            onError={(e) => {
              e.target.src = "/placeholder-mountain.jpg";
            }}
          />
        </div>
        <div className="mountain-info">
          <h1 className="mountain-name">{mountain.name}</h1>
          <p className="mountain-location">
            {mountain.location}, {mountain.continent}
          </p>
          <p className="mountain-description">{mountain.description}</p>
        </div>
      </div>

      <div className="reviews-section">
        <div className="review-header-container">
          <div className="review-header-top">
            <h2>User Reviews ({reviews.length})</h2>
            <select
              className="sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          <ReviewForm
            mountainId={id}
            onNewReview={(newReview) => setReviews([newReview, ...reviews])}
          />
        </div>
        <ReviewList reviews={sortReviews(reviews)} />
      </div>
    </div>
  );
}

export default MountainDetails;
