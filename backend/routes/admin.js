const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendApprovalEmail } = require('../services/emailService');

const router = express.Router();

// ─── GET /api/admin/pending-alumni ───────────────────────────
router.get('/pending-alumni', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingAlumni = await User.find({ role: 'alumni', status: 'Pending' })
      .select('-password -secretKey -otp -otpExpiry')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pendingAlumni });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending alumni.' });
  }
});

// ─── PUT /api/admin/activate/:userId ─────────────────────────
router.put('/activate/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.status === 'Active') return res.status(400).json({ message: 'Account already active.' });

    user.status = 'Active';
    await user.save();

    // Notify the alumni their account was approved
    await Notification.create({
      userId: user._id,
      type: 'account_activated',
      title: '🎉 Your account has been approved!',
      description: 'Welcome to MAMCET Alumni Connect! You can now log in and explore.',
      icon: '🎉',
    });

    // Send approval email
    try { await sendApprovalEmail(user.email, user.name); } catch (_) {}

    res.json({ success: true, message: `${user.name} has been activated.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to activate user.' });
  }
});

// ─── DELETE /api/admin/reject/:userId ────────────────────────
router.delete('/reject/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, message: `${user.name}'s application has been rejected and removed.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject user.' });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Job = require('../models/Job');
    const Event = require('../models/Event');
    const [totalUsers, pendingAlumni, pendingJobs, pendingEvents, totalPosts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'alumni', status: 'Pending' }),
      Job.countDocuments({ status: 'Pending' }),
      Event.countDocuments({ status: 'Pending' }),
      require('../models/Post').countDocuments()
    ]);
    res.json({ success: true, data: { totalUsers, pendingAlumni, pendingJobs, pendingEvents, totalPosts } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
