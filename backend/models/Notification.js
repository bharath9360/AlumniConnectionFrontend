const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'event', 'job', 'message', 'system',
      'connection_request', 'connection_accepted',
      'job_alert', 'event_alert',
      'admin_approval_needed', 'account_activated'
    ],
    required: true
  },
  title: { type: String, required: true },
  description: String,
  icon: { type: String, default: '🔔' },
  relatedId: { type: mongoose.Schema.Types.ObjectId },  // ID of the related job/event
  isRead: { type: Boolean, default: false },
  // Extra fields matching current data shape
  company: String,   // for job notifications
  posted: String,    // for job notifications
  date: String,      // for event notifications
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
