const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const {
  uploadFiles,
  getFiles,
  deleteFile
} = require('../controllers/fileController');

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(upload.array('files'), uploadFiles);

router.route('/getfiles')
  .get(getFiles);

router.route('/:fileId')
  .delete(deleteFile);

// Health check route for debugging
router.get('/test', (req, res) => {
  res.json({ message: 'File route is working!' });
});

module.exports = router;