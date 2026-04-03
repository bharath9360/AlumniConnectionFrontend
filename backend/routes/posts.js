const express = require('express');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');
const { postUpload: upload, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// ─── GET /api/posts — All posts, newest first ─────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePic role designation');

    const userId = req.user?._id;
    const result = posts.map(post => {
      const obj = post.toClientObject(userId);
      // Overlay the author's live data from the populated User document
      if (post.userId && typeof post.userId === 'object') {
        obj.userName  = post.userId.name;
        obj.userPic   = post.userId.profilePic || '';
        obj.userRole  = post.userId.designation || post.userId.role || '';
        obj.authorId  = post.userId._id;
      }
      return obj;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});


// ─── POST /api/posts — Create new post ────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;

    // ── Upload media to Cloudinary (buffer → HTTPS URL) ──────────
    // req.file.buffer is populated by Multer memoryStorage.
    // The secure_url returned by Cloudinary is stored in MongoDB.
    let mediaUrl = '';
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');
      mediaUrl = await uploadToCloudinary(
        req.file.buffer,
        'alumni/posts',
        isVideo ? 'video' : 'image',
        isVideo ? {
          transformation: [
            { quality: 'auto' }
          ]
        } : {
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        }
      );
    } else if (req.body.media) {
      // Allow external Cloudinary URLs passed directly as a form field
      mediaUrl = req.body.media;
    }

    if (!content?.trim() && !mediaUrl) {
      return res.status(400).json({ message: 'Post content or image cannot be empty.' });
    }

    // ── Create the post document ──────────────────────────────
    const post = await Post.create({
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.designation || req.user.role,
      userPic: req.user.profilePic || '',
      content: content || '',
      media: mediaUrl           // ← Multer image URL is stored here in MongoDB
    });

    // Notify accepted connections
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const me = await User.findById(req.user._id).select('connections');
      
      if (me && me.connections && me.connections.length > 0) {
        const acceptedConnIds = me.connections
          .filter(c => c.status === 'Accepted')
          .map(c => c.userId);

        if (acceptedConnIds.length > 0) {
          const notifDocs = acceptedConnIds.map(id => ({
            userId: id,
            type: 'post',
            title: `New post from ${req.user.name}`,
            description: content ? content.substring(0, 60) : 'Shared an image',
            icon: '📰',
            relatedId: post._id
          }));
          const created = await Notification.insertMany(notifDocs);

          const io = req.app.get('io');
          if (io) {
            created.forEach((notif, i) => {
              io.to(acceptedConnIds[i].toString()).emit('notification_received', notif);
            });
          }
        }
      }
    } catch (_) {}

    // ── Return a shape consistent with GET /api/posts ────────────
    // Re-fetch the post with the userId populated so the client object
    // has userName / userPic from the live User document (same as feed).
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name profilePic role designation');

    const clientObj = populatedPost.toClientObject(req.user._id);
    if (populatedPost.userId && typeof populatedPost.userId === 'object') {
      clientObj.userName = populatedPost.userId.name;
      clientObj.userPic  = populatedPost.userId.profilePic || '';
      clientObj.userRole = populatedPost.userId.designation || populatedPost.userId.role || '';
      clientObj.authorId = populatedPost.userId._id;
    }

    res.status(201).json({ success: true, data: clientObj });
  } catch (err) {
    console.error('Create post error:', err);
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

// ─── POST /api/posts/:id/report — Report a post ──────────────
router.post('/:id/report', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const userId = req.user._id;
    const alreadyReported = post.reportedBy.some(id => id.toString() === userId.toString());
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this post.' });
    }

    post.reportedBy.push(userId);
    post.reportCount = post.reportedBy.length;
    await post.save();

    res.json({ success: true, message: 'Post reported. Admin will review it shortly.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to report post.' });
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
