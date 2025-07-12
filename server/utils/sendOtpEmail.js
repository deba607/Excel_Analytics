// utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a test account (only for development)
const createTransporter = async () => {
  //const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use environment variables for security
    },
  });
};

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Excel Analytics" <noreply@excelanalytics.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your OTP Code</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #2563eb;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendOtpEmail };