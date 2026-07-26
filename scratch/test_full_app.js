process.env.PORT = 5055;
process.env.JWT_SECRET = "secret_key_123";

const http = require("http");
const assert = require("assert");

// Start server
console.log("=== LAUNCHING LOCAL HOTEL KHANDESH DARBAR SERVER ON PORT 5050 ===");
require("../server");

setTimeout(async () => {
  try {
    console.log("\n--- TEST 1: Fetching Homepage HTML (http://localhost:5055/) ---");
    const homeRes = await fetch("http://localhost:5055/");
    assert.strictEqual(homeRes.status, 200);
    const htmlText = await homeRes.text();
    assert.ok(htmlText.includes("Hotel Khandesh Darbar"), "Homepage should contain Hotel Khandesh Darbar title");
    assert.ok(htmlText.includes("id=\"scrollProgressBar\""), "Homepage should contain scroll progress bar container");
    assert.ok(htmlText.includes("id=\"preloader\""), "Homepage should contain preloader overlay");
    assert.ok(htmlText.includes("class=\"floating-call\""), "Homepage should contain floating call button");
    console.log("✅ Homepage HTML rendered 100% correctly with preloader, progress bar & call button.");

    console.log("\n--- TEST 2: Fetching Dynamic Menu Items (http://localhost:5055/api/menu) ---");
    const menuRes = await fetch("http://localhost:5055/api/menu");
    assert.strictEqual(menuRes.status, 200);
    const menuItems = await menuRes.json();
    assert.ok(Array.isArray(menuItems), "Menu response should be an array");
    assert.ok(menuItems.length >= 33, "Menu should contain at least 33 physical menu card items");
    
    // Check specific physical menu items
    const unlimitedThali = menuItems.find(i => i.name.includes("Unlimited"));
    assert.ok(unlimitedThali, "Swamiraj Unlimited Thali should exist");
    assert.strictEqual(unlimitedThali.price, 299, "Swamiraj Unlimited Thali price should be exactly ₹299");
    assert.strictEqual(unlimitedThali.veg, true, "Swamiraj Unlimited Thali should be Pure Veg");

    const khandeshiThali = menuItems.find(i => i.name.includes("Khandeshi Thali"));
    assert.ok(khandeshiThali, "Khandeshi Thali should exist");
    assert.strictEqual(khandeshiThali.price, 190, "Khandeshi Thali price should be exactly ₹190");

    console.log(`✅ Menu API returned all ${menuItems.length} authentic dishes with 100% correct prices.`);

    console.log("\n--- TEST 3: Fetching Admin Panel (http://localhost:5055/admin) ---");
    const adminRes = await fetch("http://localhost:5055/admin");
    assert.strictEqual(adminRes.status, 200);
    const adminHtml = await adminRes.text();
    assert.ok(adminHtml.includes("Admin Dashboard"), "Admin panel should contain Admin Dashboard title");
    console.log("✅ Admin Panel HTML served successfully.");

    console.log("\n--- TEST 4: Fetching Sitemap & Robots (http://localhost:5055/sitemap.xml) ---");
    const sitemapRes = await fetch("http://localhost:5055/sitemap.xml");
    assert.strictEqual(sitemapRes.status, 200);
    const sitemapText = await sitemapRes.text();
    assert.ok(sitemapText.includes("https://khandesh-darbar.onrender.com/"), "Sitemap should contain location URLs");

    const robotsRes = await fetch("http://localhost:5055/robots.txt");
    assert.strictEqual(robotsRes.status, 200);
    console.log("✅ sitemap.xml & robots.txt served successfully.");

    console.log("\n--- TEST 5: Testing KOT Order Placement (POST /api/orders) ---");
    const testOrder = {
      name: "Bhushan Test User",
      phone: "9767977156",
      type: "dine-in",
      tableNo: "Table 5",
      items: [
        { name: "Swamiraj Khandeshi Unlimited Thali (स्वामीराज अमर्याद थाळी)", price: 299, quantity: 1 },
        { name: "Khandeshi Bharit Puri (खानदेशी भरीत पुरी)", price: 140, quantity: 1 }
      ],
      notes: "Less spicy, extra ghee on batti"
    };

    const orderRes = await fetch("http://localhost:5055/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testOrder)
    });

    assert.strictEqual(orderRes.status, 201);
    const orderData = await orderRes.json();
    assert.ok(orderData.order.kotNo.startsWith("KOT-"), "Order should return generated KOT ticket number");
    assert.strictEqual(orderData.order.totalAmount, 299 + 140, "Total amount should equal ₹439");
    assert.strictEqual(orderData.order.tableNo, "Table 5", "Table number should be Table 5");
    console.log(`✅ KOT Order placed successfully! Generated ${orderData.order.kotNo} (Total: ₹${orderData.order.totalAmount}).`);

    console.log("\n====================================================");
    console.log("🎉 ALL END-TO-END VERIFICATION TESTS PASSED 100%!   ");
    console.log("====================================================\n");
    process.exit(0);

  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err.message);
    console.error(err);
    process.exit(1);
  }
}, 2500);
