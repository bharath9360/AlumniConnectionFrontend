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
  topic: { type: String, default: '' },      // Area student wants mentorship in
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Prevent duplicate requests from same mentee to same mentor
mentorshipRequestSchema.index({ menteeId: 1, mentorId: 1 }, { unique: true });

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
