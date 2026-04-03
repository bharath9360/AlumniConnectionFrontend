const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  isGroupChat: { type: Boolean, default: false },
  chatName: { type: String, trim: true },
  groupRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
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

module.exports = mongoose.model('Chat', chatSchema);
