# Simple Inventory Management System

A backend-only REST API built with **Node.js** and **Express.js** for managing inventory items. Data is stored in-memory (JavaScript array) — no database required.

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web framework for building REST APIs |
| dotenv | Load environment variables from `.env` file |
| cors | Enable Cross-Origin Resource Sharing |
| nodemon | Auto-restart server on file changes (development) |

---

## Project Structure

```
inventory-backend/
├── controllers/
│   └── inventoryController.js   # Business logic for all CRUD operations
├── routes/
│   └── inventoryRoutes.js       # Route definitions mapping URLs to controllers
├── middleware/
│   ├── validation.js            # Input validation middleware
│   └── errorHandler.js         # Centralized error handling middleware
├── model/
│   └── inventoryData.js        # In-memory data store (JavaScript array)
├── index.js                    # App entry point — Express setup & server start
├── .env                        # Environment variables (PORT)
├── .gitignore                  # Files excluded from git
├── package.json                # Project metadata and scripts
└── README.md                   # Project documentation
```

---

## Installation

### 1. Clone or download the project

```bash
cd inventory-backend
```

### 2. Install dependencies

```bash
npm install
```

---

## Starting the Server

### Development mode (with auto-restart via nodemon)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

The server will start on **http://localhost:5000** (or the port defined in `.env`).

You should see:
```
✅ Server is running on http://localhost:5000
📦 Inventory API available at http://localhost:5000/api/inventory
```

---

## Inventory Item Schema

Each inventory item has the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Number | Auto-generated unique identifier |
| `name` | String | Name of the item |
| `category` | String | Category the item belongs to |
| `quantity` | Integer | Number of units in stock (≥ 0) |
| `price` | Number | Price per unit (> 0) |
| `description` | String | Short description of the item |

---

## API Endpoints

### Base URL: `http://localhost:5000/api/inventory`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all items (supports search & filter) |
| GET | `/api/inventory/:id` | Get a single item by ID |
| POST | `/api/inventory` | Create a new item |
| PUT | `/api/inventory/:id` | Update an existing item |
| DELETE | `/api/inventory/:id` | Delete an item |

### Search & Filter Query Parameters (for GET /api/inventory)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `name` | String | Search by item name (partial, case-insensitive) | `?name=keyboard` |
| `category` | String | Filter by exact category (case-insensitive) | `?category=Electronics` |
| `minQty` | Number | Filter items with quantity ≥ value | `?minQty=10` |
| `maxQty` | Number | Filter items with quantity ≤ value | `?maxQty=50` |

> You can combine multiple query params: `?name=chair&minQty=5&maxQty=20`

---

## Example API Requests and Responses

---

### 1. GET /api/inventory — Get All Items

**Request:**
```
GET http://localhost:5000/api/inventory
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "message": "Items fetched successfully.",
  "data": [
    {
      "id": 1,
      "name": "Wireless Keyboard",
      "category": "Electronics",
      "quantity": 25,
      "price": 1299.99,
      "description": "Compact wireless keyboard with Bluetooth support"
    },
    ...
  ]
}
```

---

### 2. GET /api/inventory?name=keyboard&category=Electronics — Search + Filter

**Request:**
```
GET http://localhost:5000/api/inventory?name=keyboard&category=Electronics
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "message": "Items fetched successfully.",
  "data": [
    {
      "id": 1,
      "name": "Wireless Keyboard",
      "category": "Electronics",
      "quantity": 25,
      "price": 1299.99,
      "description": "Compact wireless keyboard with Bluetooth support"
    }
  ]
}
```

---

### 3. GET /api/inventory/:id — Get Item by ID

**Request:**
```
GET http://localhost:5000/api/inventory/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item fetched successfully.",
  "data": {
    "id": 1,
    "name": "Wireless Keyboard",
    "category": "Electronics",
    "quantity": 25,
    "price": 1299.99,
    "description": "Compact wireless keyboard with Bluetooth support"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Item with ID 99 was not found."
}
```

---

### 4. POST /api/inventory — Create a New Item

**Request:**
```
POST http://localhost:5000/api/inventory
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "USB Hub",
  "category": "Electronics",
  "quantity": 50,
  "price": 799.00,
  "description": "7-port USB 3.0 hub with power adapter"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Inventory item created successfully.",
  "data": {
    "id": 4,
    "name": "USB Hub",
    "category": "Electronics",
    "quantity": 50,
    "price": 799,
    "description": "7-port USB 3.0 hub with power adapter"
  }
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed. Please fix the following errors:",
  "errors": [
    "'price' must be a positive number greater than zero."
  ]
}
```

---

### 5. PUT /api/inventory/:id — Update an Item

**Request:**
```
PUT http://localhost:5000/api/inventory/1
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Wireless Keyboard Pro",
  "category": "Electronics",
  "quantity": 30,
  "price": 1599.99,
  "description": "Updated model with backlit keys and Bluetooth 5.0"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item with ID 1 updated successfully.",
  "data": {
    "id": 1,
    "name": "Wireless Keyboard Pro",
    "category": "Electronics",
    "quantity": 30,
    "price": 1599.99,
    "description": "Updated model with backlit keys and Bluetooth 5.0"
  }
}
```

---

### 6. DELETE /api/inventory/:id — Delete an Item

**Request:**
```
DELETE http://localhost:5000/api/inventory/2
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Item with ID 2 deleted successfully.",
  "data": {
    "id": 2,
    "name": "Office Chair",
    "category": "Furniture",
    "quantity": 10,
    "price": 4500,
    "description": "Ergonomic office chair with lumbar support"
  }
}
```

---

## Notes

- Data is stored **only in memory**. It resets every time the server restarts.
- Three sample items are pre-loaded on startup for testing.
- All responses follow a consistent JSON format with a `success` boolean field.
