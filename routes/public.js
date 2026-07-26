const express = require("express");
const router = express.Router();

const MenuItem = require("../models/MenuItem");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Subscriber = require("../models/Subscriber");
const Order = require("../models/Order");
const MessSubscription = require("../models/MessSubscription");

// Get active menu items
router.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching menu items", error: err.message });
  }
});

// Book a table
router.post("/bookings", async (req, res) => {
  try {
    const { name, phone, email, date, time, guests, notes } = req.body;
    
    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    const booking = await Booking.create({
      name,
      phone,
      email: email || "",
      date,
      time,
      guests,
      notes: notes || "",
      status: "pending",
      source: "website"
    });

    res.status(201).json({ message: "Table booking request received!", booking });
  } catch (err) {
    res.status(500).json({ message: "Error saving booking", error: err.message });
  }
});

// Post a review
router.post("/reviews", async (req, res) => {
  try {
    const { name, text, rating } = req.body;
    if (!name || !text || !rating) {
      return res.status(400).json({ message: "Please provide name, text, and rating." });
    }

    const review = await Review.create({
      name,
      role: "Customer Review",
      rating: Number(rating),
      text,
      approved: true, // auto-approve for demonstration, can be switched to false
      source: "manual"
    });

    res.status(201).json({ message: "Thank you for your feedback!", review });
  } catch (err) {
    res.status(500).json({ message: "Error submitting review", error: err.message });
  }
});

// Get approved reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
});

// Subscribe to newsletter
router.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "You are already subscribed!" });
    }

    const subscriber = await Subscriber.create({
      email: email.toLowerCase()
    });

    res.status(201).json({ message: "Subscription successful!", subscriber });
  } catch (err) {
    res.status(500).json({ message: "Error subscribing", error: err.message });
  }
});

// Place KOT Order (Checkout Cart)
router.post("/orders", async (req, res) => {
  try {
    const { name, phone, type, tableNo, items, notes } = req.body;

    if (!name || !phone || !type || !items || !items.length) {
      return res.status(400).json({ message: "Missing required order details." });
    }

    if (type === "dine-in" && !tableNo) {
      return res.status(400).json({ message: "Table number is required for Dine-in orders." });
    }

    // Calculate total price
    let totalAmount = 0;
    const formattedItems = [];

    for (let item of items) {
      const price = Number(item.price);
      const qty = Number(item.quantity) || 1;
      if (!item.name || isNaN(price)) {
        return res.status(400).json({ message: "Invalid items in cart." });
      }
      totalAmount += price * qty;
      formattedItems.push({
        name: item.name,
        price: price,
        quantity: qty
      });
    }

    // Generate KOT ID
    const count = await Order.countDocuments({});
    const nextNum = 1000 + count + 1;
    const kotNo = `KOT-${nextNum}`;

    const order = await Order.create({
      kotNo,
      name,
      phone,
      type,
      tableNo: type === "dine-in" ? tableNo : "",
      items: formattedItems,
      totalAmount,
      notes: notes || "",
      status: "pending"
    });

    res.status(201).json({ message: "Order placed! Kitchen Ticket generated.", order });
  } catch (err) {
    res.status(500).json({ message: "Error placing order", error: err.message });
  }
});

// Join monthly mess system
router.post("/mess-subscriptions", async (req, res) => {
  try {
    const { name, phone, plan, startDate, timing, notes } = req.body;
    if (!name || !phone || !plan || !startDate || !timing) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Explicitly calculate end date (30 days from start date)
    let endDate = "";
    try {
      const start = new Date(startDate);
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      endDate = end.toISOString().split("T")[0];
    } catch (e) {
      endDate = startDate;
    }

    const subscription = await MessSubscription.create({
      name,
      phone,
      plan,
      startDate,
      endDate,
      timing,
      notes: notes || "",
      adminNotes: "",
      status: "pending"
    });

    res.status(201).json({ message: "Mess subscription request received! We will contact you soon.", subscription });
  } catch (err) {
    res.status(500).json({ message: "Error saving mess subscription", error: err.message });
  }
});

module.exports = router;
