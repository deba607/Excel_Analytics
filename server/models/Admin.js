const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    required: true,
  }
});

// Hash password before saving
adminSchema.pre("save", async function(next) {
  const admin = this;
  if (!admin.isModified("password")) return next();
  try {
    const saltRound = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(admin.password, saltRound);
    admin.password = hash_password;
  } catch (err) {
    return next(err);
  }
});

// Compare password
adminSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Generate JWT
adminSchema.methods.generateToken = function() {
  try {
    return jwt.sign({
      adminId: this._id.toString(),
      email: this.email
    },
    process.env.SECRET_KEY, {
      expiresIn: "30d",
    });
  } catch (err) {
    throw err;
  }
};

const Admin = new mongoose.model("Admin", adminSchema);
module.exports = Admin; 