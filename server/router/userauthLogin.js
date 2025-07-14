const express = require('express');
const {
  sendLoginOTP,
  verifyLoginOTP,
  resendLoginOTP,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  sendAdminLoginOTP,
  verifyAdminLoginOTP,
  resendAdminLoginOTP
} = require('../controllers/userloginController');

const router = express.Router();

// User login OTP routes
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-login-otp', resendLoginOTP);

// Admin login OTP routes
router.post('/send-admin-login-otp', sendAdminLoginOTP);
router.post('/verify-admin-login-otp', verifyAdminLoginOTP);
router.post('/resend-admin-login-otp', resendAdminLoginOTP);

module.exports = router;