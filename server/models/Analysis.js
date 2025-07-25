const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  chartType: {
    type: String,
    required: true,
    enum: ['bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea']
  },
  xAxis: {
    type: String,
    required: false
  },
  yAxis: {
    type: String,
    required: false
  },
  reportGridFsId: {
    type: String, // GridFS file ID for the chart image
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
analysisSchema.index({ userEmail: 1, fileId: 1 });

// Pre-save middleware to update updatedAt
analysisSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find analysis by user and file
analysisSchema.statics.findByUserAndFile = function(userEmail, fileId) {
  return this.findOne({
    userEmail,
    fileId
  }).sort({ createdAt: -1 });
};

// Static method to get analysis history
analysisSchema.statics.getHistory = function(userEmail, limit = 50) {
  return this.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('fileId', 'originalName size');
};

// Instance method to check if analysis is recent
analysisSchema.methods.isRecent = function(hours = 24) {
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.createdAt > hoursAgo;
};

// Virtual for formatted creation date
analysisSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Ensure virtuals are included in JSON output
analysisSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Analysis', analysisSchema);