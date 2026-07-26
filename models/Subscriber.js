const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("Subscriber", subscriberSchema);
registerModel("Subscriber", "subscribers.json", MongooseModel);

module.exports = getModel("Subscriber");
