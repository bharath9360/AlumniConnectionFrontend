const mongoose = require('mongoose');

/**
 * Stores a summary record every time the admin runs a bulk import.
 * Lightweight audit trail — no PII stored (only aggregate counts + emails list).
 */
const importLogSchema = new mongoose.Schema({
  importedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:        { type: String, enum: ['student', 'alumni', 'staff'], required: true },
  totalRows:   { type: Number, default: 0 },
  created:     { type: Number, default: 0 },
  skipped:     { type: Number, default: 0 },
  failed:      { type: Number, default: 0 },
  emailsSent:  { type: Number, default: 0 },
  emailsFailed:{ type: Number, default: 0 },
  errors:      [{ row: String, reason: String }],
  fileName:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ImportLog', importLogSchema);
