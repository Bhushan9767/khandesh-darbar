// Integration Test & Verification Script for Hotel Khandesh Darbar Backend
process.env.PORT = 5001; // Run on test port
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/khandesh_darbar";
process.env.JWT_SECRET = "test_jwt_secret_key_999";

const assert = require("assert");

// Start server
console.log("Starting server for integration testing...");
require("./server");

// Wait 2 seconds for server and DB connection to initialize
setTimeout(runTests, 2000);

async function runTests() {
  const BASE_URL = "http://localhost:5001/api";
  let adminToken = "";
  let testOrderId = "";
  let testBookingId = "";

  console.log("\n====================================================");
  console.log("           STARTING INTEGRATION TESTS                ");
  console.log("====================================================\n");

  try {
    // 1. Test Menu Retrieval
    console.log("Testing GET /api/menu...");
    const menuRes = await fetch(`${BASE_URL}/menu`);
    assert.strictEqual(menuRes.status, 200);
    const menu = await menuRes.json();
    assert.ok(Array.isArray(menu), "Menu should be an array");
    assert.ok(menu.length > 0, "Menu should have seeded items");
    console.log(`-> SUCCESS: Fetched ${menu.length} menu items.`);

    // 2. Test Table Booking
    console.log("Testing POST /api/bookings...");
    const bookingData = {
      name: "Test Customer",
      phone: "9876543210",
      email: "test@customer.com",
      date: "2026-08-01",
      time: "19:30",
      guests: "4 Guests",
      notes: "Window table please"
    };
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData)
    });
    assert.strictEqual(bookingRes.status, 201);
    const bookingResult = await bookingRes.json();
    assert.strictEqual(bookingResult.booking.name, "Test Customer");
    testBookingId = bookingResult.booking._id;
    console.log(`-> SUCCESS: Table booking placed successfully. Booking ID: ${testBookingId}`);

    // 3. Test Cart Order / KOT Generation
    console.log("Testing POST /api/orders (KOT)...");
    const orderData = {
      name: "KOT Test User",
      phone: "9999988888",
      type: "dine-in",
      tableNo: "Table 4",
      items: [
        { name: "Unlimited Khandeshi Special Thali", price: 299, quantity: 2 },
        { name: "Bharit Bhakri", price: 180, quantity: 1 }
      ],
      notes: "Extra spicy shev"
    };
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    assert.strictEqual(orderRes.status, 201);
    const orderResult = await orderRes.json();
    assert.ok(orderResult.order.kotNo.startsWith("KOT-"), "KOT number should start with 'KOT-'");
    assert.strictEqual(orderResult.order.totalAmount, (299 * 2) + 180);
    testOrderId = orderResult.order._id;
    console.log(`-> SUCCESS: Order placed and KOT generated: ${orderResult.order.kotNo}`);

    // 4. Test Admin Login
    console.log("Testing POST /api/admin/login...");
    const loginData = {
      email: "admin@khandeshdarbar.in",
      password: "admin123"
    };
    const loginRes = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData)
    });
    assert.strictEqual(loginRes.status, 200);
    const loginResult = await loginRes.json();
    assert.ok(loginResult.token, "Token should be returned on login");
    adminToken = loginResult.token;
    console.log(`-> SUCCESS: Admin login authenticated. Token received.`);

    // 5. Test Authenticated Stats Endpoint
    console.log("Testing GET /api/admin/stats...");
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    const stats = await statsRes.json();
    assert.ok(stats.totalBookings > 0, "Total bookings stats should be tracked");
    assert.ok(stats.totalOrders > 0, "Total orders stats should be tracked");
    console.log(`-> SUCCESS: Stats fetched. Bookings: ${stats.totalBookings}, Orders: ${stats.totalOrders}`);

    // 6. Test Updating KOT Status
    console.log("Testing PUT /api/admin/orders/:id/status...");
    const statusUpdateRes = await fetch(`${BASE_URL}/admin/orders/${testOrderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "preparing" })
    });
    assert.strictEqual(statusUpdateRes.status, 200);
    const updateResult = await statusUpdateRes.json();
    assert.strictEqual(updateResult.order.status, "preparing");
    console.log(`-> SUCCESS: KOT status updated to 'preparing'.`);

    // 7. Test Updating Booking Status
    console.log("Testing PUT /api/admin/bookings/:id/status...");
    const bookingUpdateRes = await fetch(`${BASE_URL}/admin/bookings/${testBookingId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "confirmed" })
    });
    assert.strictEqual(bookingUpdateRes.status, 200);
    const bookingUpdateResult = await bookingUpdateRes.json();
    assert.strictEqual(bookingUpdateResult.booking.status, "confirmed");
    console.log(`-> SUCCESS: Booking status updated to 'confirmed'.`);

    // 8. Test Monthly Mess Subscription
    console.log("Testing POST /api/mess-subscriptions...");
    const messData = {
      name: "Student Mesh User",
      phone: "8888877777",
      plan: "standard-2",
      timing: "both",
      startDate: "2026-08-01",
      notes: "Chapati only"
    };
    const messRes = await fetch(`${BASE_URL}/mess-subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messData)
    });
    assert.strictEqual(messRes.status, 201);
    const messResult = await messRes.json();
    assert.strictEqual(messResult.subscription.name, "Student Mesh User");
    const testMessId = messResult.subscription._id;
    console.log(`-> SUCCESS: Mess subscription placed. ID: ${testMessId}`);

    // 9. Test Admin Retrieving Mess Subscriptions
    console.log("Testing GET /api/admin/mess-subscriptions...");
    const messGetRes = await fetch(`${BASE_URL}/admin/mess-subscriptions`, {
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    assert.strictEqual(messGetRes.status, 200);
    const messList = await messGetRes.json();
    assert.ok(Array.isArray(messList), "Mess subscriptions list should be an array");
    assert.ok(messList.length > 0, "List should contain the created subscription");
    console.log(`-> SUCCESS: Fetched ${messList.length} mess subscriptions.`);

    // 10. Test Admin Updating Mess Subscription Status
    console.log("Testing PUT /api/admin/mess-subscriptions/:id/status...");
    const messUpdateRes = await fetch(`${BASE_URL}/admin/mess-subscriptions/${testMessId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: "active" })
    });
    assert.strictEqual(messUpdateRes.status, 200);
    const messUpdateResult = await messUpdateRes.json();
    assert.strictEqual(messUpdateResult.subscription.status, "active");
    console.log(`-> SUCCESS: Mess subscription status updated to 'active'.`);

    // 11. Test Admin Deleting Mess Subscription
    console.log("Testing DELETE /api/admin/mess-subscriptions/:id...");
    const messDeleteRes = await fetch(`${BASE_URL}/admin/mess-subscriptions/${testMessId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${adminToken}`
      }
    });
    assert.strictEqual(messDeleteRes.status, 200);
    const messDeleteResult = await messDeleteRes.json();
    assert.strictEqual(messDeleteResult.message, "Mess subscription deleted successfully!");
    console.log(`-> SUCCESS: Mess subscription deleted successfully.`);

    // 12. Test Static Sitemap & Robots.txt
    console.log("Testing GET /sitemap.xml & /robots.txt...");
    const sitemapRes = await fetch("http://localhost:5001/sitemap.xml");
    assert.strictEqual(sitemapRes.status, 200);
    const robotsRes = await fetch("http://localhost:5001/robots.txt");
    assert.strictEqual(robotsRes.status, 200);
    console.log("-> SUCCESS: sitemap.xml and robots.txt are reachable.");

    console.log("\n====================================================");
    console.log("      ALL INTEGRATION TESTS PASSED SUCCESSFULLY!     ");
    console.log("====================================================\n");
    process.exit(0);

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    console.error(err);
    process.exit(1);
  }
}
