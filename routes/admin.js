const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Booking = require("../models/Booking");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Review = require("../models/Review");
const Subscriber = require("../models/Subscriber");
const MessSubscription = require("../models/MessSubscription");

const { requireAuth } = require("../middleware/auth");

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password." });
    }

    // Find admin by email
    // Mongoose requires .select("+password") since password has select: false,
    // but in local JSON fallback, we select it automatically or handle it.
    // Find admin by email using unified proxy interface
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Verify password
    let isMatch = false;
    if (typeof admin.comparePassword === "function") {
      isMatch = await admin.comparePassword(password);
    } else {
      // Direct compare in fallback if not attached or direct encryption check
      const bcrypt = require("bcryptjs");
      isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: admin._id, name: admin.name, role: admin.role },
      process.env.JWT_SECRET || "khandesh_darbar_secret_key_12345",
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful!",
      token,
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

// Protect all endpoints below this line
router.use(requireAuth);

// Get current admin info
router.get("/me", (req, res) => {
  res.json(req.admin);
});

// Change Admin Email & Password
router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const admin = await Admin.findById(req.admin.id).select("+password");
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found." });
    }

    const bcrypt = require("bcryptjs");
    let isMatch = false;
    if (typeof admin.comparePassword === "function") {
      isMatch = await admin.comparePassword(currentPassword);
    } else {
      isMatch = await bcrypt.compare(currentPassword, admin.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateObj = { password: hashedPassword };
    if (newEmail && newEmail.trim()) {
      updateObj.email = newEmail.trim().toLowerCase();
    }

    await Admin.findByIdAndUpdate(req.admin.id, updateObj);

    res.json({ message: "Admin credentials updated successfully! Please log in again with your new password." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Error updating credentials", error: err.message });
  }
});

// Get Admin Stats Dashboard
router.get("/stats", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({});
    const pendingBookings = await Booking.countDocuments({ status: "pending" });
    const totalOrders = await Order.countDocuments({});
    const activeOrders = await Order.countDocuments({
      status: { $in: ["pending", "preparing", "served"] }
    });

    const orders = await Order.find({});
    let totalSales = 0;
    orders.forEach(o => {
      if (o.status === "completed" || o.status === "served") {
        totalSales += o.totalAmount;
      }
    });

    const totalMenu = await MenuItem.countDocuments({});

    res.json({
      totalBookings,
      pendingBookings,
      totalOrders,
      activeOrders,
      totalSales,
      totalMenu
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
});

// Get all orders (KOTs)
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({});
    // Sort in code or query depending on DB. Local fallback returns array.
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

// Update order / KOT status
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json({ message: "Order status updated!", order });
  } catch (err) {
    res.status(500).json({ message: "Error updating order status", error: err.message });
  }
});

// Get all table bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({});
    const sorted = [...bookings].sort((a, b) => new Date(b.date + "T" + b.time) - new Date(a.date + "T" + a.time));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings", error: err.message });
  }
});

// Update Booking Status
router.put("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json({ message: "Booking status updated!", booking });
  } catch (err) {
    res.status(500).json({ message: "Error updating booking status", error: err.message });
  }
});

// Get subscribers list
router.get("/subscribers", async (req, res) => {
  try {
    const subs = await Subscriber.find({});
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching subscribers", error: err.message });
  }
});

// Get reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({});
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reviews", error: err.message });
  }
});

// Approve review
router.put("/reviews/:id/approve", async (req, res) => {
  try {
    const { approved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review status updated", review });
  } catch (err) {
    res.status(500).json({ message: "Error approving review", error: err.message });
  }
});

// Get all menu items for editor
router.get("/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error fetching menu items", error: err.message });
  }
});

// Add new menu item
router.post("/menu", async (req, res) => {
  try {
    const { name, category, price, image, description, veg, badge, tag } = req.body;
    if (!name || !category || !price || !image) {
      return res.status(400).json({ message: "Name, category, price, and image are required." });
    }

    const item = await MenuItem.create({
      name,
      category,
      price: Number(price),
      image,
      description: description || "",
      veg: veg !== undefined ? veg : true,
      badge: badge || "",
      tag: tag || "",
      available: true
    });

    res.status(201).json({ message: "Menu item created!", item });
  } catch (err) {
    res.status(500).json({ message: "Error creating menu item", error: err.message });
  }
});

// Update Menu Item
router.put("/menu/:id", async (req, res) => {
  try {
    const { name, category, price, image, description, veg, badge, tag, available } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price: price !== undefined ? Number(price) : undefined,
        image,
        description,
        veg,
        badge,
        tag,
        available
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    res.json({ message: "Menu item updated!", item });
  } catch (err) {
    res.status(500).json({ message: "Error updating menu item", error: err.message });
  }
});

// Delete Menu Item
router.delete("/menu/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }
    res.json({ message: "Menu item deleted!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting menu item", error: err.message });
  }
});

// Get all mess subscriptions
router.get("/mess-subscriptions", async (req, res) => {
  try {
    const subs = await MessSubscription.find({});
    const sorted = [...subs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching mess subscriptions", error: err.message });
  }
});

// Update mess subscription status
router.put("/mess-subscriptions/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }

    const sub = await MessSubscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!sub) {
      return res.status(404).json({ message: "Mess subscription not found." });
    }

    res.json({ message: "Mess subscription updated!", subscription: sub });
  } catch (err) {
    res.status(500).json({ message: "Error updating mess subscription", error: err.message });
  }
});

// Update/Edit complete mess subscription details (including notes, dates, plan)
router.put("/mess-subscriptions/:id", async (req, res) => {
  try {
    const { plan, timing, startDate, endDate, adminNotes, status } = req.body;
    const updateData = {};
    
    if (plan) updateData.plan = plan;
    if (timing) updateData.timing = timing;
    
    if (startDate) {
      updateData.startDate = startDate;
      // Calculate end date automatically if start date is updated but no end date is provided
      if (!endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
          updateData.endDate = end.toISOString().split("T")[0];
        } catch (e) {}
      }
    }
    
    if (endDate) updateData.endDate = endDate;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (status) updateData.status = status;

    const sub = await MessSubscription.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!sub) {
      return res.status(404).json({ message: "Mess subscription not found." });
    }

    res.json({ message: "Mess subscription updated successfully!", subscription: sub });
  } catch (err) {
    res.status(500).json({ message: "Error updating subscription details", error: err.message });
  }
});

// Delete mess subscription permanently
router.delete("/mess-subscriptions/:id", async (req, res) => {
  try {
    const sub = await MessSubscription.findByIdAndDelete(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: "Mess subscription not found." });
    }
    res.json({ message: "Mess subscription deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting mess subscription", error: err.message });
  }
});

/*====================================================
        FILE UPLOAD CONTROLLER (MULTER)
====================================================*/
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const imagesDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|avif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpg, jpeg, png, webp, avif) are allowed!"));
  }
});

// Image upload route
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }
    res.json({
      message: "Image uploaded successfully!",
      imagePath: `images/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
});

module.exports = router;
