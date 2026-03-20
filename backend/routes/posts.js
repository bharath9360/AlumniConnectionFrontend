const express = require('express');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/posts — All posts, newest first ─────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    const userId = req.user?._id;
    const result = posts.map(post => post.toClientObject(userId));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// ─── POST /api/posts — Create new post ────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { content, media } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }
    const post = await Post.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.designation || req.user.role,
      userPic: req.user.profilePic || '',
      content,
      media: media || ''
    });
    res.status(201).json({ success: true, data: post.toClientObject(req.user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post.' });
  }
});

// ─── PUT /api/posts/:id/like — Toggle like ────────────────────
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const userId = req.user._id;
    const alreadyLiked = post.likedBy.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();
    res.json({ success: true, data: post.toClientObject(userId) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update like.' });
  }
});

// ─── POST /api/posts/:id/comment — Add comment ───────────────
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty.' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    post.comments.push({
      userId: req.user._id,
      userName: req.user.name,
      userPic: req.user.profilePic || '',
      content
    });

    await post.save();
    res.json({ success: true, data: post.toClientObject(req.user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment.' });
  }
});

// ─── DELETE /api/posts/:id — Delete post (author only) ───────
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post.' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

module.exports = router;
