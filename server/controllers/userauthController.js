const User = require('../models/user-registration');
const Admin = require('../models/Admin');

const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Store OTPs in memory (in production, use Redis)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 300000 }); // 5 minutes expiry

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP for registration is: ${otp}. It will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedOtp = otpStore.get(email);

    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (Date.now() > storedOtp.expires) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
};


// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate new OTP
    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 300000 }); // 5 minutes expiry

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New OTP for Registration',
      text: `Your new OTP for registration is: ${otp}. It will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};


exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = user.generateToken();

    // Remove password from response
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Register Admin
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists with this email' });
    }
    // Create new admin
    const admin = new Admin({ name, email, password });
    await admin.save();
    const token = admin.generateToken();
    const adminData = admin.toObject();
    delete adminData.password;
    res.status(201).json({
      success: true,
      message: 'Admin registration successful',
      admin: adminData,
      token
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin registration', error: error.message });
  }
};

// Login controller (bonus)
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Verify password
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     // Generate JWT token
//     const token = user.generateToken();

//     // Remove password from response
//     const userData = user.toObject();
//     delete userData.password;
//     delete userData.confirmPassword;

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       user: userData,
//       token
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login',
//       error: error.message
//     });
//   }
// };