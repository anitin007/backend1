/**
 * validation.js
 * -------------
 * Middleware that validates the request body before creating or updating
 * an inventory item. Returns 400 Bad Request if validation fails.
 */

/**
 * validateItem
 * Checks that all required fields are present and have the correct data types.
 */
const validateItem = (req, res, next) => {
  const { name, category, quantity, price, description } = req.body;

  const errors = [];

  // --- Required field checks ---
  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.push("'name' is required and must be a non-empty string.");
  }

  if (!category || typeof category !== "string" || category.trim() === "") {
    errors.push("'category' is required and must be a non-empty string.");
  }

  if (description === undefined || description === null) {
    errors.push("'description' is required.");
  } else if (typeof description !== "string") {
    errors.push("'description' must be a string.");
  }

  // --- Quantity validation ---
  if (quantity === undefined || quantity === null) {
    errors.push("'quantity' is required.");
  } else if (typeof quantity !== "number") {
    errors.push("'quantity' must be a number.");
  } else if (!Number.isInteger(quantity)) {
    errors.push("'quantity' must be a whole number (integer).");
  } else if (quantity < 0) {
    errors.push("'quantity' must be zero or a positive integer (non-negative).");
  }

  // --- Price validation ---
  if (price === undefined || price === null) {
    errors.push("'price' is required.");
  } else if (typeof price !== "number") {
    errors.push("'price' must be a number.");
  } else if (price <= 0) {
    errors.push("'price' must be a positive number greater than zero.");
  }

  // If any errors exist, respond with 400 and list all errors
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed. Please fix the following errors:",
      errors: errors,
    });
  }

  // All checks passed — move on to the controller
  next();
};

/**
 * validateUpdateItem
 * Same as validateItem but used for PUT/PATCH — all fields are still required.
 * We reuse the same middleware here for simplicity.
 */
const validateUpdateItem = validateItem;

module.exports = { validateItem, validateUpdateItem };
