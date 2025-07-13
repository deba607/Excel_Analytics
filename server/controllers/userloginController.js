const User = require('../models/user-registration');
const Otp = require('../models/Otp');
const {sendOtpEmail} = require('../utils/sendOtpEmail');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer for password reset emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// @desc    Send OTP for login
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to database with type 'login'
    await Otp.create({
      email,
      otp,
      type: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });

  } catch (error) {
    console.error('Error in sendOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending OTP' 
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    // Find the most recent OTP for this email with type 'login'
    const otpRecord = await Otp.findOne({
      email,
      otp,
      type: 'login'
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email, type: 'login' });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    // OTP is valid - get user and generate token
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Generate JWT token
    const token = user.generateToken();

    // Clear used OTPs
    await Otp.deleteMany({ email, type: 'login' });

    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error in verifyOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying OTP' 
    });
  }
};

// @desc    Resend OTP for login
// @route   POST /api/auth/resend-login-otp
// @access  Public
exports.resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email, type: 'login' });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save new OTP to database
    await Otp.create({
      email,
      otp,
      type: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send new OTP to email
    await sendOtpEmail(email, otp);

    res.status(200).json({ 
      success: true, 
      message: 'New OTP sent to your email' 
    });

  } catch (error) {
    console.error('Error in resendLoginOTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resending OTP' 
    });
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/authLogin/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('[forgotPassword] Request body:', { email });

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[forgotPassword] User not found:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found with this email' 
      });
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[forgotPassword] Generated OTP:', otp);

    // Save OTP to database with type 'password_reset'
    const otpRecord = await Otp.create({
      email,
      otp,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    console.log('[forgotPassword] OTP saved to database:', {
      id: otpRecord._id,
      email: otpRecord.email,
      otp: otpRecord.otp,
      type: otpRecord.type,
      expiresAt: otpRecord.expiresAt
    });

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res.status(200).json({ 
      success: true, 
      message: 'Password reset OTP sent to your email' 
    });

  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending password reset OTP' 
    });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/authLogin/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password are required' 
      });
    }

    // Find the most recent OTP for this email with type 'password_reset'
    const otpRecord = await Otp.findOne({
      email,
      otp,
      type: 'password_reset'
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email, type: 'password_reset' });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    // OTP is valid - find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Clear used OTPs
    await Otp.deleteMany({ email, type: 'password_reset' });

    res.status(200).json({ 
      success: true, 
      message: 'Password reset successful' 
    });

  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password' 
    });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/authLogin/verify-reset-otp
// @access  Public
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('[verifyResetOtp] Request body:', { email, otp });

    if (!email || !otp) {
      console.log('[verifyResetOtp] Missing email or OTP');
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      });
    }

    // Find the most recent OTP for this email with type 'password_reset'
    const otpRecord = await Otp.findOne({
      email,
      otp,
      type: 'password_reset'
    }).sort({ createdAt: -1 });

    console.log('[verifyResetOtp] OTP lookup result:', otpRecord ? 'Found' : 'Not found');

    if (!otpRecord) {
      // Let's also check if there are any OTPs for this email without type filter
      const allOtps = await Otp.find({ email }).sort({ createdAt: -1 });
      console.log('[verifyResetOtp] All OTPs for email:', allOtps.map(o => ({ otp: o.otp, type: o.type, expiresAt: o.expiresAt })));
      
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      console.log('[verifyResetOtp] OTP expired');
      await Otp.deleteMany({ email, type: 'password_reset' });
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      });
    }

    console.log('[verifyResetOtp] OTP verified successfully');
    // OTP is valid
    res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });

  } catch (error) {
    console.error('Error in verifyResetOtp:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying OTP' 
    });
  }
};


