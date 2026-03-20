const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Networking', 'Webinar', 'Reunion', 'Workshop', 'Seminar', 'Cultural'],
    default: 'Networking'
  },
  date: { type: String, required: true },   // stored as "YYYY-MM-DD" string for easy display
  time: String,
  venue: String,
  desc: String,
  image: { type: String, default: '' },
  registeredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Approved'
  },
  createdByRole: { type: String, default: 'admin' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
