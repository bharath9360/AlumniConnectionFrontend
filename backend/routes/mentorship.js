const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');
const MentorshipRequest = require('../models/MentorshipRequest');
const MentorshipSession = require('../models/MentorshipSession');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/notifyHelper');
const { postUpload, uploadToCloudinary } = require('../middleware/upload');

// All mentorship routes require authentication
router.use(protect);

// ─── POST /api/mentorship/register-mentor ─────────────────────
// ANY role (student, alumni, staff) can register as a mentor
router.post('/register-mentor', async (req, res) => {
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
    const { domain, department, search, available, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Start with mentor model — filter available
    const mentorFilter = {};
    if (available === 'true') mentorFilter.isAvailable = true;
    if (domain && domain !== 'all') mentorFilter.domain = { $in: [new RegExp(domain, 'i')] };

    const mentors = await Mentor.find(mentorFilter).lean();
    const mentorUserIds = mentors.map(m => m.userId);

    // Filter the associated users — no role restriction (students can be mentors too)
    const userFilter = {
      _id: { $in: mentorUserIds },
      status: 'Active'
    };
    // Exclude self
    userFilter._id.$nin = [req.user._id];

    if (department && department !== 'all') userFilter.department = new RegExp(department, 'i');
    if (search && search.trim()) {
      userFilter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
        { designation: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(userFilter);
    const users = await User.find(userFilter)
      .select('name email profilePic role department batch company designation')
      .skip(skip)
      .limit(parseInt(limit));

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

    res.json({
      success: true,
      data: result,
      total,
      page: parseInt(page),
      hasMore: skip + result.length < total
    });
  } catch (err) {
    console.error('[Mentorship] mentors error:', err);
    res.status(500).json({ message: 'Failed to fetch mentors.' });
  }
});

// ─── POST /api/mentorship/request ─────────────────────────────
// Anyone can send a mentorship request (dual-role)
router.post('/request', async (req, res) => {
  try {
    const { mentorId, message, topic } = req.body;
    if (!mentorId) return res.status(400).json({ message: 'mentorId is required.' });

    // Can't request yourself
    if (mentorId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot request mentorship from yourself.' });
    }

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
// Outgoing requests (as mentee)
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
// Pending incoming requests (as mentor) — any user with a mentor profile
router.get('/incoming-requests', async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({
      mentorId: req.user._id,
      status: 'pending'
    })
      .populate('menteeId', 'name email profilePic role department batch')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch incoming requests.' });
  }
});

// ─── PUT /api/mentorship/request/:id/accept ───────────────────
router.put('/request/:id/accept', async (req, res) => {
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

    // Create or locate a dedicated mentorship chat between mentor and mentee
    let chat = await Chat.findOne({
      isMentorshipChat: true,
      participants: { $all: [request.mentorId, request.menteeId], $size: 2 }
    });

    if (!chat) {
      const menteeUser = await User.findById(request.menteeId).select('name');
      chat = await Chat.create({
        isGroupChat: false,
        isMentorshipChat: true,
        chatName: `Mentorship: ${req.user.name} ↔ ${menteeUser?.name || 'Mentee'}`,
        participants: [request.mentorId, request.menteeId]
      });
    }

    // Create session linked to the chat
    const session = await MentorshipSession.create({
      menteeId:  request.menteeId,
      mentorId:  request.mentorId,
      requestId: request._id,
      chatId:    chat._id,
      topic:     request.topic || ''
    });

    // Update the chat's session ref
    chat.mentorshipSessionRef = session._id;
    await chat.save();

    // Notify mentee
    await createNotification(req.app.get('io'), {
      userId: request.menteeId,
      type: 'mentorship',
      title: `${req.user.name} accepted your mentorship request! 🎉`,
      description: request.topic ? `Topic: ${request.topic}` : 'Your mentorship journey begins now.',
      icon: '✅',
      relatedId: session._id
    });

    res.json({ success: true, data: { request, session, chatId: chat._id }, message: 'Request accepted. Session started.' });
  } catch (err) {
    console.error('[Mentorship] accept error:', err);
    res.status(500).json({ message: 'Failed to accept request.' });
  }
});

// ─── PUT /api/mentorship/request/:id/reject ───────────────────
router.put('/request/:id/reject', async (req, res) => {
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
// Returns sessions where user is mentor OR mentee
router.get('/my-sessions', async (req, res) => {
  try {
    const uid = req.user._id;
    const sessions = await MentorshipSession.find({
      $or: [{ menteeId: uid }, { mentorId: uid }]
    })
      .populate('menteeId', 'name email profilePic department batch role')
      .populate('mentorId', 'name email profilePic department company designation role')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions.' });
  }
});

// ─── PUT /api/mentorship/session/:id/complete ────────────────
// Mentor marks session as complete
router.put('/session/:id/complete', async (req, res) => {
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
// Mentor adds/edits session notes + resources
router.put('/session/:id/notes', async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    if (session.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the mentor can edit notes.' });
    }
    if (req.body.notes !== undefined)     session.notes = req.body.notes;
    if (req.body.resources !== undefined) session.resources = req.body.resources;
    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notes.' });
  }
});

// ─── POST /api/mentorship/chat/:chatId/image ────────────────
// Upload image in mentorship chat (Cloudinary + send as message)
router.post('/chat/:chatId/image', postUpload.single('image'), async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify the chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found.' });
    const isParticipant = chat.participants.some(p => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized.' });

    if (!req.file) return res.status(400).json({ message: 'No image file provided.' });

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'alumni/mentorship_chat',
      'image',
      {
        transformation: [
          { width: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    // Create message with image
    let message = await Message.create({
      chatId,
      senderId: req.user._id,
      text: req.body.caption || '',
      image: imageUrl,
      messageType: req.body.caption ? 'mixed' : 'image'
    });

    message = await message.populate('senderId', 'name profilePic');
    message = await message.populate('chatId');

    // Update last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: {
        text: '📷 Image',
        senderId: req.user._id,
        timestamp: new Date()
      },
      updatedAt: new Date()
    });

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(chatId).emit('message received', message);
    }

    res.json({ success: true, data: message });
  } catch (err) {
    console.error('[Mentorship] chat image upload error:', err);
    res.status(500).json({ message: 'Failed to upload image.' });
  }
});

module.exports = router;
