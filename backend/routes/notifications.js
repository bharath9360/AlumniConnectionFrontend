const express = require('express');
const Notification = require('../models/Notification');
const {
  protect
} = require('../middleware/auth');
const asyncHandler = require("../middleware/asyncHandler");
const router = express.Router();

// ─── GET /api/notifications/unread-count — lightweight badge ─
// IMPORTANT: This MUST be defined BEFORE /:id routes to avoid Express
// matching the literal string "unread-count" as the :id param.
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
// IMPORTANT: Must also be before /:id to avoid route collision.
router.delete('/clear-all', protect, asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({
    userId: req.user._id
  });
  res.json({
    success: true,
    message: 'All notifications cleared.'
  });
}));

// ─── PUT /api/notifications/read-all — Mark all as read ──────
// IMPORTANT: Must also be before /:id to avoid route collision.
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

// ─── GET /api/notifications — Current user's notifications ───
router.get('/', protect, asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({
    userId: req.user._id
  }).sort({
    createdAt: -1
  }).limit(100); // Cap at 100 for perf
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

module.exports = router;