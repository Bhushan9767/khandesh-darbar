const mongoose = require("mongoose");
const { registerModel, getModel } = require("../config/db");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    code: { type: String, default: "" },
    link: { type: String, default: "#booking" },
    active: { type: Boolean, default: false },
    validTill: { type: Date }
  },
  { timestamps: true }
);

const MongooseModel = mongoose.model("Offer", offerSchema);
registerModel("Offer", "offers.json", MongooseModel);

module.exports = getModel("Offer");
