const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/user-registration');
const File = require('../models/File');
const Analysis = require('../models/Analysis');
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
    const totalAdmins = await Admin.countDocuments();
    const totalReports = await Analysis.countDocuments();
    res.json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalAdmins,
        totalReports
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

// Update user (admin)
router.patch('/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete user (admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Get all admins (for admin dashboard)
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find({}, '-password -__v'); // Exclude password and __v
    res.json({ success: true, admins });
  } catch (error) {
    console.error('Error fetching all admins:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
});

// Get all files with user details (for admin dashboard)
router.get('/files', async (req, res) => {
  try {
    const files = await File.find({}, '-__v').sort('-createdAt');
    
    // Get unique user emails from files
    const userEmails = [...new Set(files.map(file => file.userEmail))];
    
    // Fetch user details for all emails
    const users = await User.find({ email: { $in: userEmails } }, 'name email');
    
    // Create a map of email to user details
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user;
    });
    
    // Add user details to each file
    const filesWithUsers = files.map(file => {
      const fileObj = file.toObject();
      fileObj.user = userMap[file.userEmail] || { name: 'Unknown User', email: file.userEmail };
      return fileObj;
    });
    
    res.json({ success: true, files: filesWithUsers });
  } catch (error) {
    console.error('Error fetching all files:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
});

// Get all reports with file and user details (for admin dashboard)
router.get('/reports', async (req, res) => {
  try {
    const reports = await Analysis.find({}, '-__v').sort('-createdAt');
    
    // Get unique file IDs from reports
    const fileIds = [...new Set(reports.map(report => report.fileId))];
    
    // Fetch file details for all file IDs
    const files = await File.find({ _id: { $in: fileIds } }, 'originalName filename userEmail');
    
    // Get unique user emails from files
    const userEmails = [...new Set(files.map(file => file.userEmail))];
    
    // Fetch user details for all emails
    const users = await User.find({ email: { $in: userEmails } }, 'name email');
    
    // Create maps for quick lookup
    const fileMap = {};
    files.forEach(file => {
      fileMap[file._id.toString()] = file;
    });
    
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user;
    });
    
    // Add file and user details to each report
    const reportsWithDetails = reports.map(report => {
      const reportObj = report.toObject();
      const file = fileMap[report.fileId];
      if (file) {
        reportObj.file = file;
        reportObj.user = userMap[file.userEmail] || { name: 'Unknown User', email: file.userEmail };
      } else {
        reportObj.file = { originalName: 'Unknown File', filename: 'Unknown', userEmail: 'unknown' };
        reportObj.user = { name: 'Unknown User', email: 'unknown' };
      }
      return reportObj;
    });
    
    res.json({ success: true, reports: reportsWithDetails });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

module.exports = router; 