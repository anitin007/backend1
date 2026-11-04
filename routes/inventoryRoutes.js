/**
 * inventoryRoutes.js
 * ------------------
 * Defines all API routes for the inventory resource.
 * Each route is linked to a controller function and, where needed,
 * passes through the validation middleware first.
 */

const express = require("express");
const router = express.Router();

// Import controller functions
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/inventoryController");

// Import validation middleware
const { validateItem, validateUpdateItem } = require("../middleware/validation");

// ─────────────────────────────────────────────────────────────
// Route definitions
// ─────────────────────────────────────────────────────────────

// GET  /api/inventory          → Get all items (supports ?name, ?category, ?minQty, ?maxQty)
router.get("/", getAllItems);

// GET  /api/inventory/:id      → Get one item by ID
router.get("/:id", getItemById);

// POST /api/inventory          → Create a new item (validate body first)
router.post("/", validateItem, createItem);

// PUT  /api/inventory/:id      → Update an existing item (validate body first)
router.put("/:id", validateUpdateItem, updateItem);

// DELETE /api/inventory/:id    → Delete an item
router.delete("/:id", deleteItem);

module.exports = router;
