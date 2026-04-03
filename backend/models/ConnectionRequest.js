const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending',
  }
}, { timestamps: true });

// Prevent duplicate requests between the same users regardless of direction
// Wait, a user can't send a request if one exists.
// A unique index on sender and receiver might block a reverse request if one was rejected, but it's simpler to enforce uniqueness on active/pending.
// We will handle logic in the controller.
connectionRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
