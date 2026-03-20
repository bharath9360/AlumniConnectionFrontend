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
  content: { type: String, required: true },
  media: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: { type: Number, default: 0 },
  comments: [commentSchema]
}, {
  timestamps: true
});

// Virtual: whether a specific user has liked this post
postSchema.methods.toClientObject = function (userId) {
  const obj = this.toObject({ virtuals: true });
  obj.liked = userId ? this.likedBy.some(id => id.toString() === userId.toString()) : false;
  obj.id = obj._id;
  return obj;
};

module.exports = mongoose.model('Post', postSchema);
