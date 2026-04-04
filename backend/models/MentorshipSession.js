const mongoose = require('mongoose');

const mentorshipSessionSchema = new mongoose.Schema({
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
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest',
    required: true
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  topic: { type: String, default: '' },
  notes: { type: String, default: '' },  // Mentor can add session notes
  resources: [{ type: String }],         // URLs/links mentor shares
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  completedAt: { type: Date },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '', maxlength: 600 },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('MentorshipSession', mentorshipSessionSchema);
