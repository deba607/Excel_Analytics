const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getAnalysis, exportAnalysis, getAnalysisHistory, generateAnalysis } = require('../controllers/analysisController');

// Protected routes (require authentication)
router.use(protect);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Analysis route is working!',
    user: req.user?.email,
    timestamp: new Date().toISOString()
  });
});

// Get analysis data
router.get('/', getAnalysis);

// Get analysis history
router.get('/history', getAnalysisHistory);

// Export analysis data
router.get('/export', exportAnalysis);

// Generate analysis for a specific file
router.post('/generate', generateAnalysis);

module.exports = router;