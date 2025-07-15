const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  userEmail: {
    type: String,
    default: 'anonymous'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  columns: {
    type: [String],
    default: []
  },
}, {
  timestamps: true
});


module.exports = mongoose.model('File', fileSchema);