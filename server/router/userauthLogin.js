const express = require('express');
const {
  sendLoginOTP,
  verifyLoginOTP,
    resendLoginOTP
} = require('../controllers/userloginController');

const router = express.Router();

router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-login-otp', resendLoginOTP); 

module.exports = router;