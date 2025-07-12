// In your backend (e.g., server.js or routes/contact.js)
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/userContactController');

router.post('/', contactController.Contact);
module.exports = router;