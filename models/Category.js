const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("Category", categorySchema);
registerModel("Category", "categories.json", MongooseModel);

module.exports = getModel("Category");
