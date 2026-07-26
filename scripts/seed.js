require("dotenv").config();
const { connectDB } = require("../config/db");

// Load models
const Admin = require("../models/Admin");
const MenuItem = require("../models/MenuItem");

// Load seed data from JSON
const seedData = require("../config/seedData.json");
const defaultAdmin = seedData.defaultAdmin;
const defaultMenuItems = seedData.defaultMenuItems;

async function seed() {
  await connectDB();

  console.log("Seeding database with physical menu items...");

  // Seed Admin
  const existingAdmin = await Admin.findOne({ email: defaultAdmin.email });
  if (!existingAdmin) {
    await Admin.create(defaultAdmin);
    console.log("-> Admin user created: admin@khandeshdarbar.in / admin123");
  } else {
    console.log("-> Admin user already exists.");
  }

  // Clear existing Menu Items to avoid duplicates and dummy listings
  await MenuItem.deleteMany({});
  console.log("-> Cleared old menu items.");

  // Seed Menu Items
  for (let item of defaultMenuItems) {
    await MenuItem.create(item);
  }
  console.log(`-> Seeded ${defaultMenuItems.length} physical menu card items successfully.`);

  console.log("Database seeding completed.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
