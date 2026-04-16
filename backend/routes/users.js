const express = require('express');
const User = require('../models/User');
const {
  protect
} = require('../middleware/auth');
const {
  profileUpload,
  bannerUpload,
  uploadToCloudinary
} = require('../middleware/upload');
const asyncHandler = require("../middleware/asyncHandler");
const router = express.Router();

// ─── PUT /api/users/upload-dp ─────────────────────────────────
// Upload / replace the logged-in user's profile picture
router.put('/upload-dp', protect, profileUpload.single('profilePic'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No image provided.'
    });
  }

  // Upload buffer to Cloudinary — profile_pictures folder
  // Auto crop to square, face detection, 400x400
  const url = await uploadToCloudinary(req.file.buffer, 'alumni/profile_pictures', 'image', {
    transformation: [{
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face'
    }, {
      quality: 'auto',
      fetch_format: 'auto'
    }]
  });
  const user = await User.findByIdAndUpdate(req.user._id, {
    profilePic: url
  }, {
    new: true,
    select: '-password -secretKey'
  });
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  res.json({
    success: true,
    message: 'Profile picture updated.',
    profilePic: url,
    user: user.toSafeObject ? user.toSafeObject() : user
  });
}));

// ─── PUT /api/users/upload-banner ────────────────────────────
// Upload / replace the logged-in user's banner picture
router.put('/upload-banner', protect, bannerUpload.single('bannerPic'), asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No image provided.'
    });
  }

  // Upload to Cloudinary — banners folder, wide crop 1584x396 (LinkedIn ratio)
  const url = await uploadToCloudinary(req.file.buffer, 'alumni/banners', 'image', {
    transformation: [{
      width: 1584,
      height: 396,
      crop: 'fill',
      gravity: 'auto'
    }, {
      quality: 'auto',
      fetch_format: 'auto'
    }]
  });
  const user = await User.findByIdAndUpdate(req.user._id, {
    bannerPic: url
  }, {
    new: true,
    select: '-password -secretKey'
  });
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  res.json({
    success: true,
    message: 'Banner updated.',
    bannerPic: url,
    user: user.toSafeObject ? user.toSafeObject() : user
  });
}));

// ─── PUT /api/users/update-profile ──────────────────────────
// Update the logged-in user's profile fields (text/arrays only)
router.put('/update-profile', protect, asyncHandler(async (req, res, next) => {
  const updates = {
    ...req.body
  };
  // Strip sensitive / auth fields
  ['password', 'secretKey', 'otp', 'otpExpiry', 'role', 'status', 'email'].forEach(k => delete updates[k]);
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: updates
  }, {
    new: true,
    runValidators: true,
    select: '-password -secretKey -otp -otpExpiry'
  });
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  res.json({
    success: true,
    message: 'Profile updated.',
    user
  });
}));

// ─── GET /api/users/search ────────────────────────────────────
// Search users by name, role, company, department, batch
// Query params: q, role, department, batch, limit
router.get('/search', protect, asyncHandler(async (req, res, next) => {
  const {
    q = '',
    role = '',
    department = '',
    batch = '',
    limit = '20'
  } = req.query;
  const pageLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

  // Build filter
  const filter = {
    _id: {
      $ne: req.user._id
    },
    // exclude self
    role: {
      $in: ['alumni', 'student']
    },
    // exclude admins
    status: 'Active'
  };

  // Text search across name, company, department
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), 'i');
    filter.$or = [{
      name: regex
    }, {
      company: regex
    }, {
      department: regex
    }, {
      batch: regex
    }, {
      designation: regex
    }];
  }
  if (role && ['alumni', 'student'].includes(role.toLowerCase())) {
    filter.role = role.toLowerCase();
  }
  if (department && department.trim()) {
    filter.department = new RegExp(department.trim(), 'i');
  }
  if (batch && batch.trim()) {
    filter.batch = new RegExp(batch.trim(), 'i');
  }
  const users = await User.find(filter).select('name role department batch graduationYear profilePic company designation connectionCount').sort({
    connectionCount: -1,
    name: 1
  }).limit(pageLimit).lean();
  res.json({
    success: true,
    data: users,
    total: users.length
  });
}));

// ─── GET /api/users/:id ───────────────────────────────────────
// Fetch any user's public profile by ID
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password -secretKey -otp -otpExpiry');
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  res.json({
    success: true,
    data: user
  });
}));

// ─── POST /api/users/block/:userId — Block a user ─────────────
router.post('/block/:userId', protect, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot block yourself.' });
  }
  const target = await User.findById(userId);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });
  res.json({ success: true, message: `${target.name} has been blocked.` });
}));

// ─── POST /api/users/unblock/:userId — Unblock a user ─────────
router.post('/unblock/:userId', protect, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
  res.json({ success: true, message: 'User unblocked.' });
}));

module.exports = router;