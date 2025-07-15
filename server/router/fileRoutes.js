const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const {
  uploadFiles,
  getFiles,
  deleteFile,
  downloadFile
} = require('../controllers/fileController');

// Public test endpoint (no auth required)
router.get('/public-test', (req, res) => {
  res.json({ 
    message: 'File routes are working!',
    timestamp: new Date().toISOString(),
    status: 'public_test'
  });
});

// Apply auth middleware to all routes except public test
router.use(protect);

router.route('/')
  .post(upload.array('files'), uploadFiles);

router.route('/getfiles')
  .get(getFiles);

router.route('/:fileId')
  .delete(deleteFile);

// Add after auth middleware
router.get('/download/:gridFsId', downloadFile);

// Health check route for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'File route is working!' });
});

module.exports = router;