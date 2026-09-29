const { z } = require("zod");
const { getReviewsByMountainId, addReview } = require("../services/reviews");
const { handleApiError } = require("../utils/errorHandling");
const logger = require("../utils/logger");

// Zod schema for review submission
const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(2000),
});

async function fetchReviews(req, res) {
  const { mountainId } = req.params;
  try {
    const reviews = await getReviewsByMountainId(mountainId);
    res.status(200).json(reviews);
  } catch (error) {
    logger.error({ err: error, mountainId }, "Error fetching reviews");
    res.status(500).json({ message: "Error fetching reviews" });
  }
}

async function submitReview(req, res) {
  const { mountainId } = req.params;

  try {
    // Validate input
    const validated = submitReviewSchema.parse(req.body);
    const { rating, comment } = validated;
    const username = req.user.username;

    const newReview = await addReview({
      mountainId,
      username,
      rating,
      comment,
    });

    // Get the complete review data with user info
    const reviews = await getReviewsByMountainId(mountainId);
    const completeReview = reviews.find((review) => review.id === newReview.id);

    logger.info({ mountainId, username }, "Review submitted");

    res.status(201).json(completeReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    handleApiError(res, error, "Error submitting review");
  }
}

module.exports = {
  fetchReviews,
  submitReview,
};
