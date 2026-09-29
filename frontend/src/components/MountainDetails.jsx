import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LuArrowRight,
  LuBedDouble,
  LuCalendarDays,
  LuCircleAlert,
  LuCloudSun,
  LuExternalLink,
  LuMapPin,
  LuMessageSquare,
  LuMountain,
  LuNavigation,
  LuRuler,
  LuSlidersHorizontal,
  LuWind,
} from "react-icons/lu";
import Footer from "./Footer";
import Navbar from "./Navbar";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList.jsx";
import { getMountainImageUrl } from "../api/assetUrls";
import "./MountainDetailsStyles.css";

function displayType(value = "") {
  return value.replace(/_/g, " ");
}

function formatWindow(window) {
  if (!window) return "No clear daylight block";
  const start = new Date(window.start);
  const end = new Date(window.end);

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function GuidanceList({ title, items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="mountain-guidance-list">
      <h3>{title}</h3>
      {items.map((item) => <p key={item}>{item}</p>)}
    </div>
  );
}

function MountainDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mountain, setMountain] = useState(null);
  const [conditions, setConditions] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [reviewsError, setReviewsError] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (!id) {
      setError("Invalid mountain ID.");
      return;
    }

    const loadPlace = async () => {
      try {
        const response = await fetch(`/places/${id}`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch mountain details.");
        const place = await response.json();
        setMountain(place);

        if (place.guide_status === "guide_ready") {
          const conditionsResponse = await fetch(`/api/places/${id}/conditions`);
          if (conditionsResponse.ok) setConditions(await conditionsResponse.json());
        }
      } catch (requestError) {
        console.error(requestError);
        setError("Error fetching mountain details, please try again.");
      }
    };

    const loadReviews = async () => {
      try {
        const response = await fetch(`/mountains/${id}/reviews`, { credentials: "include" });
        if (!response.ok) throw new Error("Reviews are temporarily unavailable.");
        setReviews(await response.json());
      } catch (requestError) {
        console.error(requestError);
        setReviewsError(requestError.message);
      }
    };

    loadPlace();
    loadReviews();
  }, [id]);

  const sortedReviews = [...reviews].sort((left, right) => {
    const leftDate = new Date(left.created_at);
    const rightDate = new Date(right.created_at);
    return sortOrder === "newest" ? rightDate - leftDate : leftDate - rightDate;
  });

  if (error) {
    return (
      <>
        <Navbar />
        <div className="mountain-details-page">
          <div className="error-message">{error}</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!mountain) {
    return (
      <>
        <Navbar />
        <div className="mountain-details-page">
          <div className="loading">Loading mountain details...</div>
        </div>
        <Footer />
      </>
    );
  }

  const imageUrl = getMountainImageUrl(mountain.photo_url);
  const isGuideReady = mountain.guide_status === "guide_ready";

  return (
    <>
      <Navbar />
      <div className="mountain-details-page">
        <section className="mountain-detail-hero">
          {imageUrl ? (
            <img className="mountain-detail-image" src={imageUrl} alt={mountain.name} />
          ) : (
            <div className="mountain-detail-photo-pending">Photo review pending</div>
          )}
          {mountain.media_source_url && (
            <a className="mountain-photo-credit" href={mountain.media_source_url} target="_blank" rel="noreferrer">
              Photo info <LuExternalLink />
            </a>
          )}
          <div className="mountain-detail-overlay">
            <p className="eyebrow">{isGuideReady ? "Verified destination guide" : "Catalog preview"}</p>
            <h1 className="mountain-name">{mountain.name}</h1>
            <p className="mountain-location">
              <LuMapPin /> {mountain.region ? `${mountain.region}, ` : ""}{mountain.location}
            </p>
          </div>
        </section>

        {!isGuideReady && (
          <div className="mountain-preview-notice">
            <LuCircleAlert />
            <div>
              <strong>This destination is still a catalog preview.</strong>
              <p>The location is real, but its practical guide and photo review are still being expanded.</p>
            </div>
          </div>
        )}

        <div className="mountain-content-grid">
          <section className="mountain-info">
            <div className="mountain-info-kicker">
              <LuMountain />
              <span>Field overview</span>
            </div>
            <p className="mountain-description">{mountain.description}</p>
            <div className="mountain-quick-facts">
              <span><LuMapPin /> {mountain.location}</span>
              <span><LuMountain /> {displayType(mountain.destination_type)}</span>
              {mountain.elevation_m && (
                <span><LuRuler /> {Number(mountain.elevation_m).toLocaleString()} m</span>
              )}
              <span><LuMessageSquare /> {reviews.length} reviews</span>
            </div>
            {(mountain.editorial_tags?.length > 0 || mountain.source_tags?.length > 0) && (
              <div className="mountain-tags">
                {[...(mountain.editorial_tags || []), ...(mountain.source_tags || [])]
                  .slice(0, 8)
                  .map((tag) => <span key={tag}>{tag.replace(/-/g, " ")}</span>)}
              </div>
            )}
          </section>

          <aside className="mountain-live-panel">
            <p className="eyebrow">Live conditions</p>
            {conditions ? (
              <>
                <h2>{conditions.recommendation.label}</h2>
                <div className="mountain-weather-score">{conditions.recommendation.score}</div>
                <div className="mountain-weather-facts">
                  <span><LuCloudSun /> {conditions.conditions.max_precipitation_probability}% rain risk</span>
                  <span><LuWind /> {conditions.conditions.max_wind_gust_kmh} km/h gusts</span>
                  <span><LuCalendarDays /> {formatWindow(conditions.conditions.best_window)}</span>
                </div>
                <a href={conditions.meta.provider_attribution.url} target="_blank" rel="noreferrer">
                  {conditions.meta.provider_attribution.label}
                </a>
              </>
            ) : (
              <p className="mountain-panel-copy">
                {isGuideReady
                  ? "Live forecast comparison is temporarily unavailable. Check local conditions before departure."
                  : "Weather Window unlocks after the practical guide has passed review."}
              </p>
            )}
          </aside>
        </div>

        {isGuideReady && (
          <section className="mountain-dossier">
            <div>
              <p className="eyebrow">Plan the shape of the trip</p>
              <h2>A practical read before you commit.</h2>
            </div>
            <div className="mountain-dossier-grid">
              <GuidanceList title="Works well for" items={mountain.traveler_fit} />
              <GuidanceList title="Think twice if" items={mountain.avoid_if} />
              <GuidanceList title="Season signals" items={mountain.best_seasons} />
            </div>
            <div className="mountain-practical-grid">
              {mountain.stay_style && <p><LuBedDouble /><span><strong>Stay style</strong>{mountain.stay_style}</span></p>}
              {mountain.transport_notes && <p><LuNavigation /><span><strong>Getting there</strong>{mountain.transport_notes}</span></p>}
              {mountain.planning_notes && <p><LuNavigation /><span><strong>Planning note</strong>{mountain.planning_notes}</span></p>}
            </div>
          </section>
        )}

        {mountain.alternatives?.length > 0 && (
          <section className="mountain-alternatives">
            <div>
              <p className="eyebrow">Keep the trip flexible</p>
              <h2>Similar reviewed guides</h2>
            </div>
            <div className="mountain-alternative-grid">
              {mountain.alternatives.map((alternative) => (
                <button type="button" key={alternative.id} onClick={() => navigate(`/places/${alternative.id}`)}>
                  <span>{alternative.name}</span>
                  <small>{alternative.region || alternative.location}</small>
                  <LuArrowRight />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mountain-community">
          <div className="mountain-review-panel">
            <div className="review-header-top">
              <div>
                <p className="eyebrow">Community signal</p>
                <h2>User reviews ({reviews.length})</h2>
              </div>
              <label className="sort-control">
                <LuSlidersHorizontal />
                <select className="sort-select" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
            <ReviewForm mountainId={id} onNewReview={(review) => setReviews([review, ...reviews])} />
            {reviewsError && <p className="error-message">{reviewsError}</p>}
          </div>
          <div className="reviews-section">
            <ReviewList reviews={sortedReviews} />
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}

export default MountainDetails;
