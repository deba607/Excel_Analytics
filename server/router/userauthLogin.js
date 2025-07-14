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
router.post('/authLogin/send-login-otp', sendLoginOTP);
router.post('/authLogin/verify-login-otp', verifyLoginOTP);
router.post('/authLogin/resend-login-otp', resendLoginOTP);

// Admin login OTP routes
router.post('/adminLogin/send-login-otp', sendAdminLoginOTP);
router.post('/adminLogin/verify-login-otp', verifyAdminLoginOTP);
router.post('/adminLogin/resend-login-otp', resendAdminLoginOTP);

module.exports = router;