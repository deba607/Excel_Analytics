const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user-registration');
const jwt = require('jsonwebtoken');

// Google OAuth Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:8000/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'google-oauth-' + Math.random().toString(36).substring(7) // Random password for OAuth users
      });
      await user.save();
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/login',
    session: false 
  }), 
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: req.user._id, 
          email: req.user.email,
          role: 'user'
        }, 
        process.env.SECRET_KEY, 
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`http://localhost:5173/auth-callback?token=${token}&email=${req.user.email}&name=${encodeURIComponent(req.user.name)}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('http://localhost:5173/login?error=oauth_failed');
    }
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router; 