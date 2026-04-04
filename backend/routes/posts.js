const express = require('express');
const Post = require('../models/Post');
const { protect, optionalAuth } = require('../middleware/auth');
const { postUpload: upload, uploadOptimized, uploadToCloudinary } = require('../middleware/upload');
const { deleteCloudinaryImage } = require('../utils/cloudinaryCleanup');

const router = express.Router();

// ─── GET /api/posts — All posts, newest first (paginated) ─────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name profilePic role designation'),
      Post.countDocuments()
    ]);

    const userId = req.user?._id;
    const result = posts.map(post => {
      const obj = post.toClientObject(userId);
      // Overlay the author's live data from the populated User document
      if (post.userId && typeof post.userId === 'object') {
        obj.userName  = post.userId.name;
        obj.userPic   = post.userId.profilePic || '';
        obj.userRole  = post.userId.designation || post.userId.role || '';
        obj.authorId  = post.userId._id.toString();
      }
      return obj;
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});


// ─── POST /api/posts — Create new post ────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;

    // ── Upload media (with Sharp optimization for images) ──────
    let mediaUrl = '';
    let imageOptimized = false;

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');

      if (isVideo) {
        // Videos: upload directly, no Sharp optimization
        mediaUrl = await uploadToCloudinary(
          req.file.buffer,
          'alumni/posts',
          'video',
          { transformation: [{ quality: 'auto' }] }
        );
      } else {
        // Images: optimize with Sharp first, then upload
        const result = await uploadOptimized(
          req.file.buffer,
          'alumni/posts',
          'image',
          {
            transformation: [
              { width: 1200, crop: 'limit' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          }
        );
        mediaUrl = result.url;
        imageOptimized = result.optimized;
      }
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
      media: mediaUrl,
      imageOptimized
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
    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name profilePic role designation');

    const clientObj = populatedPost.toClientObject(req.user._id);
    if (populatedPost.userId && typeof populatedPost.userId === 'object') {
      clientObj.userName = populatedPost.userId.name;
      clientObj.userPic  = populatedPost.userId.profilePic || '';
      clientObj.userRole = populatedPost.userId.designation || populatedPost.userId.role || '';
      clientObj.authorId = populatedPost.userId._id.toString();
    }

    res.status(201).json({ success: true, data: clientObj });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Failed to create post.' });
  }
});


// ─── GET /api/posts/user/:userId — Posts by a specific user ──
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;   // 0 = no limit
    let query = Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePic role designation');
    if (limit > 0) query = query.limit(limit + 1);  // fetch +1 to detect hasMore

    const posts = await query;
    const hasMore = limit > 0 && posts.length > limit;
    const trimmed = hasMore ? posts.slice(0, limit) : posts;

    const authUserId = req.user?._id;
    const result = trimmed.map(post => {
      const obj = post.toClientObject(authUserId);
      if (post.userId && typeof post.userId === 'object') {
        obj.userName  = post.userId.name;
        obj.userPic   = post.userId.profilePic || '';
        obj.userRole  = post.userId.designation || post.userId.role || '';
        obj.authorId  = post.userId._id.toString();
      }
      return obj;
    });
    res.json({ success: true, data: result, hasMore, total: posts.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user posts.' });
  }
});


// ─── GET /api/posts/activity/:userId — Liked + Commented posts ──
router.get('/activity/:userId', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0;
    const authUserId = req.user?._id;

    const mapPost = (post) => {
      const obj = post.toClientObject(authUserId);
      if (post.userId && typeof post.userId === 'object') {
        obj.userName  = post.userId.name;
        obj.userPic   = post.userId.profilePic || '';
        obj.userRole  = post.userId.designation || post.userId.role || '';
        obj.authorId  = post.userId._id.toString();
      }
      return obj;
    };

    // Posts liked by this user
    let likedQ = Post.find({ likedBy: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePic role designation');
    if (limit > 0) likedQ = likedQ.limit(limit + 1);
    const likedRaw = await likedQ;
    const likedHasMore = limit > 0 && likedRaw.length > limit;
    const likedPosts = (likedHasMore ? likedRaw.slice(0, limit) : likedRaw).map(mapPost);

    // Posts commented on by this user
    let commentedQ = Post.find({ 'comments.userId': req.params.userId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name profilePic role designation');
    if (limit > 0) commentedQ = commentedQ.limit(limit + 1);
    const commentedRaw = await commentedQ;
    const commentedHasMore = limit > 0 && commentedRaw.length > limit;
    const commentedPosts = (commentedHasMore ? commentedRaw.slice(0, limit) : commentedRaw).map(mapPost);

    res.json({
      success: true,
      likedPosts,    likedHasMore,
      commentedPosts, commentedHasMore
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity.' });
  }
});


// ─── PUT /api/posts/:id — Edit post content (author only) ────
router.put('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this post.' });
    }
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content cannot be empty.' });
    post.content = content.trim();
    await post.save();
    res.json({ success: true, data: post.toClientObject(req.user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to edit post.' });
  }
});

// ─── DELETE /api/posts/:postId/comment/:commentId ─────────────
router.delete('/:postId/comment/:commentId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    // Comment author OR post author can delete
    const isCommentAuthor = comment.userId?.toString() === req.user._id.toString();
    const isPostAuthor    = post.userId.toString() === req.user._id.toString();
    if (!isCommentAuthor && !isPostAuthor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ success: true, data: post.toClientObject(req.user._id) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment.' });
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

    // Clean up Cloudinary image (fire-and-forget)
    if (post.media) {
      deleteCloudinaryImage(post.media).catch(() => {});
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

module.exports = router;
