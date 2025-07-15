// In your backend (e.g., server.js or routes/contact.js)
const express = require('express');
const nodemailer = require('nodemailer');
dotenv = require('dotenv');
dotenv.config();

exports.Contact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // Create a test account using ethereal.email for development
    //const testAccount = await nodemailer.createTestAccount();

    // Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: 'support@excelanalytics.com',
      subject: `Contact Form: ${subject}`,
      text: message,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};
