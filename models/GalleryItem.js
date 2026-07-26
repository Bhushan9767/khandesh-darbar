const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const galleryItemSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    alt: { type: String, default: "" },
    size: { type: String, enum: ["normal", "large", "wide"], default: "normal" },
    category: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("GalleryItem", galleryItemSchema);
registerModel("GalleryItem", "gallery.json", MongooseModel);

module.exports = getModel("GalleryItem");
