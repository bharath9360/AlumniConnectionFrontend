const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/connections/request/:userId ────────────────────
router.post('/request/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    if (targetId === myId.toString()) {
      return res.status(400).json({ message: "You can't connect with yourself." });
    }

    const [me, target] = await Promise.all([
      User.findById(myId),
      User.findById(targetId)
    ]);

    if (!target) return res.status(404).json({ message: 'User not found.' });

    // Check if already connected or pending
    const existingInMe = me.connections.find(c => c.userId.toString() === targetId);
    const existingInTarget = target.connections.find(c => c.userId.toString() === myId.toString());

    if (existingInMe || existingInTarget) {
      return res.status(400).json({ message: 'Connection request already exists.' });
    }

    // Add pending connection in both users
    me.connections.push({ userId: targetId, status: 'Pending' });
    target.connections.push({ userId: myId, status: 'Pending' });

    await Promise.all([me.save(), target.save()]);

    // Notify target user
    await Notification.create({
      userId: targetId,
      type: 'connection_request',
      title: `${req.user.name} wants to connect`,
      description: `${req.user.role?.charAt(0).toUpperCase() + req.user.role?.slice(1)} • ${req.user.department || req.user.designation || ''}`,
      icon: '🤝',
      relatedId: myId
    });

    res.json({ success: true, message: 'Connection request sent!' });
  } catch (err) {
    console.error('Connect request error:', err);
    res.status(500).json({ message: 'Failed to send connection request.' });
  }
});

// ─── PUT /api/connections/accept/:userId ──────────────────────
router.put('/accept/:userId', protect, async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const myId = req.user._id;

    const [me, requester] = await Promise.all([
      User.findById(myId),
      User.findById(requesterId)
    ]);

    if (!requester) return res.status(404).json({ message: 'User not found.' });

    // Update status in both users
    const myConn = me.connections.find(c => c.userId.toString() === requesterId);
    const theirConn = requester.connections.find(c => c.userId.toString() === myId.toString());

    if (!myConn || !theirConn) {
      return res.status(400).json({ message: 'No pending connection found.' });
    }

    myConn.status = 'Accepted';
    theirConn.status = 'Accepted';

    // Update connection counts
    me.connectionCount = me.connections.filter(c => c.status === 'Accepted').length.toString();
    requester.connectionCount = requester.connections.filter(c => c.status === 'Accepted').length.toString();

    await Promise.all([me.save(), requester.save()]);

    // Notify requester their connection was accepted
    await Notification.create({
      userId: requesterId,
      type: 'connection_accepted',
      title: `${req.user.name} accepted your connection request`,
      description: `You are now connected with ${req.user.name}`,
      icon: '✅',
      relatedId: myId
    });

    res.json({ success: true, message: 'Connection accepted!' });
  } catch (err) {
    console.error('Accept connection error:', err);
    res.status(500).json({ message: 'Failed to accept connection.' });
  }
});

// ─── DELETE /api/connections/remove/:userId ───────────────────
router.delete('/remove/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    await Promise.all([
      User.findByIdAndUpdate(myId, { $pull: { connections: { userId: targetId } } }),
      User.findByIdAndUpdate(targetId, { $pull: { connections: { userId: myId } } })
    ]);

    // Update both connectionCounts
    const [me, target] = await Promise.all([User.findById(myId), User.findById(targetId)]);
    me.connectionCount = me.connections.filter(c => c.status === 'Accepted').length.toString();
    target.connectionCount = target.connections.filter(c => c.status === 'Accepted').length.toString();
    await Promise.all([me.save(), target.save()]);

    res.json({ success: true, message: 'Connection removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove connection.' });
  }
});

// ─── GET /api/connections/status/:userId ─────────────────────
router.get('/status/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const me = await User.findById(req.user._id).select('connections');
    const conn = me.connections.find(c => c.userId.toString() === targetId);

    if (!conn) return res.json({ status: 'none' });
    res.json({ status: conn.status }); // 'Pending' or 'Accepted'
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch connection status.' });
  }
});

module.exports = router;
