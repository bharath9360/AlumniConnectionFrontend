const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  isAvailable: { type: Boolean, default: true },
  skills: [{ type: String, trim: true }],
  domain: [{ type: String, trim: true }],      // e.g. ["Web Dev", "AI/ML"]
  experience: { type: String, default: '' },   // e.g. "3 years at Google"
  bio: { type: String, default: '', maxlength: 500 },
  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Mentor', mentorSchema);
