const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''     // Cloudinary URL if message contains an image
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'mixed'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// ── Performance indexes ──────────────────────────────────────
messageSchema.index({ chatId: 1, createdAt: -1 }); // Fast message retrieval per chat

module.exports = mongoose.model('Message', messageSchema);
