/**
 * errorHandler.js
 * ---------------
 * Centralized error handling middleware.
 * This must be registered LAST in index.js (after all routes).
 * Express recognizes it as an error handler because it has 4 parameters: (err, req, res, next).
 */

const errorHandler = (err, req, res, next) => {
  // Log the full error to the server console for debugging
  console.error("❌ Error:", err.message);

  // Determine the HTTP status code:
  // - Use the status code set on the error object, OR
  // - Default to 500 (Internal Server Error)
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected server error occurred.",
    // Show stack trace only in development mode for easier debugging
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
