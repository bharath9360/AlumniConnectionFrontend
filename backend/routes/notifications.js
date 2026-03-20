const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/notifications — Current user's notifications ───
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notifications,
      unreadCount: notifications.filter(n => !n.isRead).length
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
});

// ─── PUT /api/notifications/:id/read — Mark one as read ──────
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
});

// ─── PUT /api/notifications/read-all — Mark all as read ──────
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read.' });
  }
});

// ─── DELETE /api/notifications/:id — Delete notification ─────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
});

module.exports = router;
