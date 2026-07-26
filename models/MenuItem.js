const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    alt: { type: String, default: "" },
    badge: { type: String, default: "" },
    description: { type: String, default: "" },
    veg: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 5 },
    tag: { type: String, default: "" },
    available: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    seasonal: { type: Boolean, default: false },
    chefSpecial: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("MenuItem", menuItemSchema);
registerModel("MenuItem", "menu.json", MongooseModel);

module.exports = getModel("MenuItem");
