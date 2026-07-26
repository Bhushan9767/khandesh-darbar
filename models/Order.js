const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const orderSchema = new mongoose.Schema(
  {
    kotNo: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    type: { type: String, enum: ["dine-in", "takeaway"], required: true },
    tableNo: { type: String, default: "" },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "preparing", "served", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("Order", orderSchema);
registerModel("Order", "orders.json", MongooseModel);

module.exports = getModel("Order");
