const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');
const MentorshipRequest = require('../models/MentorshipRequest');
const MentorshipSession = require('../models/MentorshipSession');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { createNotification } = require('../utils/notifyHelper');

// All mentorship routes require authentication
router.use(protect);

// ─── POST /api/mentorship/register-mentor ─────────────────────
// Alumni or staff can register as a mentor
router.post('/register-mentor', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const { skills, domain, experience, bio, isAvailable } = req.body;
    const mentor = await Mentor.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
        domain: Array.isArray(domain) ? domain : (domain ? [domain] : []),
        experience: experience || '',
        bio: bio || '',
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: mentor, message: 'Mentor profile saved.' });
  } catch (err) {
    console.error('[Mentorship] register-mentor error:', err);
    res.status(500).json({ message: 'Failed to save mentor profile.' });
  }
});

// ─── GET /api/mentorship/me/mentor-profile ───────────────────
// Get own mentor profile (alumni/staff)
router.get('/me/mentor-profile', async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ userId: req.user._id });
    res.json({ success: true, data: mentor || null });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch mentor profile.' });
  }
});

// ─── GET /api/mentorship/mentors ──────────────────────────────
// Discover mentors — filter by domain, department, company, search
router.get('/mentors', async (req, res) => {
  try {
    const { domain, department, search, available } = req.query;

    // Start with mentor model — filter available
    const mentorFilter = {};
    if (available === 'true') mentorFilter.isAvailable = true;
    if (domain && domain !== 'all') mentorFilter.domain = { $in: [new RegExp(domain, 'i')] };

    const mentors = await Mentor.find(mentorFilter).lean();
    const mentorUserIds = mentors.map(m => m.userId);

    // Filter the associated users
    const userFilter = {
      _id: { $in: mentorUserIds },
      role: { $in: ['alumni', 'staff'] },
      status: 'Active'
    };
    if (department && department !== 'all') userFilter.department = new RegExp(department, 'i');
    if (search && search.trim()) {
      userFilter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
        { designation: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(userFilter)
      .select('name email profilePic role department batch company designation');

    // Merge mentor data with user data
    const mentorMap = {};
    mentors.forEach(m => { mentorMap[m.userId.toString()] = m; });

    const result = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      profilePic: u.profilePic,
      role: u.role,
      department: u.department,
      batch: u.batch,
      company: u.company,
      designation: u.designation,
      mentorProfile: mentorMap[u._id.toString()] || {}
    }));

    res.json({ success: true, data: result, total: result.length });
  } catch (err) {
    console.error('[Mentorship] mentors error:', err);
    res.status(500).json({ message: 'Failed to fetch mentors.' });
  }
});

// ─── POST /api/mentorship/request ─────────────────────────────
// Student sends a mentorship request
router.post('/request', authorize('student'), async (req, res) => {
  try {
    const { mentorId, message, topic } = req.body;
    if (!mentorId) return res.status(400).json({ message: 'mentorId is required.' });

    // Mentor must exist
    const mentorProfile = await Mentor.findOne({ userId: mentorId });
    if (!mentorProfile) return res.status(404).json({ message: 'Mentor profile not found.' });
    if (!mentorProfile.isAvailable) return res.status(400).json({ message: 'This mentor is currently unavailable.' });

    const request = await MentorshipRequest.create({
      menteeId: req.user._id,
      mentorId,
      message: message || '',
      topic: topic || '',
      status: 'pending'
    });

    // Notify the mentor
    await createNotification(req.app.get('io'), {
      userId: mentorId,
      type: 'mentorship',
      title: `New Mentorship Request from ${req.user.name}`,
      description: topic ? `Topic: ${topic}` : message || 'They would like your guidance.',
      icon: '🎓',
      relatedId: request._id
    });

    res.status(201).json({ success: true, data: request, message: 'Request sent successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already sent a request to this mentor.' });
    }
    console.error('[Mentorship] request error:', err);
    res.status(500).json({ message: 'Failed to send request.' });
  }
});

// ─── GET /api/mentorship/my-requests ─────────────────────────
// Student sees their outgoing requests
router.get('/my-requests', async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ menteeId: req.user._id })
      .populate('mentorId', 'name email profilePic role department company designation')
      .sort({ createdAt: -1 });

    // Attach mentor profiles
    const mentorIds = requests.map(r => r.mentorId?._id).filter(Boolean);
    const profiles  = await Mentor.find({ userId: { $in: mentorIds } }).lean();
    const profMap   = {};
    profiles.forEach(p => { profMap[p.userId.toString()] = p; });

    const result = requests.map(r => {
      const obj = r.toObject();
      obj.mentorProfile = profMap[r.mentorId?._id?.toString()] || {};
      return obj;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch requests.' });
  }
});

// ─── GET /api/mentorship/incoming-requests ────────────────────
// Mentor sees pending requests directed at them
router.get('/incoming-requests', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      mentorId: req.user._id,
      status: 'pending'
    })
      .populate('menteeId', 'name email profilePic department batch')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch incoming requests.' });
  }
});

// ─── PUT /api/mentorship/request/:id/accept ───────────────────
router.put('/request/:id/accept', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${request.status}.` });
    }

    request.status = 'accepted';
    await request.save();

    // Create session
    const session = await MentorshipSession.create({
      menteeId:  request.menteeId,
      mentorId:  request.mentorId,
      requestId: request._id,
      topic:     request.topic || ''
    });

    // Notify mentee
    await createNotification(req.app.get('io'), {
      userId: request.menteeId,
      type: 'mentorship',
      title: `${req.user.name} accepted your mentorship request! 🎉`,
      description: request.topic ? `Topic: ${request.topic}` : 'Your mentorship journey begins now.',
      icon: '✅',
      relatedId: session._id
    });

    res.json({ success: true, data: { request, session }, message: 'Request accepted. Session started.' });
  } catch (err) {
    console.error('[Mentorship] accept error:', err);
    res.status(500).json({ message: 'Failed to accept request.' });
  }
});

// ─── PUT /api/mentorship/request/:id/reject ───────────────────
router.put('/request/:id/reject', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const request = await MentorshipRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    request.status = 'rejected';
    await request.save();

    // Notify mentee
    await createNotification(req.app.get('io'), {
      userId: request.menteeId,
      type: 'mentorship',
      title: `Mentorship request was declined`,
      description: `${req.user.name} is currently unavailable. Try other mentors.`,
      icon: '❌',
      relatedId: request._id
    });

    res.json({ success: true, message: 'Request rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject request.' });
  }
});

// ─── GET /api/mentorship/my-sessions ─────────────────────────
// Any authenticated user — returns sessions where they are mentor or mentee
router.get('/my-sessions', async (req, res) => {
  try {
    const uid = req.user._id;
    const sessions = await MentorshipSession.find({
      $or: [{ menteeId: uid }, { mentorId: uid }]
    })
      .populate('menteeId', 'name email profilePic department batch')
      .populate('mentorId', 'name email profilePic department company designation role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions.' });
  }
});

// ─── PUT /api/mentorship/session/:id/complete ────────────────
// Mentor marks session as complete + adds notes
router.put('/session/:id/complete', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the mentor can mark completion.' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    if (req.body.notes) session.notes = req.body.notes;
    await session.save();

    // Update mentor stats
    await Mentor.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalSessions: 1 } }
    );

    // Notify mentee to leave feedback
    await createNotification(req.app.get('io'), {
      userId: session.menteeId,
      type: 'mentorship',
      title: `Mentorship session completed! Leave feedback 🌟`,
      description: `Rate your experience with ${req.user.name} to help others find great mentors.`,
      icon: '⭐',
      relatedId: session._id
    });

    res.json({ success: true, data: session, message: 'Session marked as completed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to complete session.' });
  }
});

// ─── PUT /api/mentorship/session/:id/feedback ────────────────
// Mentee submits rating + comment after session completes
router.put('/session/:id/feedback', async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.menteeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the mentee can leave feedback.' });
    }
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Session must be completed before feedback.' });
    }
    if (session.feedback?.rating) {
      return res.status(400).json({ message: 'Feedback already submitted.' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    session.feedback = { rating, comment: comment || '', submittedAt: new Date() };
    await session.save();

    // Update mentor's average rating
    const mentor = await Mentor.findOne({ userId: session.mentorId });
    if (mentor) {
      const newTotal  = mentor.totalRatings + 1;
      const newAvg    = ((mentor.avgRating * mentor.totalRatings) + rating) / newTotal;
      mentor.avgRating    = Math.round(newAvg * 10) / 10;
      mentor.totalRatings = newTotal;
      await mentor.save();
    }

    res.json({ success: true, message: 'Feedback submitted. Thank you! 🙏' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback.' });
  }
});

// ─── PUT /api/mentorship/session/:id/notes ──────────────────
// Mentor adds/edits session notes
router.put('/session/:id/notes', authorize('alumni', 'staff', 'admin'), async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the mentor can edit notes.' });
    }
    session.notes = req.body.notes || '';
    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notes.' });
  }
});

module.exports = router;
