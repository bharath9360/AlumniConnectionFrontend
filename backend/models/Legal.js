const mongoose = require('mongoose');

const legalSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['privacy', 'terms', 'security'],
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String, // HTML or rich text
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } });

module.exports = mongoose.model('Legal', legalSchema);
