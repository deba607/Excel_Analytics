const jwt = require('jsonwebtoken');
const User = require('../models/user-registration');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Defensive check for missing, null, or undefined tokens
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    console.log('Auth failed: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token missing or invalid',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    // Get user from the token
    req.user = await User.findById(decoded.userId).select('-password');
    console.log('Auth successful for user:', req.user?.email);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Not authorized, token invalid',
    });
  }
};

module.exports = { protect }; 