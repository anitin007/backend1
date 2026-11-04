/**
 * inventoryData.js
 * ----------------
 * This file acts as our "database".
 * All inventory items are stored in a plain JavaScript array.
 * Data lives only while the server is running — it resets on restart.
 */

// A simple counter to generate unique IDs for new items
let nextId = 4;

/**
 * Generates a new unique ID each time it is called.
 * @returns {number} - The next available ID
 */
const generateId = () => nextId++;

// The in-memory inventory array with some sample data
const inventory = [
  {
    id: 1,
    name: "Wireless Keyboard",
    category: "Electronics",
    quantity: 25,
    price: 1299.99,
    description: "Compact wireless keyboard with Bluetooth support",
  },
  {
    id: 2,
    name: "Office Chair",
    category: "Furniture",
    quantity: 10,
    price: 4500.00,
    description: "Ergonomic office chair with lumbar support",
  },
  {
    id: 3,
    name: "Notebook A4",
    category: "Stationery",
    quantity: 200,
    price: 45.00,
    description: "A4 ruled notebook with 200 pages",
  },
];

module.exports = { inventory, generateId };
