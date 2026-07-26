const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    date: { type: String, required: true }, // "YYYY-MM-DD" as submitted by the date input
    time: { type: String, required: true }, // "HH:MM" as submitted by the time input
    guests: { type: String, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
      default: "pending"
    },
    source: { type: String, enum: ["website", "phone", "walk-in"], default: "website" }
  },
  { timestamps: true }
);

bookingSchema.index({ date: 1, time: 1 });

const MongooseModel = mongoose.model("Booking", bookingSchema);
registerModel("Booking", "bookings.json", MongooseModel);

module.exports = getModel("Booking");
