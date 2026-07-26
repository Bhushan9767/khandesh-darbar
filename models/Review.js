const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "Google Review" },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, required: true },
    photo: { type: String, default: "" },
    source: { type: String, enum: ["manual", "google"], default: "manual" },
    approved: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("Review", reviewSchema);
registerModel("Review", "reviews.json", MongooseModel);

module.exports = getModel("Review");
