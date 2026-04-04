const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  isGroupChat: { type: Boolean, default: false },
  chatName: { type: String, trim: true },
  groupRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  isMentorshipChat: { type: Boolean, default: false },
  mentorshipSessionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipSession' },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    text: { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date }
  }
}, {
  timestamps: true
});

// ── Performance indexes ──────────────────────────────────────
chatSchema.index({ participants: 1 });             // Fast chat lookup by user

module.exports = mongoose.model('Chat', chatSchema);
