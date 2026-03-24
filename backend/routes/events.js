const express = require('express');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/events — All approved events ───────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const events = await Event.find({ status: 'Approved' }).sort({ createdAt: -1 });
    const userId = req.user?._id;
    const result = events.map(event => {
      const obj = event.toJSON();
      obj.registered = userId ? event.registeredBy.some(id => id.toString() === userId.toString()) : false;
      obj.id = obj._id;
      return obj;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

// ─── GET /api/events/pending — Admin only ────────────────────
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const events = await Event.find({ status: 'Pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending events.' });
  }
});

// ─── POST /api/events — Create event (moderated by role) ─────
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, date, time, venue, desc, image } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Event title and date are required.' });
    }

    const isAdmin = req.user.role === 'admin';
    const eventStatus = isAdmin ? 'Approved' : 'Pending';

    const event = await Event.create({
      title, category, date, time, venue, desc, image,
      createdBy: req.user._id,
      createdByRole: req.user.role,
      status: eventStatus
    });

    const obj = event.toJSON();
    obj.registered = false;
    obj.id = obj._id;

    if (isAdmin) {
      try {
        const recipients = await User.find({ role: { $in: ['student', 'alumni'] } }).select('_id');
        const notifDocs = recipients.map(u => ({
          userId: u._id,
          type: 'event_alert',
          title: `New Event: ${event.title}`,
          description: `${event.date || ''} at ${event.venue || 'TBD'} • ${event.category || ''}`,
          icon: '📅',
          relatedId: event._id
        }));
        const created = await Notification.insertMany(notifDocs);

        // Real-time socket push
        const io = req.app.get('io');
        if (io) {
          created.forEach((notif, i) => {
            io.to(recipients[i]._id.toString()).emit('notification_received', notif);
          });
        }
      } catch (_) {}
    } else {
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifDocs = admins.map(a => ({
          userId: a._id,
          type: 'admin_approval_needed',
          title: `Alumni Event Needs Approval: ${event.title}`,
          description: `Posted by ${req.user.name} • ${event.date || ''} at ${event.venue || ''} • Pending review`,
          icon: '⏳',
          relatedId: event._id
        }));
        await Notification.insertMany(notifDocs);
      } catch (_) {}
    }

    res.status(201).json({
      success: true,
      data: obj,
      message: isAdmin ? 'Event created.' : 'Event submitted for admin review.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event.' });
  }
});

// ─── PUT /api/events/:id/approve ─────────────────────────────
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { status: 'Approved' }, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    try {
      const recipients = await User.find({ role: { $in: ['student', 'alumni'] } }).select('_id');
      const notifDocs = recipients.map(u => ({
        userId: u._id,
        type: 'event_alert',
        title: `New Event: ${event.title}`,
        description: `${event.date || ''} at ${event.venue || 'TBD'}`,
        icon: '📅',
        relatedId: event._id
      }));
      const created = await Notification.insertMany(notifDocs);

      // Real-time socket push
      const io = req.app.get('io');
      if (io) {
        created.forEach((notif, i) => {
          io.to(recipients[i]._id.toString()).emit('notification_received', notif);
        });
      }
    } catch (_) {}
    res.json({ success: true, message: 'Event approved.', data: event });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve event.' });
  }
});

// ─── PUT /api/events/:id/reject ──────────────────────────────
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ success: true, message: 'Event rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject event.' });
  }
});

// ─── PUT /api/events/:id/register — Toggle registration ──────
router.put('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    const userId = req.user._id;
    const alreadyRegistered = event.registeredBy.some(id => id.toString() === userId.toString());

    if (alreadyRegistered) {
      event.registeredBy = event.registeredBy.filter(id => id.toString() !== userId.toString());
    } else {
      event.registeredBy.push(userId);
    }

    await event.save();
    const obj = event.toJSON();
    obj.registered = !alreadyRegistered;
    obj.id = obj._id;
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update registration.' });
  }
});

// ─── DELETE /api/events/:id — Delete event (admin) ───────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event.' });
  }
});

module.exports = router;
