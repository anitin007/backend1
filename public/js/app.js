/**
 * app.js
 * ------
 * Frontend JavaScript for Inventory Store.
 * Connects to the existing Express backend API at /api/inventory.
 * Handles: CRUD operations, search, filter, sort, modal, validation, toast.
 */

"use strict";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const API_BASE = "/api/inventory";

// Category emoji map — makes placeholders visually distinct
const CATEGORY_EMOJI = {
  electronics:  "💻",
  furniture:    "🛋️",
  stationery:   "📝",
  clothing:     "👕",
  food:         "🍎",
  sports:       "⚽",
  books:        "📚",
  tools:        "🔧",
  toys:         "🧸",
  health:       "💊",
  default:      "📦",
};

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────
let allItems    = [];   // Full list returned from API (for client-side sort)
let editingId   = null; // ID of the item being edited (null = create mode)
let deleteTarget = null; // ID queued for deletion

// ─────────────────────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────────────────────
const productGrid       = document.getElementById("productGrid");
const emptyState        = document.getElementById("emptyState");
const loadingOverlay    = document.getElementById("loadingOverlay");
const productCountNum   = document.getElementById("productCountNum");
const toast             = document.getElementById("toast");

// Header
const searchInput       = document.getElementById("searchInput");
const addItemBtn        = document.getElementById("addItemBtn");
const emptyAddBtn       = document.getElementById("emptyAddBtn");

// Filters
const categoryFilter    = document.getElementById("categoryFilter");
const minQtyFilter      = document.getElementById("minQtyFilter");
const maxQtyFilter      = document.getElementById("maxQtyFilter");
const sortSelect        = document.getElementById("sortSelect");
const clearFiltersBtn   = document.getElementById("clearFiltersBtn");

// Modal (add/edit)
const modalOverlay      = document.getElementById("modalOverlay");
const modalTitle        = document.getElementById("modalTitle");
const itemForm          = document.getElementById("itemForm");
const modalCloseBtn     = document.getElementById("modalCloseBtn");
const modalCancelBtn    = document.getElementById("modalCancelBtn");
const modalSaveBtn      = document.getElementById("modalSaveBtn");

// Form fields
const fieldName         = document.getElementById("fieldName");
const fieldCategory     = document.getElementById("fieldCategory");
const fieldPrice        = document.getElementById("fieldPrice");
const fieldQuantity     = document.getElementById("fieldQuantity");
const fieldDesc         = document.getElementById("fieldDesc");
const fieldImage        = document.getElementById("fieldImage");
const imagePreviewWrap  = document.getElementById("imagePreviewWrap");
const imagePreview      = document.getElementById("imagePreview");

// Error spans
const errName           = document.getElementById("errName");
const errCategory       = document.getElementById("errCategory");
const errPrice          = document.getElementById("errPrice");
const errQuantity       = document.getElementById("errQuantity");
const errDesc           = document.getElementById("errDesc");

// Confirm dialog
const confirmOverlay    = document.getElementById("confirmOverlay");
const confirmText       = document.getElementById("confirmText");
const confirmCancelBtn  = document.getElementById("confirmCancelBtn");
const confirmDeleteBtn  = document.getElementById("confirmDeleteBtn");

// ─────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────
let toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'} type - Visual style.
 * @param {number} duration - How long to show (ms).
 */
function showToast(message, type = "info", duration = 3200) {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  toast.textContent = "";
  toast.className = `toast ${type}`;

  const icon = document.createElement("span");
  icon.textContent = icons[type] || "ℹ️";

  const txt = document.createElement("span");
  txt.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(txt);
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ─────────────────────────────────────────────────────────────
// LOADING STATE
// ─────────────────────────────────────────────────────────────
function showLoading() { loadingOverlay.style.display = "flex"; }
function hideLoading() { loadingOverlay.style.display = "none"; }

// ─────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Build a query string from an object (ignores empty/null/undefined values).
 */
function buildQuery(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

/**
 * Fetch all items from the backend applying current search/filter values.
 * Sorting is done client-side after the response because it isn't a backend param.
 */
async function fetchItems() {
  showLoading();
  try {
    // Build query params for backend-supported filters
    const params = {
      name:     searchInput.value.trim(),
      category: categoryFilter.value.trim(),
      minQty:   minQtyFilter.value.trim(),
      maxQty:   maxQtyFilter.value.trim(),
    };

    const url = API_BASE + buildQuery(params);
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Failed to load items.");
    }

    allItems = json.data || [];

    // Client-side sort
    applySortAndRender();

    // Update live category dropdown with unique values from current full inventory
    await refreshCategoryOptions();

  } catch (err) {
    showToast("Could not load products. Is the server running?", "error");
    console.error(err);
    renderGrid([]);
  } finally {
    hideLoading();
  }
}

/**
 * Sort allItems based on the sort select value and render.
 */
function applySortAndRender() {
  let sorted = [...allItems];

  if (sortSelect.value === "asc") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sortSelect.value === "desc") {
    sorted.sort((a, b) => b.price - a.price);
  }

  renderGrid(sorted);
}

/**
 * Refresh the category <select> with all unique categories from the full inventory.
 * We do a separate call without filters to get all categories always.
 */
async function refreshCategoryOptions() {
  try {
    const res = await fetch(API_BASE);
    const json = await res.json();
    if (!res.ok) return;

    const allData = json.data || [];
    const categories = [...new Set(allData.map(item => item.category))].sort();

    const current = categoryFilter.value;
    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      if (cat === current) opt.selected = true;
      categoryFilter.appendChild(opt);
    });
  } catch (_) {
    // silent — not critical
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Pick an emoji based on the item's category.
 */
function getCategoryEmoji(category = "") {
  const key = category.toLowerCase().trim();
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.default;
}

/**
 * Determine stock status label and CSS class.
 */
function getStockInfo(qty) {
  if (qty === 0)  return { label: "Out of stock", cls: "out-stock" };
  if (qty <= 5)   return { label: `Low stock: ${qty}`, cls: "low-stock" };
  return { label: `In stock: ${qty}`, cls: "in-stock" };
}

/**
 * Build and inject all product cards into the grid.
 */
function renderGrid(items) {
  productCountNum.textContent = items.length;
  productGrid.innerHTML = "";

  if (items.length === 0) {
    emptyState.style.display = "flex";
    productGrid.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  productGrid.style.display = "grid";

  items.forEach((item, idx) => {
    const stock        = getStockInfo(item.quantity);
    const emoji        = getCategoryEmoji(item.category);
    const priceDisplay = `₹${Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    // Build card element
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${idx * 0.04}s`;
    card.dataset.id = item.id;

    // Image / placeholder
    const imageSection = item.description && fieldImage
      ? ""   // will be checked below
      : "";

    const hasImage = item.imageUrl && item.imageUrl.trim() !== "";

    card.innerHTML = `
      <div class="card-image-wrap">
        ${hasImage
          ? `<img class="card-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
             <div class="card-img-placeholder" style="display:none;">
               <span>${emoji}</span>
               <span class="placeholder-label">${escapeHtml(item.category)}</span>
             </div>`
          : `<div class="card-img-placeholder">
               <span>${emoji}</span>
               <span class="placeholder-label">${escapeHtml(item.category)}</span>
             </div>`
        }
        <span class="card-category-badge">${escapeHtml(item.category)}</span>
      </div>

      <div class="card-body">
        <h3 class="card-name">${escapeHtml(item.name)}</h3>
        <p class="card-desc">${escapeHtml(item.description)}</p>
        <div class="card-meta">
          <span class="card-price">${priceDisplay}</span>
          <span class="card-qty ${stock.cls}">${stock.label}</span>
        </div>
      </div>

      <div class="card-footer">
        <button class="btn btn-outline btn-icon edit-btn" data-id="${item.id}" title="Edit item">
          ✏️ Edit
        </button>
        <button class="btn btn-danger btn-icon delete-btn" data-id="${item.id}" title="Delete item">
          🗑️ Delete
        </button>
      </div>
    `;

    productGrid.appendChild(card);
  });

  // Attach edit / delete button events
  productGrid.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(Number(btn.dataset.id)));
  });
  productGrid.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => openConfirmDelete(Number(btn.dataset.id)));
  });
}

/**
 * Minimal HTML-entity escaping to prevent XSS.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────
// MODAL — OPEN / CLOSE / RESET
// ─────────────────────────────────────────────────────────────
function openModal() {
  modalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
  fieldName.focus();
}

function closeModal() {
  modalOverlay.style.display = "none";
  document.body.style.overflow = "";
  resetForm();
  editingId = null;
}

function resetForm() {
  itemForm.reset();
  clearAllErrors();
  imagePreviewWrap.style.display = "none";
  imagePreview.src = "";
  // Remove invalid classes
  [fieldName, fieldCategory, fieldPrice, fieldQuantity, fieldDesc].forEach(f => {
    f.classList.remove("invalid");
  });
}

function clearAllErrors() {
  errName.textContent     = "";
  errCategory.textContent = "";
  errPrice.textContent    = "";
  errQuantity.textContent = "";
  errDesc.textContent     = "";
}

// ─────────────────────────────────────────────────────────────
// MODAL — ADD NEW ITEM
// ─────────────────────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  modalTitle.textContent = "Add New Item";
  modalSaveBtn.textContent = "💾 Save Item";
  resetForm();
  openModal();
}

// ─────────────────────────────────────────────────────────────
// MODAL — EDIT ITEM
// ─────────────────────────────────────────────────────────────
async function openEditModal(id) {
  try {
    showLoading();
    const res  = await fetch(`${API_BASE}/${id}`);
    const json = await res.json();

    if (!res.ok) {
      showToast(json.message || "Item not found.", "error");
      return;
    }

    const item = json.data;
    editingId = item.id;

    modalTitle.textContent   = "Edit Item";
    modalSaveBtn.textContent = "💾 Update Item";

    fieldName.value     = item.name;
    fieldCategory.value = item.category;
    fieldPrice.value    = item.price;
    fieldQuantity.value = item.quantity;
    fieldDesc.value     = item.description;
    fieldImage.value    = item.imageUrl || "";

    if (item.imageUrl) {
      imagePreview.src = item.imageUrl;
      imagePreviewWrap.style.display = "block";
    }

    openModal();
  } catch (err) {
    showToast("Could not load item details.", "error");
  } finally {
    hideLoading();
  }
}

// ─────────────────────────────────────────────────────────────
// FORM VALIDATION (CLIENT-SIDE — mirrors backend rules)
// ─────────────────────────────────────────────────────────────
function validateForm() {
  clearAllErrors();
  let valid = true;

  const name     = fieldName.value.trim();
  const category = fieldCategory.value.trim();
  const price    = parseFloat(fieldPrice.value);
  const quantity = parseInt(fieldQuantity.value, 10);
  const desc     = fieldDesc.value.trim();

  if (!name) {
    errName.textContent = "Product name is required.";
    fieldName.classList.add("invalid");
    valid = false;
  } else { fieldName.classList.remove("invalid"); }

  if (!category) {
    errCategory.textContent = "Category is required.";
    fieldCategory.classList.add("invalid");
    valid = false;
  } else { fieldCategory.classList.remove("invalid"); }

  if (!fieldPrice.value || isNaN(price) || price <= 0) {
    errPrice.textContent = "Price must be a positive number.";
    fieldPrice.classList.add("invalid");
    valid = false;
  } else { fieldPrice.classList.remove("invalid"); }

  if (!fieldQuantity.value || isNaN(quantity) || !Number.isInteger(quantity) || quantity < 0) {
    errQuantity.textContent = "Quantity must be a whole number ≥ 0.";
    fieldQuantity.classList.add("invalid");
    valid = false;
  } else { fieldQuantity.classList.remove("invalid"); }

  if (!desc) {
    errDesc.textContent = "Description is required.";
    fieldDesc.classList.add("invalid");
    valid = false;
  } else { fieldDesc.classList.remove("invalid"); }

  return valid;
}

// ─────────────────────────────────────────────────────────────
// FORM SUBMIT — CREATE OR UPDATE
// ─────────────────────────────────────────────────────────────
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    name:        fieldName.value.trim(),
    category:    fieldCategory.value.trim(),
    price:       parseFloat(fieldPrice.value),
    quantity:    parseInt(fieldQuantity.value, 10),
    description: fieldDesc.value.trim(),
  };

  // Only include imageUrl if provided
  const imgUrl = fieldImage.value.trim();
  if (imgUrl) payload.imageUrl = imgUrl;

  modalSaveBtn.disabled    = true;
  modalSaveBtn.textContent = "Saving…";

  try {
    const isEdit = editingId !== null;
    const url    = isEdit ? `${API_BASE}/${editingId}` : API_BASE;
    const method = isEdit ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      // Show backend errors (validation from middleware)
      if (json.errors && json.errors.length > 0) {
        showToast(json.errors[0], "error", 4500);
      } else {
        showToast(json.message || "Operation failed.", "error");
      }
      return;
    }

    showToast(
      isEdit ? `"${payload.name}" updated successfully!` : `"${payload.name}" added to inventory!`,
      "success"
    );
    closeModal();
    await fetchItems();

  } catch (err) {
    showToast("Network error. Please try again.", "error");
    console.error(err);
  } finally {
    modalSaveBtn.disabled    = false;
    modalSaveBtn.textContent = editingId ? "💾 Update Item" : "💾 Save Item";
  }
});

// ─────────────────────────────────────────────────────────────
// CONFIRM DELETE DIALOG
// ─────────────────────────────────────────────────────────────
function openConfirmDelete(id) {
  const item = allItems.find(i => i.id === id);
  const name = item ? `"${item.name}"` : `item #${id}`;
  confirmText.textContent = `You are about to permanently delete ${name}. This cannot be undone.`;
  deleteTarget = id;
  confirmOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeConfirmDialog() {
  confirmOverlay.style.display = "none";
  document.body.style.overflow = "";
  deleteTarget = null;
}

confirmCancelBtn.addEventListener("click", closeConfirmDialog);
confirmOverlay.addEventListener("click", (e) => {
  if (e.target === confirmOverlay) closeConfirmDialog();
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!deleteTarget) return;
  const id = deleteTarget;

  confirmDeleteBtn.disabled    = true;
  confirmDeleteBtn.textContent = "Deleting…";

  try {
    const res  = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      showToast(json.message || "Delete failed.", "error");
      return;
    }

    showToast(`Item deleted successfully.`, "success");
    closeConfirmDialog();
    await fetchItems();

  } catch (err) {
    showToast("Network error. Could not delete.", "error");
  } finally {
    confirmDeleteBtn.disabled    = false;
    confirmDeleteBtn.textContent = "Delete";
  }
});

// ─────────────────────────────────────────────────────────────
// SEARCH & FILTER EVENT LISTENERS
// ─────────────────────────────────────────────────────────────

// Debounce search input for a smoother experience
let searchDebounce = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(fetchItems, 350);
});

// Category, qty filters — fetch immediately on change
categoryFilter.addEventListener("change", fetchItems);
minQtyFilter.addEventListener("change", fetchItems);
maxQtyFilter.addEventListener("change", fetchItems);

// Sort — client-side, no re-fetch needed
sortSelect.addEventListener("change", applySortAndRender);

// Clear all filters
clearFiltersBtn.addEventListener("click", () => {
  searchInput.value    = "";
  categoryFilter.value = "";
  minQtyFilter.value   = "";
  maxQtyFilter.value   = "";
  sortSelect.value     = "";
  fetchItems();
});

// ─────────────────────────────────────────────────────────────
// ADD ITEM BUTTON (HEADER + EMPTY STATE)
// ─────────────────────────────────────────────────────────────
addItemBtn.addEventListener("click", openAddModal);
emptyAddBtn.addEventListener("click", openAddModal);

// ─────────────────────────────────────────────────────────────
// MODAL CLOSE CONTROLS
// ─────────────────────────────────────────────────────────────
modalCloseBtn.addEventListener("click", closeModal);
modalCancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Close modals on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modalOverlay.style.display !== "none") closeModal();
    if (confirmOverlay.style.display !== "none") closeConfirmDialog();
  }
});

// ─────────────────────────────────────────────────────────────
// IMAGE URL PREVIEW
// ─────────────────────────────────────────────────────────────
fieldImage.addEventListener("input", () => {
  const url = fieldImage.value.trim();
  if (url) {
    imagePreview.src = url;
    imagePreviewWrap.style.display = "block";
    imagePreview.onerror = () => {
      imagePreviewWrap.style.display = "none";
    };
  } else {
    imagePreviewWrap.style.display = "none";
    imagePreview.src = "";
  }
});

// ─────────────────────────────────────────────────────────────
// INITIAL LOAD
// ─────────────────────────────────────────────────────────────
(async function init() {
  await fetchItems();
})();
