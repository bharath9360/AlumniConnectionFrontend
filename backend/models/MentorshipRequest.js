const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema({
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: { type: String, default: '', maxlength: 500 },
  topic: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Index for fast lookup — NOT unique, multiple sessions allowed
mentorshipRequestSchema.index({ menteeId: 1, mentorId: 1, status: 1 });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
