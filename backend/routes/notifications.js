const express = require('express');
const Notification = require('../models/Notification');
const {
  protect
} = require('../middleware/auth');
const asyncHandler = require("../middleware/asyncHandler");
const router = express.Router();

// ─── GET /api/notifications — Current user's notifications ───
router.get('/', protect, asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({
    userId: req.user._id
  }).sort({
    createdAt: -1
  });
  res.json({
    success: true,
    data: notifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  });
}));

// ─── PUT /api/notifications/:id/read — Mark one as read ──────
router.put('/:id/read', protect, asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate({
    _id: req.params.id,
    userId: req.user._id
  }, {
    isRead: true
  }, {
    new: true
  });
  if (!notification) return res.status(404).json({
    message: 'Notification not found.'
  });
  res.json({
    success: true,
    data: notification
  });
}));

// ─── PUT /api/notifications/read-all — Mark all as read ──────
router.put('/read-all', protect, asyncHandler(async (req, res, next) => {
  await Notification.updateMany({
    userId: req.user._id,
    isRead: false
  }, {
    isRead: true
  });
  res.json({
    success: true,
    message: 'All notifications marked as read.'
  });
}));

// ─── DELETE /api/notifications/:id — Delete notification ─────
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });
  res.json({
    success: true,
    message: 'Notification deleted.'
  });
}));

// ─── GET /api/notifications/unread-count — lightweight badge ─
router.get('/unread-count', protect, asyncHandler(async (req, res, next) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false
  });
  res.json({
    success: true,
    count
  });
}));

// ─── DELETE /api/notifications/clear-all — wipe all ──────────
router.delete('/clear-all', protect, asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({
    userId: req.user._id
  });
  res.json({
    success: true,
    message: 'All notifications cleared.'
  });
}));
module.exports = router;