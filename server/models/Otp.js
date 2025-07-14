// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['login', 'password_reset', 'admin_login'],
    default: 'login'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' } // Auto-delete after 10 minutes
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);