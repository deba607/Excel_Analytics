const jwt = require('jsonwebtoken');
const User = require('../models/user-registration');
const Admin = require('../models/Admin');

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
    // Check if admin or user
    if (decoded.adminId) {
      req.admin = await Admin.findById(decoded.adminId).select('-password');
      console.log('Auth successful for admin:', req.admin?.email);
    } else if (decoded.userId) {
      req.user = await User.findById(decoded.userId).select('-password');
      console.log('Auth successful for user:', req.user?.email);
    } else {
      console.log('Auth failed: No valid user or admin in token');
      return res.status(401).json({
        success: false,
        error: 'Not authorized, invalid token payload',
      });
    }
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