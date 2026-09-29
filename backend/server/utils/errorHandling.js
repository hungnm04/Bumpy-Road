const handleApiError = (res, error, message) => {
  console.error(message, error);
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || "An unexpected error occurred";
  res.status(statusCode).json({ message: errorMessage });
};

module.exports = {
  handleApiError,
};
