const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { registerModel, getModel } = require("../config/db");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "manager", "staff"], default: "manager" }
  },
  { timestamps: true }
);

adminSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const MongooseModel = mongoose.model("Admin", adminSchema);
registerModel("Admin", "admins.json", MongooseModel);

// Standard module export loads the proxy/dynamic model
module.exports = getModel("Admin");
