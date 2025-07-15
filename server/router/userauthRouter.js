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

// Complete Google signup route
router.post('/complete-google-signup', authController.completeGoogleSignup);

// Admin registration route
router.post('/register-admin', authController.registerAdmin);


module.exports = router;