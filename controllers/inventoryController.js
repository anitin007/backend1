/**
 * inventoryController.js
 * ----------------------
 * Contains all the handler functions (controllers) for inventory routes.
 * Each function handles one specific operation: create, read, update, delete,
 * search, and filter.
 */

const { inventory, generateId } = require("../model/inventoryData");

// ─────────────────────────────────────────────────────────────
// GET /api/inventory
// Returns all items. Also handles search and filter query params.
// Query params: ?name=&category=&minQty=&maxQty=
// ─────────────────────────────────────────────────────────────
const getAllItems = (req, res, next) => {
  try {
    const { name, category, minQty, maxQty } = req.query;

    // Start with the full inventory
    let results = [...inventory];

    // Filter by name (case-insensitive partial match)
    if (name) {
      results = results.filter((item) =>
        item.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    // Filter by category (case-insensitive exact match)
    if (category) {
      results = results.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by minimum quantity
    if (minQty !== undefined) {
      const min = parseInt(minQty, 10);
      if (!isNaN(min)) {
        results = results.filter((item) => item.quantity >= min);
      }
    }

    // Filter by maximum quantity
    if (maxQty !== undefined) {
      const max = parseInt(maxQty, 10);
      if (!isNaN(max)) {
        results = results.filter((item) => item.quantity <= max);
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      message: results.length > 0 ? "Items fetched successfully." : "No items match your criteria.",
      data: results,
    });
  } catch (err) {
    next(err); // Pass unexpected errors to the error handler middleware
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/inventory/:id
// Returns a single item by its ID.
// ─────────────────────────────────────────────────────────────
const getItemById = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Check if the ID is a valid number
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${req.params.id}'. ID must be a number.`,
      });
    }

    const item = inventory.find((i) => i.id === id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} was not found.`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Item fetched successfully.",
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/inventory
// Creates a new inventory item.
// Request body must pass the validateItem middleware first.
// ─────────────────────────────────────────────────────────────
const createItem = (req, res, next) => {
  try {
    const { name, category, quantity, price, description } = req.body;

    // Build the new item object
    const newItem = {
      id: generateId(),          // Auto-generated unique ID
      name: name.trim(),
      category: category.trim(),
      quantity: quantity,
      price: price,
      description: description.trim(),
    };

    // Push to the in-memory array
    inventory.push(newItem);

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully.",
      data: newItem,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/inventory/:id
// Updates all fields of an existing item (full replacement).
// ─────────────────────────────────────────────────────────────
const updateItem = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${req.params.id}'. ID must be a number.`,
      });
    }

    // Find the index of the item in the array
    const index = inventory.findIndex((i) => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} was not found. Cannot update.`,
      });
    }

    const { name, category, quantity, price, description } = req.body;

    // Update the item in place — keep the same ID
    inventory[index] = {
      id: id,
      name: name.trim(),
      category: category.trim(),
      quantity: quantity,
      price: price,
      description: description.trim(),
    };

    res.status(200).json({
      success: true,
      message: `Item with ID ${id} updated successfully.`,
      data: inventory[index],
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/inventory/:id
// Removes an item from the inventory array.
// ─────────────────────────────────────────────────────────────
const deleteItem = (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: '${req.params.id}'. ID must be a number.`,
      });
    }

    const index = inventory.findIndex((i) => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `Item with ID ${id} was not found. Cannot delete.`,
      });
    }

    // Remove the item from the array using splice
    const deletedItem = inventory.splice(index, 1)[0];

    res.status(200).json({
      success: true,
      message: `Item with ID ${id} deleted successfully.`,
      data: deletedItem,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
};
