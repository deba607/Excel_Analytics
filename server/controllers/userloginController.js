const User = require('../models/user-registration');
const Otp = require('../models/Otp');
const {sendOtpEmail} = require('../utils/sendOtpEmail');


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

    // Save OTP to database
    await Otp.create({
      email,
      otp,
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

    // Find the most recent OTP for this email
    const otpRecord = await Otp.findOne({
      email,
      otp
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email });
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
    await Otp.deleteMany({ email });

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


