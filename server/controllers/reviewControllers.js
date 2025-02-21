const { getReviewsByMountainId, addReview } = require("../services/reviews");
const { handleApiError } = require("../utils/errorHandling");

async function fetchReviews(req, res) {
  const { mountainId } = req.params;
  try {
    const reviews = await getReviewsByMountainId(mountainId);
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
}

async function submitReview(req, res) {
  const { mountainId } = req.params;
  const { rating, comment } = req.body;
  const username = req.user.username;

  if (!rating || !comment) {
    return res.status(400).json({ message: "Rating and comment are required." });
  }

  try {
    const newReview = await addReview({
      mountainId,
      username,
      rating,
      comment,
    });

    // Get the complete review data with user info
    const reviews = await getReviewsByMountainId(mountainId);
    const completeReview = reviews.find((review) => review.id === newReview.id);

    res.status(201).json(completeReview);
  } catch (error) {
    handleApiError(res, error, "Error submitting review");
  }
}

module.exports = {
  fetchReviews,
  submitReview,
};
