const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { 
  getAnalysis, 
  getAnalysisHistory, 
  exportAnalysis 
} = require('../controllers/analysisController');

// Test endpoint without auth (for debugging)
router.get('/public-test', (req, res) => {
  res.json({ 
    message: 'Analysis public test endpoint',
    timestamp: new Date().toISOString(),
    status: 'working'
  });
});

// Protected routes (require authentication)
router.use(protect);

// Test endpoint with auth
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Analysis route is working!',
    user: req.user?.email,
    timestamp: new Date().toISOString(),
    status: 'authenticated'
  });
});

// Get analysis data (main endpoint)
router.get('/', (req, res, next) => {
  console.log('[Analysis Route] Request:', {
    url: req.url,
    method: req.method,
    user: req.user?.email,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  next();
}, getAnalysis);

// Get analysis history
router.get('/history', (req, res, next) => {
  console.log('[Analysis History] Request:', {
    user: req.user?.email,
    query: req.query
  });
  next();
}, getAnalysisHistory);

// Export analysis data
router.get('/export', (req, res, next) => {
  console.log('[Analysis Export] Request:', {
    user: req.user?.email,
    query: req.query
  });
  next();
}, exportAnalysis);

// Error handling middleware for analysis routes
router.use((error, req, res, next) => {
  console.error('[Analysis Route Error]:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in analysis routes',
    errorType: 'route_error'
  });
});

module.exports = router;