/**
 * netlify/functions/api.js
 * ─────────────────────────
 * This file wraps the Express app as a Netlify serverless function.
 * Netlify calls this file instead of running index.js directly.
 * 
 * The `serverless-http` package converts every incoming Netlify
 * request into an Express-compatible request/response cycle.
 */

const serverless = require("serverless-http");

// Load environment variables
require("dotenv").config();

const express    = require("express");
const cors       = require("cors");

// Import routes and middleware (same as index.js)
const inventoryRoutes = require("../../routes/inventoryRoutes");
const errorHandler    = require("../../middleware/errorHandler");

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────
// On Netlify, the function is mounted at /.netlify/functions/api
// We accept both /api/inventory and /inventory to be safe
app.use("/api/inventory", inventoryRoutes);
app.use("/inventory",     inventoryRoutes);  // fallback path

// ── 404 for unknown API routes ──────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route '${req.originalUrl}' not found.`,
  });
});

// ── Centralized Error Handler ───────────────────────────────
app.use(errorHandler);

// Export as a Netlify serverless function handler
module.exports.handler = serverless(app);
