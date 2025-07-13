const express = require('express');
const {
  sendLoginOTP,
  verifyLoginOTP,
  resendLoginOTP,
  forgotPassword,
  resetPassword,
  verifyResetOtp
} = require('../controllers/userloginController');

const router = express.Router();

router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-login-otp', resendLoginOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-otp', verifyResetOtp);

module.exports = router;