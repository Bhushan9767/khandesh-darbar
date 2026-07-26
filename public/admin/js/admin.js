const API_BASE = "/api";
let token = localStorage.getItem("khandesh_admin_token");
let currentAdmin = JSON.parse(localStorage.getItem("khandesh_admin_user"));

// Elements
const loginView = document.getElementById("loginView");
const dashboardLayout = document.getElementById("dashboardLayout");
const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");
const adminNameSpan = document.getElementById("adminName");
const adminInitialDiv = document.getElementById("adminInitial");
const pageTitle = document.getElementById("pageTitle");

// Sidebar items
const sidebarItems = document.querySelectorAll(".sidebar-menu li");
const viewSections = document.querySelectorAll(".view-section");

/*====================================================
        AUTHENTICATION ROUTINES
====================================================*/
function checkAuth() {
  if (token && currentAdmin) {
    loginView.style.display = "none";
    dashboardLayout.style.display = "flex";
    adminNameSpan.innerText = currentAdmin.name;
    adminInitialDiv.innerText = currentAdmin.name.charAt(0).toUpperCase();
    
    // Default view: Dashboard
    switchView("dashboard");
  } else {
    loginView.style.display = "flex";
    dashboardLayout.style.display = "none";
  }
}

// Login Submission
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid credentials");
      }

      const data = await res.json();
      token = data.token;
      currentAdmin = data.admin;

      localStorage.setItem("khandesh_admin_token", token);
      localStorage.setItem("khandesh_admin_user", JSON.stringify(currentAdmin));

      checkAuth();
      loginForm.reset();
    } catch (err) {
      alert(err.message || "Failed to log in.");
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("khandesh_admin_token");
    localStorage.removeItem("khandesh_admin_user");
    token = null;
    currentAdmin = null;
    checkAuth();
  });
}

// Fetch helper with Authorization header
async function adminFetch(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}/admin${endpoint}`, {
      ...options,
      headers
    });

    if (res.status === 401) {
      // Token expired or invalid, log out
      localStorage.removeItem("khandesh_admin_token");
      localStorage.removeItem("khandesh_admin_user");
      token = null;
      currentAdmin = null;
      checkAuth();
      throw new Error("Session expired. Please log in again.");
    }

    return res;
  } catch (err) {
    console.error("Admin Fetch Error:", err);
    throw err;
  }
}

/*====================================================
        NAVIGATION & VIEW SWITCHING
====================================================*/
function switchView(viewName) {
  // Update sidebar active state
  sidebarItems.forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Toggle view containers
  viewSections.forEach(section => {
    if (section.id === `view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`) {
      section.style.display = "block";
    } else {
      section.style.display = "none";
    }
  });

  // Load view data
  switch (viewName) {
    case "dashboard":
      pageTitle.innerText = "Dashboard Overview";
      loadDashboardStats();
      break;
    case "kot":
      pageTitle.innerText = "Kitchen Order Tickets";
      loadKOTBoard();
      break;
    case "bookings":
      pageTitle.innerText = "Table Bookings";
      loadBookingsTable();
      break;
    case "menu":
      pageTitle.innerText = "Menu Item Editor";
      loadMenuTable();
      break;
    case "reviews":
      pageTitle.innerText = "Customer Reviews Moderation";
      loadReviewsTable();
      break;
    case "subscribers":
      pageTitle.innerText = "Newsletter Subscribers List";
      loadSubscribersTable();
      break;
    case "mess":
      pageTitle.innerText = "Monthly Mess Subscriptions";
      loadMessTable();
      break;
  }
}

// Bind navigation clicks
sidebarItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(item.dataset.view);
  });
});

/*====================================================
        VIEW LOADER: DASHBOARD
====================================================*/
async function loadDashboardStats() {
  try {
    const res = await adminFetch("/stats");
    if (!res.ok) throw new Error("Stats request failed");
    const stats = await res.json();

    document.getElementById("statSales").innerText = `₹${stats.totalSales}`;
    document.getElementById("statKOTs").innerText = stats.activeOrders;
    document.getElementById("statBookings").innerText = stats.pendingBookings;
    document.getElementById("statMenu").innerText = stats.totalMenu;

    // Load active orders as quick summary
    const ordersRes = await adminFetch("/orders");
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      const activeOnly = orders.filter(o => ["pending", "preparing", "served"].includes(o.status));
      
function safeGetItems(rawItems) {
  if (Array.isArray(rawItems)) return rawItems;
  if (typeof rawItems === "string") {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

      const tbody = document.getElementById("quickKOTBody");
      if (activeOnly.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No active kitchen tickets.</td></tr>`;
      } else {
        let rows = "";
        activeOnly.slice(0, 5).forEach(o => {
          const itemList = safeGetItems(o.items);
          const itemsSummary = itemList.map(i => `${i.name} (${i.quantity || 1})`).join(", ") || "No items specified";
          const statusBadge = `<span class="badge-pill status-${o.status}">${o.status}</span>`;
          rows += `
            <tr>
              <td><strong>${o.kotNo}</strong></td>
              <td>${o.type.toUpperCase()}</td>
              <td>${o.type === 'dine-in' ? o.tableNo : '-'}</td>
              <td>${o.name}</td>
              <td style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</td>
              <td>₹${o.totalAmount}</td>
              <td>${statusBadge}</td>
            </tr>
          `;
        });
        tbody.innerHTML = rows;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/*====================================================
        VIEW LOADER: KOT KITCHEN BOARD
====================================================*/
const kotBoardGrid = document.getElementById("kotBoardGrid");
const kotFilter = document.getElementById("kotFilter");

if (kotFilter) {
  kotFilter.addEventListener("change", loadKOTBoard);
}

async function loadKOTBoard() {
  if (!kotBoardGrid) return;
  kotBoardGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light);"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching active tickets...</div>`;

  try {
    const res = await adminFetch("/orders");
    if (!res.ok) throw new Error("Could not load orders");
    const orders = await res.json();

    const selectedFilter = kotFilter.value;
    let filteredOrders = orders;

    if (selectedFilter === "active") {
      filteredOrders = orders.filter(o => ["pending", "preparing", "served"].includes(o.status));
    } else if (selectedFilter !== "completed") {
      filteredOrders = orders.filter(o => o.status === selectedFilter);
    }

    if (filteredOrders.length === 0) {
      kotBoardGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 50px;">No KOT orders in this category.</div>`;
      return;
    }

    let cardsHtml = "";
    filteredOrders.forEach(o => {
      const timeStr = new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const notesHtml = o.notes ? `<div class="kot-notes"><strong>Notes:</strong> ${o.notes}</div>` : "";
      const tableDetail = o.type === "dine-in" ? `<strong>Table:</strong> ${o.tableNo}` : "<strong>Type:</strong> Takeaway";

      // Render Item rows safely
      const itemList = safeGetItems(o.items);
      let itemsListHtml = "";
      itemList.forEach(item => {
        itemsListHtml += `
          <div class="kot-item-row">
            <span class="kot-item-name">${item.name}</span>
            <span class="kot-item-qty">x${item.quantity || 1}</span>
          </div>
        `;
      });
      if (!itemsListHtml) {
        itemsListHtml = `<div class="kot-item-row"><span class="kot-item-name">No items specified</span></div>`;
      }

      // Render Status Select Options
      const statuses = ["pending", "preparing", "served", "completed", "cancelled"];
      let statusOptions = "";
      statuses.forEach(st => {
        statusOptions += `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st.toUpperCase()}</option>`;
      });

      cardsHtml += `
        <div class="kot-card status-${o.status}">
          <div class="kot-card-header">
            <div class="kot-id-col">
              <h4>${o.kotNo}</h4>
              <span class="kot-time">Placed at ${timeStr}</span>
            </div>
            <span class="kot-badge ${o.status}">${o.status}</span>
          </div>
          
          <div class="kot-cust-info">
            <div><strong>Cust:</strong> ${o.name} (${o.phone})</div>
            <div>${tableDetail}</div>
          </div>

          <div class="kot-items-list">
            ${itemsListHtml}
          </div>

          ${notesHtml}

          <div style="font-weight: 700; text-align: right; margin-bottom: 12px; font-size: 0.95rem;">Total: ₹${o.totalAmount}</div>

          <div class="kot-actions">
            <select class="kot-status-select" onchange="updateKOTStatus('${o._id}', this.value)">
              ${statusOptions}
            </select>
            <button class="print-kot-btn" title="Print KOT Ticket" onclick="printKOTTicket('${o._id}')">
              <i class="fa-solid fa-print"></i>
            </button>
          </div>
        </div>
      `;
    });

    kotBoardGrid.innerHTML = cardsHtml;
  } catch (err) {
    console.error(err);
    kotBoardGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Failed to load KOT board.</div>`;
  }
}

window.updateKOTStatus = async function(id, newStatus) {
  try {
    const res = await adminFetch(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error("Failed to update status");
    loadKOTBoard();
  } catch (err) {
    alert(err.message);
  }
};

window.printKOTTicket = async function(id) {
  try {
    const res = await adminFetch("/orders");
    const orders = await res.json();
    const order = orders.find(o => o._id === id);
    if (!order) return;

    // Create a temporary iframe to print the KOT ticket styled like a POS receipt
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const itemsRows = order.items.map(item => `
      <tr style="border-bottom: 1px dotted #000;">
        <td style="padding: 5px 0; text-align: left;">${item.name}</td>
        <td style="padding: 5px 0; text-align: right;">x${item.quantity}</td>
      </tr>
    `).join("");

    const dateStr = new Date(order.createdAt).toLocaleString();

    doc.write(`
      <html>
      <head>
        <title>Print KOT</title>
        <style>
          body { font-family: monospace; font-size: 14px; margin: 0; padding: 10px; width: 280px; }
          .center { text-align: center; }
          .dashed { border-bottom: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          .total { text-align: right; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h3 style="margin: 0;">HOTEL KHANDESH DARBAR</h3>
          <p style="margin: 3px 0;">KITCHEN ORDER TICKET</p>
        </div>
        <div class="dashed"></div>
        <div><strong>KOT No:</strong> ${order.kotNo}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
        <div><strong>Type:</strong> ${order.type.toUpperCase()}</div>
        ${order.type === 'dine-in' ? `<div><strong>Table No:</strong> ${order.tableNo}</div>` : ''}
        <div><strong>Customer:</strong> ${order.name}</div>
        <div class="dashed"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 5px;">Item Name</th>
              <th style="text-align: right; padding-bottom: 5px;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        ${order.notes ? `<div class="dashed"></div><div><strong>Notes:</strong> ${order.notes}</div>` : ''}
        <div class="dashed"></div>
        <div class="center" style="font-size: 10px; margin-top: 15px;">Send to Kitchen Order Queue</div>
      </body>
      </html>
    `);
    doc.close();

    // Print
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  } catch (err) {
    console.error("Print Error:", err);
  }
};

/*====================================================
        VIEW LOADER: TABLE BOOKINGS
====================================================*/
const bookingsTableBody = document.getElementById("bookingsTableBody");

async function loadBookingsTable() {
  if (!bookingsTableBody) return;
  bookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading reservations...</td></tr>`;

  try {
    const res = await adminFetch("/bookings");
    if (!res.ok) throw new Error("Could not fetch bookings");
    const bookings = await res.json();

    if (bookings.length === 0) {
      bookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No table bookings found.</td></tr>`;
      return;
    }

    let rows = "";
    bookings.forEach(b => {
      const dateFormatted = new Date(b.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
      const timeFormatted = b.time;
      const statusBadge = `<span class="badge-pill status-${b.status}">${b.status}</span>`;

      // Enable booking status controls
      let actionButtons = "";
      if (b.status === "pending") {
        actionButtons = `
          <button class="action-btn btn-confirm" onclick="updateBookingStatus('${b._id}', 'confirmed')">Confirm</button>
          <button class="action-btn btn-cancel" onclick="updateBookingStatus('${b._id}', 'cancelled')">Cancel</button>
        `;
      } else if (b.status === "confirmed") {
        actionButtons = `
          <button class="action-btn btn-confirm" style="background:#e1f5fe; color:var(--info);" onclick="updateBookingStatus('${b._id}', 'completed')">Complete</button>
        `;
      } else {
        actionButtons = `<span style="font-size:0.8rem; color:#aaa;">No actions</span>`;
      }

      rows += `
        <tr>
          <td><strong>${b.name}</strong></td>
          <td>${b.phone}</td>
          <td>${dateFormatted} at ${timeFormatted}</td>
          <td>${b.guests}</td>
          <td>${b.notes || '<span style="color:#ccc;">None</span>'}</td>
          <td>${statusBadge}</td>
          <td><div class="action-btns">${actionButtons}</div></td>
        </tr>
      `;
    });

    bookingsTableBody.innerHTML = rows;
  } catch (err) {
    console.error(err);
    bookingsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Failed to load bookings.</td></tr>`;
  }
}

window.updateBookingStatus = async function(id, newStatus) {
  try {
    const res = await adminFetch(`/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error("Could not update reservation status");
    loadBookingsTable();
  } catch (err) {
    alert(err.message);
  }
};

/*====================================================
        VIEW LOADER: MENU EDITOR (CRUD)
====================================================*/
const menuTableBody = document.getElementById("menuTableBody");
const menuItemModal = document.getElementById("menuItemModal");
const addNewMenuBtn = document.getElementById("addNewMenuBtn");
const closeMenuModalBtn = document.getElementById("closeMenuModalBtn");
const cancelMenuModalBtn = document.getElementById("cancelMenuModalBtn");
const menuItemForm = document.getElementById("menuItemForm");
const menuModalTitle = document.getElementById("menuModalTitle");

// Modal control
if (addNewMenuBtn) {
  addNewMenuBtn.addEventListener("click", () => {
    menuModalTitle.innerText = "Add Menu Dish";
    menuItemForm.reset();
    document.getElementById("menuItemId").value = "";
    document.getElementById("menuItemVeg").checked = true;
    document.getElementById("menuItemAvailable").checked = true;
    menuItemModal.classList.add("show");
  });
}

const hideMenuModal = () => {
  menuItemModal.classList.remove("show");
};

if (closeMenuModalBtn) closeMenuModalBtn.addEventListener("click", hideMenuModal);
if (cancelMenuModalBtn) cancelMenuModalBtn.addEventListener("click", hideMenuModal);

async function loadMenuTable() {
  if (!menuTableBody) return;
  menuTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading menu items...</td></tr>`;

  try {
    const res = await adminFetch("/menu");
    if (!res.ok) throw new Error("Could not fetch menu items");
    const items = await res.json();

    if (items.length === 0) {
      menuTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No menu items found.</td></tr>`;
      return;
    }

    let rows = "";
    items.forEach(item => {
      const vegIcon = item.veg ? `🟢 Veg` : `🔴 Non-Veg`;
      const availSwitch = `
        <label class="switch">
          <input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleItemAvailability('${item._id}', this.checked)">
          <span class="slider"></span>
        </label>
      `;

      const badges = [];
      if (item.badge) badges.push(item.badge);
      if (item.tag) badges.push(item.tag);
      const badgeText = badges.length ? badges.join(" / ") : '<span style="color:#ccc;">None</span>';

      rows += `
        <tr>
          <td><img src="../${item.image}" class="table-img" onerror="this.src='../images/logo.png'"></td>
          <td><strong>${item.name}</strong><br><span style="font-size:0.75rem; color:#888;">${item.description || ''}</span></td>
          <td><span class="badge-pill" style="background:#eee;">${item.category.toUpperCase()}</span></td>
          <td><strong>₹${item.price}</strong></td>
          <td>${vegIcon}</td>
          <td>${availSwitch}</td>
          <td>${badgeText}</td>
          <td>
            <div class="action-btns">
              <button class="action-btn btn-edit" onclick="openEditItemModal('${item._id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="action-btn btn-delete" onclick="deleteMenuItem('${item._id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    });

    menuTableBody.innerHTML = rows;
  } catch (err) {
    console.error(err);
    menuTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Failed to load menu list.</td></tr>`;
  }
}

window.toggleItemAvailability = async function(id, isAvailable) {
  try {
    const res = await adminFetch(`/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify({ available: isAvailable })
    });
    if (!res.ok) throw new Error("Could not toggle availability");
  } catch (err) {
    alert(err.message);
  }
};

window.openEditItemModal = async function(id) {
  try {
    const res = await adminFetch("/menu");
    const items = await res.json();
    const item = items.find(i => i._id === id);
    if (!item) return;

    menuModalTitle.innerText = "Edit Menu Dish";
    document.getElementById("menuItemId").value = item._id;
    document.getElementById("menuItemName").value = item.name;
    document.getElementById("menuItemCategory").value = item.category;
    document.getElementById("menuItemPrice").value = item.price;
    document.getElementById("menuItemImage").value = item.image;
    document.getElementById("menuItemDesc").value = item.description || "";
    document.getElementById("menuItemVeg").checked = item.veg;
    document.getElementById("menuItemAvailable").checked = item.available;
    document.getElementById("menuItemBadge").value = item.badge || "";
    document.getElementById("menuItemTag").value = item.tag || "";

    menuItemModal.classList.add("show");
  } catch (err) {
    alert("Error loading item details.");
  }
};

window.deleteMenuItem = async function(id) {
  if (!confirm("Are you sure you want to permanently delete this menu item? This will remove it from the public menu page.")) return;

  try {
    const res = await adminFetch(`/menu/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Could not delete item");
    loadMenuTable();
  } catch (err) {
    alert(err.message);
  }
};

// Form Add/Edit Submit
if (menuItemForm) {
  menuItemForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("menuItemId").value;
    const name = document.getElementById("menuItemName").value.trim();
    const category = document.getElementById("menuItemCategory").value;
    const price = Number(document.getElementById("menuItemPrice").value);
    const image = document.getElementById("menuItemImage").value.trim();
    const description = document.getElementById("menuItemDesc").value.trim();
    const veg = document.getElementById("menuItemVeg").checked;
    const available = document.getElementById("menuItemAvailable").checked;
    const badge = document.getElementById("menuItemBadge").value.trim();
    const tag = document.getElementById("menuItemTag").value.trim();

    const itemData = {
      name, category, price, image, description, veg, available, badge, tag
    };

    let url = "/menu";
    let method = "POST";

    if (id) {
      // Editing
      url = `/menu/${id}`;
      method = "PUT";
    }

    try {
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(itemData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save menu dish");
      }

      hideMenuModal();
      loadMenuTable();
    } catch (err) {
      alert(err.message);
    }
  });
}

/*====================================================
        VIEW LOADER: REVIEWS MODERATION
====================================================*/
const reviewsTableBody = document.getElementById("reviewsTableBody");

async function loadReviewsTable() {
  if (!reviewsTableBody) return;
  reviewsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching reviews...</td></tr>`;

  try {
    const res = await adminFetch("/reviews");
    if (!res.ok) throw new Error("Could not fetch reviews");
    const reviews = await res.json();

    if (reviews.length === 0) {
      reviewsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No reviews found.</td></tr>`;
      return;
    }

    let rows = "";
    reviews.forEach(r => {
      const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
      const statusBadge = r.approved 
        ? `<span class="badge-pill status-confirmed">Approved</span>`
        : `<span class="badge-pill status-pending">Pending Approval</span>`;

      const actionBtn = r.approved
        ? `<button class="action-btn btn-cancel" onclick="updateReviewApproval('${r._id}', false)">Reject</button>`
        : `<button class="action-btn btn-confirm" onclick="updateReviewApproval('${r._id}', true)">Approve</button>`;

      rows += `
        <tr>
          <td><strong>${r.name}</strong><br><span style="font-size:0.75rem; color:#888;">${r.role || 'Google Review'}</span></td>
          <td style="color:#f5b301; font-size:1.1rem;">${stars}</td>
          <td style="max-width:350px;">"${r.text}"</td>
          <td>${r.source.toUpperCase()}</td>
          <td>${statusBadge}</td>
          <td><div class="action-btns">${actionBtn}</div></td>
        </tr>
      `;
    });

    reviewsTableBody.innerHTML = rows;
  } catch (err) {
    console.error(err);
    reviewsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Failed to load reviews.</td></tr>`;
  }
}

window.updateReviewApproval = async function(id, isApproved) {
  try {
    const res = await adminFetch(`/reviews/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approved: isApproved })
    });
    if (!res.ok) throw new Error("Could not update approval status");
    loadReviewsTable();
  } catch (err) {
    alert(err.message);
  }
};

/*====================================================
        VIEW LOADER: NEWSLETTER SUBSCRIBERS
====================================================*/
const subscribersTableBody = document.getElementById("subscribersTableBody");

async function loadSubscribersTable() {
  if (!subscribersTableBody) return;
  subscribersTableBody.innerHTML = `<tr><td colspan="2" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching subscribers...</td></tr>`;

  try {
    const res = await adminFetch("/subscribers");
    if (!res.ok) throw new Error("Could not fetch subscribers");
    const subs = await res.json();

    if (subs.length === 0) {
      subscribersTableBody.innerHTML = `<tr><td colspan="2" style="text-align: center;">No email subscribers found.</td></tr>`;
      return;
    }

    let rows = "";
    subs.forEach(s => {
      const dateStr = new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
      rows += `
        <tr>
          <td><strong>${s.email}</strong></td>
          <td>${dateStr}</td>
        </tr>
      `;
    });

    subscribersTableBody.innerHTML = rows;
  } catch (err) {
    console.error(err);
    subscribersTableBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: red;">Failed to load subscribers list.</td></tr>`;
  }
}

/*====================================================
        VIEW LOADER: MONTHLY MESS SUBSCRIPTIONS
====================================================*/
const messSubscriptionsTableBody = document.getElementById("messSubscriptionsTableBody");
let messSubscriptions = [];

async function loadMessTable() {
  if (!messSubscriptionsTableBody) return;
  messSubscriptionsTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center;"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading subscriptions...</td></tr>`;

  try {
    const res = await adminFetch("/mess-subscriptions");
    if (!res.ok) throw new Error("Failed to load mess subscriptions");
    messSubscriptions = await res.json();

    if (messSubscriptions.length === 0) {
      messSubscriptionsTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center;">No mess subscriptions found.</td></tr>`;
      return;
    }

    const planLabels = {
      "standard-1": "साधी मेस (1 Meal)",
      "standard-2": "साधी मेस (2 Meals)",
      "khandeshi-1": "खान्देशी स्पेशल (1 Meal)",
      "khandeshi-2": "खान्देशी स्पेशल (2 Meals)"
    };

    const timingLabels = {
      "lunch": "Lunch Only",
      "dinner": "Dinner Only",
      "both": "Lunch & Dinner"
    };

    let rows = "";
    messSubscriptions.forEach(s => {
      const planName = planLabels[s.plan] || s.plan;
      const timingText = timingLabels[s.timing] || s.timing;
      
      // Calculate Expiry and Days Left
      let expiryText = s.endDate || "-";
      let daysLeftText = "-";
      let diffDays = 999;
      
      if (s.endDate) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const expiry = new Date(s.endDate);
        expiry.setHours(0,0,0,0);
        const diffTime = expiry - today;
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          daysLeftText = `<span style="color: #c62828; font-weight: 600;">Expired (${Math.abs(diffDays)}d ago)</span>`;
        } else if (diffDays === 0) {
          daysLeftText = `<span style="color: #ff8f00; font-weight: 600;">Expires Today</span>`;
        } else {
          daysLeftText = `<span style="color: #2e7d32; font-weight: 600;">${diffDays} days left</span>`;
        }
      }

      let statusStyle = "";
      if (s.status === "pending") statusStyle = "background: #fff8e1; color: #b78103; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 0.8rem;";
      else if (s.status === "active") statusStyle = "background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 0.8rem;";
      else if (s.status === "suspended") statusStyle = "background: #efebe9; color: #5d4037; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 0.8rem;";
      else statusStyle = "background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 4px; font-weight: 500; font-size: 0.8rem;";

      // Check if active or pending to render WhatsApp notifications
      let waButtonHtml = "";
      const cleanPhone = s.phone.replace(/\D/g, ""); // strip non-numeric
      const countryPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
      
      if (s.status === "active") {
        if (diffDays <= 3 && diffDays >= 0) {
          const text = `नमस्कार ${s.name}, तुमची हॉटेल खान्देश दरबारची मासिक मेस पुढील ${diffDays} दिवसांत (${s.endDate}) संपणार आहे. मेस पुढेही सुरू ठेवण्यासाठी कृपया तुमचे पेमेंट जमा करा. धन्यवाद!`;
          waButtonHtml = `
            <a href="https://wa.me/${countryPhone}?text=${encodeURIComponent(text)}" target="_blank" class="status-btn" style="background: #e53935; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Send Expiry Reminder">
              <i class="fa-brands fa-whatsapp"></i> Remind (${diffDays}d)
            </a>
          `;
        } else {
          const text = `नमस्कार ${s.name}, हॉटेल खान्देश दरबारमध्ये तुमची मासिक मेस यशस्वीरित्या सुरू झाली आहे. कालावधी: ${s.startDate} ते ${s.endDate || '३0 दिवस'}. आमच्यावर विश्वास ठेवल्याबद्दल धन्यवाद!`;
          waButtonHtml = `
            <a href="https://wa.me/${countryPhone}?text=${encodeURIComponent(text)}" target="_blank" class="status-btn" style="background: #2e7d32; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Send Welcome Message">
              <i class="fa-brands fa-whatsapp"></i> Send Welcome
            </a>
          `;
        }
      } else if (s.status === "pending") {
        const text = `नमस्कार ${s.name}, तुमचा हॉटेल खान्देश दरबार मासिक मेससाठीचा अर्ज मिळाला आहे. मेस सुरू करण्यासाठी कृपया खातरजमा करा व पेमेंट पूर्ण करा. धन्यवाद!`;
        waButtonHtml = `
          <a href="https://wa.me/${countryPhone}?text=${encodeURIComponent(text)}" target="_blank" class="status-btn" style="background: #0288d1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Send Pending Notice">
            <i class="fa-brands fa-whatsapp"></i> Notify
          </a>
        `;
      }

      const actionsHtml = `
        <div style="display: flex; flex-direction: column; gap: 5px;">
          <button class="status-btn edit" onclick="openMessEditModal('${s._id}')" style="background: var(--gold); color: #1a1a1a; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          ${waButtonHtml}
          <button class="status-btn cancel" onclick="deleteMessSubscription('${s._id}', '${s.name.replace(/'/g, "\\'")}')" style="background: #e53935; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" title="Delete Subscription Permanently">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      `;

      rows += `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.phone}</td>
          <td>${planName}<br><small style="color: #666;">(${timingText})</small></td>
          <td>${s.startDate}</td>
          <td>${expiryText}</td>
          <td>${daysLeftText}</td>
          <td style="max-width: 150px; white-space: normal; font-size: 0.8rem; color: #555;">${s.notes || '-'}</td>
          <td style="max-width: 150px; white-space: normal; font-size: 0.8rem; color: #a52a2a; font-weight: 500;">${s.adminNotes || '-'}</td>
          <td><span style="${statusStyle}">${s.status.toUpperCase()}</span></td>
          <td>${actionsHtml}</td>
        </tr>
      `;
    });

    messSubscriptionsTableBody.innerHTML = rows;
  } catch (err) {
    console.error(err);
    messSubscriptionsTableBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: red;">Failed to load mess subscriptions.</td></tr>`;
  }
}

// Edit Modal Toggles
const messDetailsModal = document.getElementById("messDetailsModal");
const closeMessDetailsModalBtn = document.getElementById("closeMessDetailsModalBtn");
const cancelMessDetailsModalBtn = document.getElementById("cancelMessDetailsModalBtn");
const messDetailsForm = document.getElementById("messDetailsForm");

window.openMessEditModal = function(id) {
  const sub = messSubscriptions.find(s => s._id === id);
  if (!sub) return;

  document.getElementById("editMessId").value = sub._id;
  document.getElementById("editMessName").value = sub.name;
  document.getElementById("editMessPlan").value = sub.plan;
  document.getElementById("editMessTiming").value = sub.timing;
  document.getElementById("editMessStartDate").value = sub.startDate;
  document.getElementById("editMessEndDate").value = sub.endDate || "";
  document.getElementById("editMessStatus").value = sub.status;
  document.getElementById("editMessAdminNotes").value = sub.adminNotes || "";

  if (messDetailsModal) {
    messDetailsModal.style.display = "flex";
  }
};

const closeMessEdit = () => {
  if (messDetailsModal) messDetailsModal.style.display = "none";
};

if (closeMessDetailsModalBtn) closeMessDetailsModalBtn.addEventListener("click", closeMessEdit);
if (cancelMessDetailsModalBtn) cancelMessDetailsModalBtn.addEventListener("click", closeMessEdit);

// Form Submission
if (messDetailsForm) {
  messDetailsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editMessId").value;
    const plan = document.getElementById("editMessPlan").value;
    const timing = document.getElementById("editMessTiming").value;
    const startDate = document.getElementById("editMessStartDate").value;
    const endDate = document.getElementById("editMessEndDate").value;
    const status = document.getElementById("editMessStatus").value;
    const adminNotes = document.getElementById("editMessAdminNotes").value.trim();

    try {
      const res = await adminFetch(`/mess-subscriptions/${id}`, {
        method: "PUT",
        body: JSON.stringify({ plan, timing, startDate, endDate, status, adminNotes })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update subscription");
      }

      closeMessEdit();
      loadMessTable();
    } catch (err) {
      alert(err.message || "Error updating subscription.");
    }
  });
}

window.deleteMessSubscription = async function(id, name) {
  if (!confirm(`Are you sure you want to permanently delete subscription for ${name}? This will remove all their details from the database and dashboard.`)) {
    return;
  }

  try {
    const res = await adminFetch(`/mess-subscriptions/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete subscription");
    }

    loadMessTable();
  } catch (err) {
    console.error(err);
    alert(err.message || "Error deleting subscription.");
  }
};

/*====================================================
        FILE UPLOAD LOGIC
====================================================*/
const imageUploadInput = document.getElementById("imageUploadInput");
const menuItemImage = document.getElementById("menuItemImage");
const uploadStatusText = document.getElementById("uploadStatusText");

if (imageUploadInput && menuItemImage) {
  imageUploadInput.addEventListener("change", async () => {
    const file = imageUploadInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    if (uploadStatusText) {
      uploadStatusText.innerText = "⏳ Uploading image file...";
      uploadStatusText.style.color = "var(--primary)";
    }

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to upload image file");
      }

      const result = await res.json();
      menuItemImage.value = result.imagePath;

      if (uploadStatusText) {
        uploadStatusText.innerText = "✅ Image uploaded successfully!";
        uploadStatusText.style.color = "#2e7d32";
      }
    } catch (err) {
      console.error(err);
      if (uploadStatusText) {
        uploadStatusText.innerText = `❌ Error: ${err.message}`;
        uploadStatusText.style.color = "#c62828";
      }
    }
  });
}

/*====================================================
        INITIALISATION ENTRYPOINT
====================================================*/
checkAuth();
