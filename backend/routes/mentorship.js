const express = require('express');
const router = express.Router();
const Mentor = require('../models/Mentor');
const MentorshipRequest = require('../models/MentorshipRequest');
const MentorshipSession = require('../models/MentorshipSession');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const {
  protect
} = require('../middleware/auth');
const {
  createNotification
} = require('../utils/notifyHelper');
const {
  postUpload,
  uploadToCloudinary
} = require('../middleware/upload');

// All mentorship routes require authentication
const asyncHandler = require("../middleware/asyncHandler");
router.use(protect);

// ─── POST /api/mentorship/register-mentor ─────────────────────
// ANY authenticated user can register as a mentor
router.post('/register-mentor', asyncHandler(async (req, res, next) => {
  const {
    skills,
    domain,
    experience,
    bio,
    isAvailable
  } = req.body;
  const mentor = await Mentor.findOneAndUpdate({
    userId: req.user._id
  }, {
    userId: req.user._id,
    skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
    domain: Array.isArray(domain) ? domain : domain ? [domain] : [],
    experience: experience || '',
    bio: bio || '',
    isAvailable: isAvailable !== undefined ? isAvailable : true
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });
  res.json({
    success: true,
    data: mentor,
    message: 'Mentor profile saved.'
  });
}));

// ─── GET /api/mentorship/me/mentor-profile ───────────────────
router.get('/me/mentor-profile', asyncHandler(async (req, res, next) => {
  const mentor = await Mentor.findOne({
    userId: req.user._id
  });
  res.json({
    success: true,
    data: mentor || null
  });
}));

// ─── GET /api/mentorship/mentors ──────────────────────────────
router.get('/mentors', asyncHandler(async (req, res, next) => {
  const {
    domain,
    department,
    search,
    available,
    page = 1,
    limit = 20
  } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const mentorFilter = {};
  if (available === 'true') mentorFilter.isAvailable = true;
  if (domain && domain !== 'all') mentorFilter.domain = {
    $in: [new RegExp(domain, 'i')]
  };
  const mentors = await Mentor.find(mentorFilter).lean();
  const mentorUserIds = mentors.map(m => m.userId);
  const userFilter = {
    _id: {
      $in: mentorUserIds
    },
    status: 'Active'
  };
  // Exclude self — must handle $in + $nin together
  userFilter._id = {
    $in: mentorUserIds,
    $nin: [req.user._id]
  };
  if (department && department !== 'all') userFilter.department = new RegExp(department, 'i');
  if (search && search.trim()) {
    userFilter.$or = [{
      name: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      company: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      designation: {
        $regex: search.trim(),
        $options: 'i'
      }
    }];
  }
  const total = await User.countDocuments(userFilter);
  const users = await User.find(userFilter).select('name email profilePic role department batch company designation').skip(skip).limit(parseInt(limit));
  const mentorMap = {};
  mentors.forEach(m => {
    mentorMap[m.userId.toString()] = m;
  });

  // Get session count per mentor for "Previously mentored you X times" UX
  const sessionCounts = await MentorshipSession.aggregate([{
    $match: {
      menteeId: req.user._id,
      mentorId: {
        $in: mentorUserIds
      },
      status: 'completed'
    }
  }, {
    $group: {
      _id: '$mentorId',
      count: {
        $sum: 1
      }
    }
  }]);
  const sessionCountMap = {};
  sessionCounts.forEach(s => {
    sessionCountMap[s._id.toString()] = s.count;
  });
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
    mentorProfile: mentorMap[u._id.toString()] || {},
    pastSessionsWithMe: sessionCountMap[u._id.toString()] || 0
  }));
  res.json({
    success: true,
    data: result,
    total,
    page: parseInt(page),
    hasMore: skip + result.length < total
  });
}));

// ─── POST /api/mentorship/request ─────────────────────────────
// Allow re-request as long as there's no active pending/accepted request
router.post('/request', asyncHandler(async (req, res, next) => {
  const {
    mentorId,
    message,
    topic
  } = req.body;
  if (!mentorId) return res.status(400).json({
    message: 'mentorId is required.'
  });
  if (mentorId === req.user._id.toString()) {
    return res.status(400).json({
      message: 'You cannot request mentorship from yourself.'
    });
  }
  const mentorProfile = await Mentor.findOne({
    userId: mentorId
  });
  if (!mentorProfile) return res.status(404).json({
    message: 'Mentor profile not found.'
  });
  if (!mentorProfile.isAvailable) return res.status(400).json({
    message: 'This mentor is currently unavailable.'
  });

  // Block only if there's already a pending or active (accepted) request
  const existing = await MentorshipRequest.findOne({
    menteeId: req.user._id,
    mentorId,
    status: {
      $in: ['pending', 'accepted']
    }
  });
  if (existing) {
    return res.status(400).json({
      message: existing.status === 'pending' ? 'You already have a pending request with this mentor.' : 'You already have an active session with this mentor. Complete it first.'
    });
  }
  const request = await MentorshipRequest.create({
    menteeId: req.user._id,
    mentorId,
    message: message || '',
    topic: topic || '',
    status: 'pending'
  });
  await createNotification(req.app.get('io'), {
    userId: mentorId,
    type: 'mentorship',
    title: `New Mentorship Request from ${req.user.name}`,
    description: topic ? `Topic: ${topic}` : message || 'They would like your guidance.',
    icon: '🎓',
    relatedId: request._id
  });
  res.status(201).json({
    success: true,
    data: request,
    message: 'Request sent successfully.'
  });
}));

// ─── GET /api/mentorship/my-requests ─────────────────────────
router.get('/my-requests', asyncHandler(async (req, res, next) => {
  const requests = await MentorshipRequest.find({
    menteeId: req.user._id
  }).populate('mentorId', 'name email profilePic role department company designation').sort({
    createdAt: -1
  });
  const mentorIds = requests.map(r => r.mentorId?._id).filter(Boolean);
  const profiles = await Mentor.find({
    userId: {
      $in: mentorIds
    }
  }).lean();
  const profMap = {};
  profiles.forEach(p => {
    profMap[p.userId.toString()] = p;
  });
  const result = requests.map(r => {
    const obj = r.toObject();
    obj.mentorProfile = profMap[r.mentorId?._id?.toString()] || {};
    return obj;
  });
  res.json({
    success: true,
    data: result
  });
}));

// ─── GET /api/mentorship/incoming-requests ────────────────────
router.get('/incoming-requests', asyncHandler(async (req, res, next) => {
  const requests = await MentorshipRequest.find({
    mentorId: req.user._id,
    status: 'pending'
  }).populate('menteeId', 'name email profilePic role department batch').sort({
    createdAt: -1
  });
  res.json({
    success: true,
    data: requests
  });
}));

// ─── PUT /api/mentorship/request/:id/accept ───────────────────
router.put('/request/:id/accept', asyncHandler(async (req, res, next) => {
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) return res.status(404).json({
    message: 'Request not found.'
  });
  if (request.mentorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Not authorized.'
    });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({
      message: `Request already ${request.status}.`
    });
  }
  request.status = 'accepted';
  await request.save();

  // Reuse ANY existing chat between this pair, or create a new one
  let chat = await Chat.findOne({
    isGroupChat: false,
    participants: {
      $all: [request.mentorId, request.menteeId],
      $size: 2
    }
  });
  const sessionNumber = (await MentorshipSession.countDocuments({
    mentorId: request.mentorId,
    menteeId: request.menteeId
  })) + 1;
  if (!chat) {
    const menteeUser = await User.findById(request.menteeId).select('name');
    chat = await Chat.create({
      isGroupChat: false,
      isMentorshipChat: true,
      chatName: `Mentorship: ${req.user.name} ↔ ${menteeUser?.name || 'Mentee'}`,
      participants: [request.mentorId, request.menteeId]
    });
  } else {
    // Post a session-divider system message in the existing chat
    await Message.create({
      chatId: chat._id,
      senderId: req.user._id,
      text: `📚 Session ${sessionNumber} started — Topic: ${request.topic || 'General'}`,
      messageType: 'text'
    });
  }
  const session = await MentorshipSession.create({
    menteeId: request.menteeId,
    mentorId: request.mentorId,
    requestId: request._id,
    chatId: chat._id,
    topic: request.topic || ''
  });

  // Keep chat's session ref pointing to the latest session
  chat.mentorshipSessionRef = session._id;
  await chat.save();
  await createNotification(req.app.get('io'), {
    userId: request.menteeId,
    type: 'mentorship',
    title: `${req.user.name} accepted your mentorship request! 🎉`,
    description: request.topic ? `Session ${sessionNumber} — Topic: ${request.topic}` : 'Your mentorship journey continues!',
    icon: '✅',
    relatedId: session._id
  });
  res.json({
    success: true,
    data: {
      request,
      session,
      chatId: chat._id
    },
    message: 'Request accepted. Session started.'
  });
}));

// ─── PUT /api/mentorship/request/:id/reject ───────────────────
router.put('/request/:id/reject', asyncHandler(async (req, res, next) => {
  const request = await MentorshipRequest.findById(req.params.id);
  if (!request) return res.status(404).json({
    message: 'Request not found.'
  });
  if (request.mentorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Not authorized.'
    });
  }
  request.status = 'rejected';
  await request.save();
  await createNotification(req.app.get('io'), {
    userId: request.menteeId,
    type: 'mentorship',
    title: `Mentorship request was declined`,
    description: `${req.user.name} is currently unavailable. Try other mentors.`,
    icon: '❌',
    relatedId: request._id
  });
  res.json({
    success: true,
    message: 'Request rejected.'
  });
}));

// ─── GET /api/mentorship/my-sessions ─────────────────────────
// Returns all sessions — grouped by the other person for UX
router.get('/my-sessions', asyncHandler(async (req, res, next) => {
  const uid = req.user._id;
  const sessions = await MentorshipSession.find({
    $or: [{
      menteeId: uid
    }, {
      mentorId: uid
    }]
  }).populate('menteeId', 'name email profilePic department batch role').populate('mentorId', 'name email profilePic department company designation role').sort({
    createdAt: -1
  });
  res.json({
    success: true,
    data: sessions
  });
}));

// ─── PUT /api/mentorship/session/:id/complete ────────────────
router.put('/session/:id/complete', asyncHandler(async (req, res, next) => {
  const session = await MentorshipSession.findById(req.params.id);
  if (!session) return res.status(404).json({
    message: 'Session not found.'
  });
  if (session.mentorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Only the mentor can mark completion.'
    });
  }
  session.status = 'completed';
  session.completedAt = new Date();
  if (req.body.notes) session.notes = req.body.notes;
  await session.save();
  await Mentor.findOneAndUpdate({
    userId: req.user._id
  }, {
    $inc: {
      totalSessions: 1
    }
  });

  // Post completion marker in the mentorship chat
  if (session.chatId) {
    const sessionNum = await MentorshipSession.countDocuments({
      mentorId: session.mentorId,
      menteeId: session.menteeId,
      _id: {
        $lte: session._id
      }
    });
    await Message.create({
      chatId: session.chatId,
      senderId: req.user._id,
      text: `✅ Session ${sessionNum} completed. Great work! ${session.topic ? `Topic was: ${session.topic}` : ''}`,
      messageType: 'text'
    });
  }
  await createNotification(req.app.get('io'), {
    userId: session.menteeId,
    type: 'mentorship',
    title: `Mentorship session completed! Leave feedback 🌟`,
    description: `Rate your experience with ${req.user.name}. You can request another session anytime!`,
    icon: '⭐',
    relatedId: session._id
  });
  res.json({
    success: true,
    data: session,
    message: 'Session marked as completed.'
  });
}));

// ─── PUT /api/mentorship/session/:id/feedback ────────────────
router.put('/session/:id/feedback', asyncHandler(async (req, res, next) => {
  const session = await MentorshipSession.findById(req.params.id);
  if (!session) return res.status(404).json({
    message: 'Session not found.'
  });
  if (session.menteeId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Only the mentee can leave feedback.'
    });
  }
  if (session.status !== 'completed') {
    return res.status(400).json({
      message: 'Session must be completed before feedback.'
    });
  }
  if (session.feedback?.rating) {
    return res.status(400).json({
      message: 'Feedback already submitted.'
    });
  }
  const {
    rating,
    comment
  } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      message: 'Rating must be between 1 and 5.'
    });
  }
  session.feedback = {
    rating,
    comment: comment || '',
    submittedAt: new Date()
  };
  await session.save();

  // Update mentor's aggregate rating
  const mentor = await Mentor.findOne({
    userId: session.mentorId
  });
  if (mentor) {
    const newTotal = mentor.totalRatings + 1;
    const newAvg = (mentor.avgRating * mentor.totalRatings + rating) / newTotal;
    mentor.avgRating = Math.round(newAvg * 10) / 10;
    mentor.totalRatings = newTotal;
    await mentor.save();
  }
  res.json({
    success: true,
    message: 'Feedback submitted. Thank you! 🙏'
  });
}));

// ─── PUT /api/mentorship/session/:id/notes ──────────────────
router.put('/session/:id/notes', asyncHandler(async (req, res, next) => {
  const session = await MentorshipSession.findById(req.params.id);
  if (!session) return res.status(404).json({
    message: 'Session not found.'
  });
  if (session.mentorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Only the mentor can edit notes.'
    });
  }
  if (req.body.notes !== undefined) session.notes = req.body.notes;
  if (req.body.resources !== undefined) session.resources = req.body.resources;
  await session.save();
  res.json({
    success: true,
    data: session
  });
}));

// ─── POST /api/mentorship/chat/:chatId/image ────────────────
router.post('/chat/:chatId/image', postUpload.single('image'), asyncHandler(async (req, res, next) => {
  const {
    chatId
  } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({
    message: 'Chat not found.'
  });
  const isParticipant = chat.participants.some(p => p.toString() === req.user._id.toString());
  if (!isParticipant) return res.status(403).json({
    message: 'Not authorized.'
  });
  if (!req.file) return res.status(400).json({
    message: 'No image file provided.'
  });
  const imageUrl = await uploadToCloudinary(req.file.buffer, 'alumni/mentorship_chat', 'image', {
    transformation: [{
      width: 800,
      crop: 'limit'
    }, {
      quality: 'auto',
      fetch_format: 'auto'
    }]
  });
  let message = await Message.create({
    chatId,
    senderId: req.user._id,
    text: req.body.caption || '',
    image: imageUrl,
    messageType: req.body.caption ? 'mixed' : 'image'
  });
  message = await message.populate('senderId', 'name profilePic');
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: {
      text: '📷 Image',
      senderId: req.user._id,
      timestamp: new Date()
    },
    updatedAt: new Date()
  });
  const io = req.app.get('io');
  if (io) io.to(chatId).emit('message_received', message);

  res.json({
    success: true,
    data: message
  });
}));
module.exports = router;