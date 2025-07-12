const express = require('express');
const router = express.Router();
const authController = require('../controllers/userauthController');
const { validate } = require('../middlewares/validate-middileware');
const { userValidator } = require('../validators/userValidator');

// OTP routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Registration route
router.route("/register").post(validate (userValidator), authController.register);


module.exports = router;