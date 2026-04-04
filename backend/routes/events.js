const express = require('express');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifyHelper');

const router = express.Router();

// ─── GET /api/events — All approved events ───────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { status: 'Approved' };
    if (category && category !== 'All') query.category = category;
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { venue: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });
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

// ─── GET /api/events/admin/all — Admin: all events (any status)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      search = '', status = '', category = '',
      page = 1, limit = 12, sort = 'createdAt', order = 'desc',
    } = req.query;

    const query = {};
    if (status)   query.status   = status;
    if (category) query.category = category;
    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { venue: { $regex: search.trim(), $options: 'i' } },
        { desc:  { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip    = (Number(page) - 1) * Number(limit);
    const sortDir = order === 'asc' ? 1 : -1;
    const total   = await Event.countDocuments(query);

    const events = await Event.find(query)
      .populate('createdBy', 'name email role')
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: events,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
});

// ─── GET /api/events/:id/attendees — Admin: see who registered
router.get('/:id/attendees', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredBy', 'name email profilePic role department batch graduationYear');
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ success: true, data: event.registeredBy, total: event.registeredBy.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attendees.' });
  }
});

// ─── PUT /api/events/:id — Admin: edit an event ──────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['title', 'category', 'date', 'time', 'venue', 'desc', 'image', 'status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const event = await Event.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ success: true, data: event, message: 'Event updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event.' });
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
      // Notify all admins — with real-time socket push
      try {
        const io = req.app.get('io');
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifDocs = admins.map(a => ({
          userId: a._id,
          type: 'admin_approval_needed',
          title: `New Event Needs Approval: ${event.title}`,
          description: `Posted by ${req.user.name} (${req.user.role}) • ${event.date || ''} at ${event.venue || ''} • Pending review`,
          icon: '⏳',
          relatedId: event._id
        }));
        const created = await Notification.insertMany(notifDocs);
        if (io) {
          created.forEach(n => io.to(n.userId.toString()).emit('notification_received', n.toObject()));
        }
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

    // Notify the event creator their submission was approved
    if (event.createdBy) {
      await createNotification(req.app.get('io'), {
        userId: event.createdBy,
        type: 'event_alert',
        title: `✅ Your event "${event.title}" was approved`,
        description: `Your event on ${event.date || 'TBD'} at ${event.venue || 'TBD'} is now live.`,
        icon: '📅',
        relatedId: event._id,
      });
    }

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

    // Notify the event creator
    if (event.createdBy) {
      await createNotification(req.app.get('io'), {
        userId: event.createdBy,
        type: 'system',
        title: `❌ Your event "${event.title}" was not approved`,
        description: 'Your event submission did not meet our guidelines. Please review and resubmit.',
        icon: '🚫',
        relatedId: event._id,
      });
    }

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
