const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Ensure unique pairs. user1 and user2 will be sorted before saving to avoid (A, B) and (B, A) duplicates.
connectionSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Pre-save hook to always ensure user1 < user2 for consistency
connectionSchema.pre('save', function (next) {
  if (this.user1.toString() > this.user2.toString()) {
    const temp = this.user1;
    this.user1 = this.user2;
    this.user2 = temp;
  }
  next();
});

module.exports = mongoose.model('Connection', connectionSchema);
