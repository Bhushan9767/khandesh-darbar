require("dotenv").config();
const { connectDB } = require("../config/db");

// Load models
const Admin = require("../models/Admin");
const MenuItem = require("../models/MenuItem");

const defaultAdmin = {
  name: "Hotel Admin",
  email: "admin@khandeshdarbar.in",
  password: "admin123",
  role: "owner"
};

const defaultMenuItems = [
  // थाळी सिस्टीम (Thali System) - Category: thali
  {
    name: "Swamiraj Khandeshi Unlimited Thali (स्वामीराज अनलिमिटेड थाळी)",
    category: "thali",
    price: 299,
    image: "images/khandeshithali.png",
    description: "वरण बट्टी वांग्याची भाजी, खान्देशी भरीत, शेव भाजी, चपाती/भाकरी, भात, तूप, गुळ, रायता, लोणचं, चटणी, पापड, स्वीट (अनलिमिटेड!).",
    badge: "Bestseller",
    rating: 4.9,
    available: true
  },
  {
    name: "Khandeshi Thali (खान्देशी थाळी)",
    category: "thali",
    price: 190,
    image: "images/thali7.jpeg",
    description: "१ वाटी भरीत, १ भाजी, २ चपाती / १ भाकरी, वरण भात, रायता.",
    rating: 4.8,
    available: true
  },
  {
    name: "Rassa Patodi Thali (रस्सा पातोडी थाळी)",
    category: "thali",
    price: 180,
    image: "images/rassa_patodi.webp",
    description: "रस्सा पातोडी - १ वाटी, २ चपाती / १ भाकरी, १ वाटी वरण, भात, रायता.",
    rating: 4.7,
    available: true
  },
  {
    name: "Nashik Spe. Dudh Shev Bhaji Thali (नाशिक स्पे. दुध शेव भाजी)",
    category: "thali",
    price: 180,
    image: "images/dudh-sev.jpg",
    description: "१ वाटी दुध शेव भाजी, १ वाटी भात, २ चपाती / १ भाकरी, रायता.",
    badge: "Chef Choice",
    rating: 4.8,
    available: true
  },
  {
    name: "Shev Bhaji Thali (शेव भाजी थाळी)",
    category: "thali",
    price: 160,
    image: "images/thali5.jpeg",
    description: "१ वाटी शेव भाजी, १ वाटी भात, २ चपाती / १ भाकरी, रायता.",
    rating: 4.7,
    available: true
  },
  {
    name: "Satvik Thali (सात्विक थाळी)",
    category: "thali",
    price: 150,
    image: "images/satvik thali.jpeg",
    description: "२ भाजी, भात, वरण तूप, २ चपाती / १ भाकरी, रायता.",
    rating: 4.7,
    available: true
  },
  {
    name: "Sadhi Thali (साधी थाळी)",
    category: "thali",
    price: 130,
    image: "images/sadhi thali.jpg",
    description: "१ भाजी, १ आमटी, भात, २ चपाती / १ भाकरी, रायता.",
    rating: 4.6,
    available: true
  },

  // प्लेट सिस्टीम (Plate System) - Category: bhakri
  {
    name: "Khandessi Special Tadka Varan Batti (तडका वरण व बट्टी)",
    category: "bhakri",
    price: 180,
    image: "images/thali4.jpeg",
    description: "बट्टी - ५, १ वाटी तडका वरण, भात, रायता.",
    tag: "Hot",
    rating: 4.8,
    available: true
  },
  {
    name: "Bharit Kalanyachi Bhakri (भरीत कळण्याची भाकरी)",
    category: "bhakri",
    price: 170,
    image: "images/kalanyachi bhakari.png",
    description: "कळण्याची भाकरी - २, भरीत - १ वाटी, रायता.",
    rating: 4.7,
    available: true
  },
  {
    name: "Khandeshian Varan Batti Vangyachi Bhaji (वरण बट्टी वांग्याची भाजी)",
    category: "bhakri",
    price: 160,
    image: "images/thali4.jpeg",
    description: "बट्टी - ५, वरण - १ वाटी, वांग्याची भाजी, तूप, रायता.",
    rating: 4.7,
    available: true
  },
  {
    name: "Bharit Bhakri (भरीत भाकरी)",
    category: "bhakri",
    price: 160,
    image: "images/thali6.jpeg",
    description: "भाकरी - २, भरीत - १ वाटी, रायता.",
    tag: "Popular",
    rating: 4.8,
    available: true
  },
  {
    name: "Khandeshi Bharit Puri (भरीत पुरी)",
    category: "bhakri",
    price: 140,
    image: "images/thali.jpeg",
    description: "पुरी - ५, भरीत - १ वाटी, रायता.",
    rating: 4.7,
    available: true
  },

  // राईस (Rice Items) - Category: sabzi
  {
    name: "Kadhi Khichdi (कढी खिचडी)",
    category: "sabzi",
    price: 180,
    image: "images/khandeshithali.png",
    description: "गरमागरम कढी आणि मऊ खिचडी यांचे अस्सल कॉम्बिनेशन.",
    rating: 4.7,
    available: true
  },
  {
    name: "Pulao / Masala Rice - Full (पुलाव / मसाला राईस - फुल)",
    category: "sabzi",
    price: 170,
    image: "images/pulao.webp",
    description: "खमंग पुलाव आणि मसाले भात फुल प्लेट.",
    rating: 4.6,
    available: true
  },
  {
    name: "Pulao / Masala Rice - Half (पुलाव / मसाला राईस - हाफ)",
    category: "sabzi",
    price: 130,
    image: "images/pulao.webp",
    description: "खमंग पुलाव आणि मसाले भात हाफ प्लेट.",
    rating: 4.5,
    available: true
  },
  {
    name: "Jira Rice - Full (जीरा राईस - फुल)",
    category: "sabzi",
    price: 130,
    image: "images/jirarise.webp",
    description: "जिरा राईस फुल प्लेट.",
    rating: 4.6,
    available: true
  },
  {
    name: "Dal Khichdi (दाल खिचडी)",
    category: "sabzi",
    price: 130,
    image: "images/dalkhichdi.webp",
    description: "मुगाच्या डाळीची गरमागरम आणि चविष्ट खिचडी.",
    rating: 4.7,
    available: true
  },
  {
    name: "Plain Rice - Full (प्लेन राईस - फुल)",
    category: "sabzi",
    price: 110,
    image: "images/jirarise.webp",
    description: "साधा भात फुल प्लेट.",
    rating: 4.4,
    available: true
  },
  {
    name: "Jira Rice - Half (जीरा राईस - हाफ)",
    category: "sabzi",
    price: 80,
    image: "images/jirarise.webp",
    description: "जिरा राईस हाफ प्लेट.",
    rating: 4.5,
    available: true
  },
  {
    name: "Plain Rice - Half (प्लेन राईस - हाफ)",
    category: "sabzi",
    price: 60,
    image: "images/jirarise.webp",
    description: "साधा भात हाफ प्लेट.",
    rating: 4.3,
    available: true
  },

  // स्टार्टर आणि एक्स्ट्रा (Starters & Extras) - Category: sabzi
  {
    name: "Bharit Vati (भरीत वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 60,
    image: "images/thali6.jpeg",
    description: "एक्स्ट्रा वाटी खान्देशी वांगे भरीत.",
    rating: 4.7,
    available: true
  },
  {
    name: "Shev Bhaji Vati (शेव भाजी वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 50,
    image: "images/thali5.jpeg",
    description: "एक्स्ट्रा वाटी शेव भाजी.",
    rating: 4.7,
    available: true
  },
  {
    name: "Masala Papad (मसाला पापड)",
    category: "sabzi",
    price: 40,
    image: "images/masala papad.avif",
    description: "कांदा, टोमॅटो आणि मसाल्याने सजवलेला खुसखुशीत पापड.",
    rating: 4.6,
    available: true
  },
  {
    name: "Suki Bhaji Vati (सुकी भाजी वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 40,
    image: "images/sadhi thali.jpg",
    description: "एक्स्ट्रा वाटी सुकी भाजी.",
    rating: 4.5,
    available: true
  },
  {
    name: "Rassa Vati (रस्सा वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 40,
    image: "images/rassa_patodi.webp",
    description: "एक्स्ट्रा वाटी चमचमीत रस्सा.",
    rating: 4.5,
    available: true
  },
  {
    name: "Rice Vati (भात वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 40,
    image: "images/jirarise.webp",
    description: "एक्स्ट्रा वाटी भात.",
    rating: 4.4,
    available: true
  },
  {
    name: "Roasted Papad (रोस्टेड पापड)",
    category: "sabzi",
    price: 30,
    image: "images/rosted papad.webp",
    description: "भाजलेला खुसखुशीत उडीद पापड.",
    rating: 4.5,
    available: true
  },
  {
    name: "Kalanyachi Bhakri (कळण्याची भाकरी एक्स्ट्रा)",
    category: "sabzi",
    price: 30,
    image: "images/kalanyachi bhakari.png",
    description: "१ कळण्याची भाकरी.",
    rating: 4.7,
    available: true
  },
  {
    name: "Butter Chapati (बटर चपाती एक्स्ट्रा)",
    category: "sabzi",
    price: 30,
    image: "images/sadhi thali.jpg",
    description: "१ चपाती साजूक तूप / बटर लावून.",
    rating: 4.6,
    available: true
  },
  {
    name: "Dahi Vati (दही वाटी एक्स्ट्रा)",
    category: "sabzi",
    price: 30,
    image: "images/logo.png",
    description: "एक्स्ट्रा वाटी ताजे दही.",
    rating: 4.5,
    available: true
  },
  {
    name: "Aalu Ponga (आलू पोंगा)",
    category: "sabzi",
    price: 25,
    image: "images/ponga.webp",
    description: "खान्देशी स्पेशल आलू पोंगा.",
    rating: 4.6,
    available: true
  },
  {
    name: "Jowari Bhakri (ज्वारी भाकरी एक्स्ट्रा)",
    category: "sabzi",
    price: 25,
    image: "images/thali6.jpeg",
    description: "१ गरमागरम ज्वारीची भाकरी.",
    rating: 4.7,
    available: true
  },
  {
    name: "Chapati (चपाती एक्स्ट्रा)",
    category: "sabzi",
    price: 15,
    image: "images/sadhi thali.jpg",
    description: "१ साधी चपाती.",
    rating: 4.5,
    available: true
  },

  // स्वामीराजचा गोडवा (Sweets) - Category: dessert
  {
    name: "Shrikhand / Amrakhand / Fruitkhand (श्रीखंड, आम्रखंड, फ्रुटखंड वाटी)",
    category: "dessert",
    price: 45,
    image: "images/shrikhand.webp",
    description: "ताजे श्रीखंड / आम्रखंड / फ्रुटखंड वाटी.",
    rating: 4.8,
    available: true
  },
  {
    name: "Khandeshi Kheer Vati (खान्देशी खीर वाटी)",
    category: "dessert",
    price: 45,
    image: "images/thali1.jpeg",
    description: "पौष्टिक आणि चविष्ट खान्देशी स्पेशल शेवयांची / तांदळाची खीर वाटी.",
    badge: "Seasonal",
    rating: 4.9,
    available: true
  },
  {
    name: "Khandeshi Darba Ladu (खान्देशी दरबा लाडू)",
    category: "dessert",
    price: 35,
    image: "images/daraba ladu.webp",
    description: "अस्सल खान्देशी पद्धतीचा चवदार दरबा लाडू (१ नग).",
    rating: 4.8,
    available: true
  }
];

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
