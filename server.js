require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/api", require("./routes/public"));
app.use("/api/admin", require("./routes/admin"));

// Serve Admin Panel Index explicitly if needed
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/index.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;

async function startServer() {
  // First connect to DB (which chooses Mongoose vs. JSON-file fallback)
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Hotel Khandesh Darbar Server Running On Port ${PORT}`);
    console.log(`  Frontend: http://localhost:${PORT}`);
    console.log(`  Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`====================================================`);
  });
}

startServer();
