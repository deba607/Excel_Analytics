const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make it optional since we might not have user ID
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['overview', 'sales', 'products', 'customers']
  },
  data: {
    type: Object,
    required: false // Make it optional since we might not have data
  },
  hasData: {
    type: Boolean,
    default: false
  },
  filters: {
    dateRange: String,
    category: String,
    sortBy: String
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

analysisSchema.index({ userEmail: 1, fileId: 1, type: 1 });
analysisSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);