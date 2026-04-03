const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/admin/analytics ─────────────────────────────────
// Full analytics payload for the admin dashboard — all real DB data.
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const Job   = require('../models/Job');
    const Event = require('../models/Event');
    const Post  = require('../models/Post');

    const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // ── KPI Counts — all run in parallel for performance ─────────
    const [
      totalStudents,
      totalAlumni,
      activeUsers,
      pendingAlumni,
      pendingJobs,
      pendingEvents,
      totalPosts,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'alumni' }),
      // Active = logged in within last 7 days  OR  Active status (legacy users without lastLogin)
      User.countDocuments({
        $or: [
          { lastLogin: { $gte: SEVEN_DAYS_AGO } },
          { lastLogin: null, status: 'Active' },
        ],
      }),
      User.countDocuments({ role: 'alumni', status: 'Pending' }),
      Job.countDocuments({ status: 'Pending' }),
      Event.countDocuments({ status: 'Pending' }),
      Post.countDocuments(),
    ]);

    const pendingApprovals = pendingAlumni + pendingJobs + pendingEvents;

    // ── Department-wise distribution (top 8) ────────────────────
    const deptAgg = await User.aggregate([
      { $match: { role: { $in: ['alumni', 'student'] }, department: { $exists: true, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);
    const departmentDistribution = deptAgg.map(d => ({
      department: d._id || 'Unknown',
      count: d.count,
    }));

    // ── Year-wise alumni count (by batch field, sorted ascending) ──
    const yearAgg = await User.aggregate([
      { $match: { role: 'alumni', batch: { $exists: true, $ne: '' } } },
      { $group: { _id: '$batch', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 10 },
    ]);
    const yearWiseAlumni = yearAgg.map(y => ({
      year: y._id || 'Unknown',
      count: y.count,
    }));

    // ── Recent Registrations (last 7) ───────────────────────────
    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(7)
      .select('name role department batch status createdAt profilePic');

    // ── Recent Posts (last 5) ───────────────────────────────────
    const recentPosts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name profilePic role')
      .select('content media createdAt userId userName userRole');

    // Normalise author field (Post schema uses userId, dashboard expects author.name/role)
    const postsNormalised = recentPosts.map(p => ({
      _id: p._id,
      content: p.content,
      media: p.media,
      createdAt: p.createdAt,
      author: p.userId
        ? { name: p.userId.name, role: p.userId.role, profilePic: p.userId.profilePic }
        : { name: p.userName || 'Unknown', role: p.userRole || '' },
    }));

    // ── Recent Jobs (last 5) ─────────────────────────────────────
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('postedBy', 'name role')
      .select('title company status createdAt postedBy');

    res.json({
      success: true,
      data: {
        kpis: {
          totalStudents,
          totalAlumni,
          activeUsers,
          pendingApprovals,
          totalPosts,
        },
        departmentDistribution,
        yearWiseAlumni,
        recentActivity: {
          registrations: recentRegistrations,
          posts: postsNormalised,
          jobs: recentJobs,
        },
      },
    });
  } catch (err) {
    console.error('[AdminAnalytics]', err);
    res.status(500).json({ message: 'Failed to fetch analytics data.' });
  }
});

module.exports = router;
