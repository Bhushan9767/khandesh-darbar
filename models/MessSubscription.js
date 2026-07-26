const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const messSubscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    plan: {
      type: String,
      enum: [
        "standard-1",
        "standard-2",
        "khandeshi-1",
        "khandeshi-2"
      ],
      required: true
    },
    startDate: { type: String, required: true }, // "YYYY-MM-DD"
    endDate: { type: String }, // "YYYY-MM-DD" (30 days from start date)
    timing: {
      type: String,
      enum: ["lunch", "dinner", "both"],
      required: true
    },
    notes: { type: String, default: "" }, // Customer notes
    adminNotes: { type: String, default: "" }, // Admin notes
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "expired"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// Pre-save hook to calculate endDate (30 days after startDate)
messSubscriptionSchema.pre("save", function(next) {
  if (this.startDate && !this.endDate) {
    try {
      const start = new Date(this.startDate);
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      this.endDate = end.toISOString().split("T")[0];
    } catch (e) {
      // Ignore conversion errors
    }
  }
  next();
});

const MongooseModel = mongoose.model("MessSubscription", messSubscriptionSchema);
registerModel("MessSubscription", "mess_subscriptions.json", MongooseModel);

module.exports = getModel("MessSubscription");
