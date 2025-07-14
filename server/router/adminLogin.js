const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/user-registration');
const File = require('../models/File');
const { sendOtpEmail } = require('../utils/sendOtpEmail');

// In-memory store for OTPs (for demo/testing)
const otpStore = {};

// Send OTP to admin email
router.post('/send-login-otp', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry
    // Send OTP email
    await sendOtpEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to admin email!' });
  } catch (error) {
    console.error('Error sending admin OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Verify OTP for admin login
router.post('/verify-login-otp', async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const record = otpStore[email];
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    // OTP is valid, delete it
    delete otpStore[email];
    // Generate JWT
    const token = admin.generateToken();
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error verifying admin OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// Admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await File.countDocuments();
    res.json({
      success: true,
      data: {
        totalUsers,
        totalFiles
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Get all users (for admin dashboard)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password -__v'); // Exclude password and __v
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

module.exports = router; 