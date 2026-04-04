const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userPic: { type: String, default: '' },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 }
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: String,
  userPic: { type: String, default: '' },
  content: { type: String, default: '' },   // optional — image-only posts allowed
  media: { type: String, default: '' },      // Multer-uploaded image URL stored here
  imageOptimized: { type: Boolean, default: false }, // Whether Sharp compressed this image
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: { type: Number, default: 0 },
  comments: [commentSchema],

  // ── Moderation fields ─────────────────────────────────────
  isHidden:   { type: Boolean, default: false },   // Soft-hide (admin only)
  reportCount:{ type: Number,  default: 0 },       // Aggregate report count
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // who reported
}, {
  timestamps: true
});

// ── Performance indexes ──────────────────────────────────────
postSchema.index({ createdAt: -1 });              // Feed sort (newest first)
postSchema.index({ userId: 1, createdAt: -1 });   // User-specific post queries

// Virtual: whether a specific user has liked this post
postSchema.methods.toClientObject = function (userId) {
  const obj = this.toObject({ virtuals: true });
  obj.liked = userId ? this.likedBy.some(id => id.toString() === userId.toString()) : false;
  obj.id = obj._id;
  return obj;
};

module.exports = mongoose.model('Post', postSchema);
