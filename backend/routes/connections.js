const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const ConnectionRequest = require('../models/ConnectionRequest');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/connections/requests ────────────────────────====
// Get all pending connection requests for the logged-in user
router.get('/requests', protect, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({
      receiver: req.user._id,
      status: 'Pending'
    }).populate('sender', 'name role department batch profilePic');

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ message: 'Failed to fetch connection requests.', error: err.message });
  }
});

// ─── POST /api/connections/request/:userId ────────────────────
router.post('/request/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    if (!myId) return res.status(400).json({ message: 'User identity missing.' });
    if (targetId === myId.toString()) {
      return res.status(400).json({ message: "You can't connect with yourself." });
    }

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId)
    ]);

    if (!me) return res.status(404).json({ message: 'Your profile was not found.' });
    if (!target) return res.status(404).json({ message: 'Target user not found.' });

    // Check if an accepted connection already exists
    const u1 = myId.toString() < targetId ? myId : targetId;
    const u2 = myId.toString() < targetId ? targetId : myId;
    const existingConn = await Connection.findOne({ user1: u1, user2: u2 });
    if (existingConn) {
      return res.status(400).json({ message: 'You are already connected.' });
    }

    // Check if a pending or rejected request already exists in either direction
    const existingReq = await ConnectionRequest.findOne({
      $or: [
        { sender: myId, receiver: targetId },
        { sender: targetId, receiver: myId }
      ]
    });

    if (existingReq) {
      if (existingReq.status === 'Pending') {
        return res.status(400).json({ message: 'A pending connection request already exists.' });
      }
      if (existingReq.status === 'Rejected') {
        // Technically we could allow a new request, but for simplicity we remove it and create a new one
        await ConnectionRequest.findByIdAndDelete(existingReq._id);
      }
    }

    const newReq = await ConnectionRequest.create({
      sender: myId,
      receiver: targetId,
      status: 'Pending'
    });

    // Safety check for user role
    const rawRole = req.user.role || 'alumni';
    const cleanRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
    const extraInfo = req.user.department || req.user.designation || '';

    // Notify target user (DB)
    const notif = await Notification.create({
      userId: targetId,
      type: 'connection_request',
      title: `${req.user.name || 'Someone'} wants to connect`,
      description: `${cleanRole}${extraInfo ? ` • ${extraInfo}` : ''}`,
      icon: '🤝',
      relatedId: myId
    });

    // Real-time socket push to target user
    const io = req.app.get('io');
    if (io) {
      io.to(targetId.toString()).emit('notification_received', notif);
    }

    res.json({ success: true, message: 'Connection request sent!' });
  } catch (err) {
    console.error('🔥 Connect request error:', err);
    res.status(500).json({ message: 'Failed to send connection request.', error: err.message });
  }
});

// ─── PUT /api/connections/accept/:requestId ───────────────────
router.put('/accept/:requestId', protect, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }

    const reqDoc = await ConnectionRequest.findOne({ _id: requestId, receiver: myId, status: 'Pending' });
    if (!reqDoc) {
      return res.status(404).json({ message: 'Pending connection request not found or unauthorized.' });
    }

    reqDoc.status = 'Accepted';
    await reqDoc.save();

    // Create Connection Document
    const u1 = reqDoc.sender.toString() < reqDoc.receiver.toString() ? reqDoc.sender : reqDoc.receiver;
    const u2 = reqDoc.sender.toString() < reqDoc.receiver.toString() ? reqDoc.receiver : reqDoc.sender;

    await Connection.updateOne(
      { user1: u1, user2: u2 },
      { $setOnInsert: { user1: u1, user2: u2 } },
      { upsert: true }
    );

    // Update connection counts
    const [senderCount, receiverCount] = await Promise.all([
      Connection.countDocuments({ $or: [{ user1: reqDoc.sender }, { user2: reqDoc.sender }] }),
      Connection.countDocuments({ $or: [{ user1: reqDoc.receiver }, { user2: reqDoc.receiver }] })
    ]);

    await Promise.all([
      User.findByIdAndUpdate(reqDoc.sender, { connectionCount: senderCount.toString() }),
      User.findByIdAndUpdate(reqDoc.receiver, { connectionCount: receiverCount.toString() })
    ]);

    // Notify requester
    const notif = await Notification.create({
      userId: reqDoc.sender,
      type: 'connection_accepted',
      title: `${req.user.name} accepted your connection request`,
      description: `You are now connected with ${req.user.name}`,
      icon: '✅',
      relatedId: myId
    });

    const io = req.app.get('io');
    if (io) {
      io.to(reqDoc.sender.toString()).emit('notification_received', notif);
    }

    res.json({ success: true, message: 'Connection accepted!' });
  } catch (err) {
    console.error('Accept connection error:', err);
    res.status(500).json({ message: 'Failed to accept connection.' });
  }
});

// ─── PUT /api/connections/reject/:requestId ───────────────────
router.put('/reject/:requestId', protect, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }

    const reqDoc = await ConnectionRequest.findOne({ _id: requestId, receiver: myId, status: 'Pending' });
    if (!reqDoc) {
      return res.status(404).json({ message: 'Pending connection request not found or unauthorized.' });
    }

    reqDoc.status = 'Rejected';
    await reqDoc.save();

    res.json({ success: true, message: 'Connection request rejected.' });
  } catch (err) {
    console.error('Reject connection error:', err);
    res.status(500).json({ message: 'Failed to reject connection.' });
  }
});

// ─── DELETE /api/connections/remove/:userId ───────────────────
router.delete('/remove/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const u1 = myId.toString() < targetId ? myId : targetId;
    const u2 = myId.toString() < targetId ? targetId : myId;

    await Connection.deleteOne({ user1: u1, user2: u2 });
    await ConnectionRequest.deleteMany({
      $or: [
        { sender: myId, receiver: targetId },
        { sender: targetId, receiver: myId }
      ]
    });

    // Update connection counts
    const [senderCount, targetCount] = await Promise.all([
      Connection.countDocuments({ $or: [{ user1: myId }, { user2: myId }] }),
      Connection.countDocuments({ $or: [{ user1: targetId }, { user2: targetId }] })
    ]);

    await Promise.all([
      User.findByIdAndUpdate(myId, { connectionCount: senderCount.toString() }),
      User.findByIdAndUpdate(targetId, { connectionCount: targetCount.toString() })
    ]);

    res.json({ success: true, message: 'Connection removed.' });
  } catch (err) {
    console.error('Remove connection error:', err);
    res.status(500).json({ message: 'Failed to remove connection.' });
  }
});

// ─── GET /api/connections/status/:userId ─────────────────────
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    let isReceiver = false;
    let requestId = null;

    // Check if connected
    const u1 = myId.toString() < targetId ? myId : targetId;
    const u2 = myId.toString() < targetId ? targetId : myId;
    
    const conn = await Connection.findOne({ user1: u1, user2: u2 });
    if (conn) {
      return res.json({ status: 'Accepted', isReceiver: false });
    }

    // Check Requests
    const reqDoc = await ConnectionRequest.findOne({
      $or: [
        { sender: myId, receiver: targetId },
        { sender: targetId, receiver: myId }
      ]
    }).sort({ createdAt: -1 });

    if (!reqDoc) return res.json({ status: 'none', isReceiver: false });

    if (reqDoc.receiver.toString() === myId.toString()) {
      isReceiver = true;
      requestId = reqDoc._id; // Provide requestId for Accepting/Rejecting
    } else {
      requestId = reqDoc._id;
    }

    // Convert exact DB status to the frontend model
    return res.json({ status: reqDoc.status, isReceiver, requestId });

  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch connection status.' });
  }
});

// ─── GET /api/connections/my-connections ─────────────────────
// Returns confirmed connections for the logged-in user
router.get('/my-connections', protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const conns = await Connection.find({
      $or: [{ user1: myId }, { user2: myId }]
    }).lean();

    // Extract the other user's ID from each connection pair
    const otherIds = conns.map(c =>
      c.user1.toString() === myId.toString() ? c.user2 : c.user1
    );

    const users = await User.find({ _id: { $in: otherIds } })
      .select('name role department batch graduationYear profilePic company designation presentStatus connectionCount')
      .lean();

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('My-connections error:', err);
    res.status(500).json({ message: 'Failed to fetch connections.' });
  }
});

// ─── GET /api/connections/suggestions ────────────────────────
// Returns paginated suggested users (alumni + students)
// Excludes: self, already connected, pending requests, admins
router.get('/suggestions', protect, async (req, res) => {
  try {
    const myId = req.user._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);
    const role  = req.query.role || ''; // optional filter: 'alumni' | 'student'
    const dept  = req.query.dept || ''; // optional department filter

    // 1. IDs already connected
    const conns = await Connection.find({ $or: [{ user1: myId }, { user2: myId }] }).lean();
    const connectedIds = conns.map(c =>
      c.user1.toString() === myId.toString() ? c.user2.toString() : c.user1.toString()
    );

    // 2. IDs with pending requests (either direction)
    const pendingReqs = await ConnectionRequest.find({
      $or: [{ sender: myId }, { receiver: myId }],
      status: 'Pending'
    }).lean();
    const pendingIds = pendingReqs.map(r =>
      r.sender.toString() === myId.toString() ? r.receiver.toString() : r.sender.toString()
    );

    const excludeIds = [...new Set([myId.toString(), ...connectedIds, ...pendingIds])];

    // 3. Build query
    const query = {
      _id: { $nin: excludeIds },
      role: { $in: ['alumni', 'student'] },
      status: 'Active',
    };
    if (role)  query.role = role;
    if (dept)  query.department = { $regex: dept, $options: 'i' };

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name role department batch graduationYear profilePic company designation presentStatus connectionCount')
      .sort({ connectionCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: users,
      hasMore: total > page * limit,
      page,
      total,
    });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ message: 'Failed to fetch suggestions.' });
  }
});

module.exports = router;
