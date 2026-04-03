const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const ConnectionRequest = require('../models/ConnectionRequest');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/connections/requests ────────────────────────────
// Incoming: pending requests where I am the receiver
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

// ─── GET /api/connections/sent-requests ───────────────────────
// Outgoing: pending requests I have sent (so frontend can show "Pending" state)
router.get('/sent-requests', protect, async (req, res) => {
  try {
    const sent = await ConnectionRequest.find({
      sender: req.user._id,
      status: 'Pending'
    }).populate('receiver', 'name role department batch profilePic').lean();

    res.json({ success: true, data: sent });
  } catch (err) {
    console.error('Fetch sent-requests error:', err);
    res.status(500).json({ message: 'Failed to fetch sent requests.' });
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
// Smart suggestion engine — scored by:
//   +40  same department
//   +30  same batch
//   +10  each mutual connection (capped at +50)
//   fallback: random active alumni/students
// Excludes: self, already connected, pending requests, admins, inactive
router.get('/suggestions', protect, async (req, res) => {
  try {
    const myId     = req.user._id;
    const me       = req.user;                         // populated by protect middleware
    const roleFilter = req.query.role || '';           // optional: 'alumni' | 'student'
    const limit      = Math.min(50, parseInt(req.query.limit) || 20);

    // ── 1. Build exclusion list ───────────────────────────────
    const [myConns, pendingReqs] = await Promise.all([
      Connection.find({ $or: [{ user1: myId }, { user2: myId }] }).lean(),
      ConnectionRequest.find({
        $or: [{ sender: myId }, { receiver: myId }],
        status: 'Pending'
      }).lean()
    ]);

    const connectedIds = myConns.map(c =>
      c.user1.toString() === myId.toString() ? c.user2.toString() : c.user1.toString()
    );
    const pendingIds = pendingReqs.map(r =>
      r.sender.toString() === myId.toString() ? r.receiver.toString() : r.sender.toString()
    );
    const excludeSet = new Set([myId.toString(), ...connectedIds, ...pendingIds]);

    // ── 2. Build mutual-connection map ───────────────────────
    // My connections' connection lists → who they know (potential mutuals)
    const mutualMap = {}; // userId → mutual count
    if (connectedIds.length > 0) {
      const friendConns = await Connection.find({
        $or: [
          { user1: { $in: connectedIds } },
          { user2: { $in: connectedIds } }
        ]
      }).lean();

      for (const fc of friendConns) {
        const other = connectedIds.includes(fc.user1.toString()) ? fc.user2.toString() : fc.user1.toString();
        if (!excludeSet.has(other)) {
          mutualMap[other] = (mutualMap[other] || 0) + 1;
        }
      }
    }

    // ── 3. Fetch candidate pool ──────────────────────────────
    const baseQuery = {
      _id: { $nin: [...excludeSet] },
      role: { $in: ['alumni', 'student'] },
      status: 'Active',
    };
    if (roleFilter && ['alumni', 'student'].includes(roleFilter)) {
      baseQuery.role = roleFilter;
    }

    // Fetch generously – we'll score + sort + slice in memory
    const poolSize = Math.min(300, limit * 15);
    const candidates = await User.find(baseQuery)
      .select('name role department batch graduationYear profilePic company designation presentStatus connectionCount')
      .limit(poolSize)
      .lean();

    // ── 4. Score each candidate ──────────────────────────────
    const myDept  = (me.department  || '').toLowerCase().trim();
    const myBatch = (me.batch       || '').toLowerCase().trim();

    const scored = candidates.map(u => {
      let score = 0;

      // Same department (+40)
      if (myDept && (u.department || '').toLowerCase().trim() === myDept) {
        score += 40;
      }

      // Same batch (+30)
      if (myBatch && (u.batch || '').toLowerCase().trim() === myBatch) {
        score += 30;
      }

      // Mutual connections (+10 each, cap at +50)
      const mutuals = mutualMap[u._id.toString()] || 0;
      score += Math.min(50, mutuals * 10);

      // Tiebreaker: more connected users rank slightly higher
      score += Math.min(10, parseInt(u.connectionCount) || 0);

      return { ...u, _score: score, _mutualCount: mutuals };
    });

    // ── 5. Sort by score desc, shuffle equal-scored groups for variety ──
    scored.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return Math.random() - 0.5; // random tiebreak for variety
    });

    const results = scored.slice(0, limit).map(({ _score, _mutualCount, ...u }) => ({
      ...u,
      mutualConnections: _mutualCount,
    }));

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (err) {
    console.error('Smart suggestions error:', err);
    res.status(500).json({ message: 'Failed to fetch suggestions.' });
  }
});

module.exports = router;

