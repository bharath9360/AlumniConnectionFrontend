const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/connections/request/:userId ────────────────────
router.post('/request/:userId', protect, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const myId = req.user._id;

    // ── Atlas Fix: Validate ObjectIds before querying ──────────
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

    // ── Atlas Fix: Ensure connections arrays are initialized ───
    me.connections = me.connections || [];
    target.connections = target.connections || [];

    // Check if already connected or pending
    const existingInMe = me.connections.find(c => c.userId?.toString() === targetId);
    const existingInTarget = target.connections.find(c => c.userId?.toString() === myId.toString());

    if (existingInMe || existingInTarget) {
      return res.status(400).json({ message: 'Connection request already exists or you are already connected.' });
    }

    // Add pending connection in both users using updateOne to avoid validation crashes
    // on missing select:false fields (like password)
    await Promise.all([
      User.updateOne(
        { _id: myId },
        { $push: { connections: { userId: targetId, status: 'Pending' } } }
      ),
      User.updateOne(
        { _id: targetId },
        { $push: { connections: { userId: myId, status: 'Pending' } } }
      )
    ]);

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

// ─── PUT /api/connections/accept/:userId ──────────────────────
router.put('/accept/:userId', protect, async (req, res) => {
  try {
    const requesterId = req.params.userId;
    const myId = req.user._id;

    // ── Atlas Fix: Validate ObjectId ───────────────────────────
    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const [me, requester] = await Promise.all([
      User.findById(myId),
      User.findById(requesterId)
    ]);

    if (!me) return res.status(404).json({ message: 'Your profile was not found.' });
    if (!requester) return res.status(404).json({ message: 'User not found.' });

    // ── Atlas Fix: Ensure connections arrays are initialized ───
    me.connections = me.connections || [];
    requester.connections = requester.connections || [];

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

    await Promise.all([
      me.save({ validateBeforeSave: false }),
      requester.save({ validateBeforeSave: false })
    ]);

    // Notify requester their connection was accepted (DB)
    const notif = await Notification.create({
      userId: requesterId,
      type: 'connection_accepted',
      title: `${req.user.name} accepted your connection request`,
      description: `You are now connected with ${req.user.name}`,
      icon: '✅',
      relatedId: myId
    });

    // Real-time socket push
    const io = req.app.get('io');
    if (io) {
      io.to(requesterId.toString()).emit('notification_received', notif);
    }

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

    // ── Atlas Fix: Validate ObjectId ───────────────────────────
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    await Promise.all([
      User.findByIdAndUpdate(myId, { $pull: { connections: { userId: targetId } } }),
      User.findByIdAndUpdate(targetId, { $pull: { connections: { userId: myId } } })
    ]);

    // Update both connectionCounts
    const [me, target] = await Promise.all([User.findById(myId), User.findById(targetId)]);
    if (me) {
      me.connections = me.connections || [];
      me.connectionCount = me.connections.filter(c => c.status === 'Accepted').length.toString();
      await me.save({ validateBeforeSave: false });
    }
    if (target) {
      target.connections = target.connections || [];
      target.connectionCount = target.connections.filter(c => c.status === 'Accepted').length.toString();
      await target.save({ validateBeforeSave: false });
    }

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

    // ── Atlas Fix: Validate ObjectId ───────────────────────────
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const me = await User.findById(myId).select('connections');

    // ── Atlas Fix: Guard against undefined connections ─────────
    if (!me) return res.json({ status: 'none', isReceiver: false });
    me.connections = me.connections || [];

    const conn = me.connections.find(c => c.userId.toString() === targetId);

    if (!conn) return res.json({ status: 'none', isReceiver: false });
    
    let isReceiver = false;
    if (conn.status === 'Pending') {
      const notif = await Notification.findOne({
        userId: myId,
        relatedId: targetId,
        type: 'connection_request'
      });
      if (notif) isReceiver = true;
    }

    res.json({ status: conn.status, isReceiver });
  } catch (err) {
    console.error('Status fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch connection status.' });
  }
});

module.exports = router;
