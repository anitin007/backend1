/**
 * index.js
 * --------
 * Entry point of the application.
 * Sets up Express, middleware, routes, and starts the server.
 */

// Load environment variables from .env file FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const inventoryRoutes = require("./routes/inventoryRoutes");

// Import centralized error handler (must be registered LAST)
const errorHandler = require("./middleware/errorHandler");

// Create the Express application
const app = express();

// ─────────────────────────────────────────────────────────────
// Global Middleware
// ─────────────────────────────────────────────────────────────

// Enable CORS — allows requests from any origin (useful for testing with Thunder Client, Postman, etc.)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve the frontend from the 'public' folder
// This makes http://localhost:3000 open index.html automatically
app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

// Mount all inventory routes under /api/inventory
app.use("/api/inventory", inventoryRoutes);

// Root route — serve the frontend HTML page
// express.static already handles this, but this is a fallback
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle undefined routes (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found on this server.`,
  });
});

// ─────────────────────────────────────────────────────────────
// Centralized Error Handler — MUST be last
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// Start the server
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`🛒 Shopping UI available at http://localhost:${PORT}`);
  console.log(`📦 Inventory API available at http://localhost:${PORT}/api/inventory`);
});
