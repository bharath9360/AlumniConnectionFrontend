const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, default: 'Remote' },
  type: {
    type: String,
    enum: ['Full-time', 'Contract', 'Internship', 'Part-time'],
    default: 'Full-time'
  },
  experience: String,
  salary: String,
  description: String,
  skills: [String],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedByName: String,
  appliedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['Pending', 'Approved'],
    default: 'Approved'
  },
  postedByRole: { type: String, default: 'admin' }
}, {
  timestamps: true
});

// Virtual timestamp label (e.g., "2 hours ago")
jobSchema.virtual('timestamp').get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
