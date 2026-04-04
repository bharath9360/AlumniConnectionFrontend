const express = require('express');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { createNotification } = require('../utils/notifyHelper');

const router = express.Router();

// ─── GET /api/jobs — All approved jobs, newest first ───────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, location: loc, department, search } = req.query;
    const query = { status: 'Approved' };
    if (type && type !== 'All')           query.type = type;
    if (loc && loc !== 'All')             query.location = { $regex: loc, $options: 'i' };
    if (department && department !== 'All') query.department = { $regex: department, $options: 'i' };
    if (search && search.trim()) {
      query.$or = [
        { title:   { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    const userId = req.user?._id;
    const result = jobs.map(job => {
      const obj = job.toJSON();
      obj.applied = userId ? job.appliedBy.some(id => id.toString() === userId.toString()) : false;
      obj.id = obj._id;
      return obj;
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

// ─── GET /api/jobs/pending — Admin only: pending jobs ────────
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Pending' })
      .populate('postedBy', 'name email role department')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending jobs.' });
  }
});

// ─── GET /api/jobs/admin/all — Admin: all jobs (any status) ──
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      search = '', status = '', type = '',
      page = 1, limit = 12, sort = 'createdAt', order = 'desc',
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type)   query.type   = type;
    if (search.trim()) {
      query.$or = [
        { title:       { $regex: search.trim(), $options: 'i' } },
        { company:     { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip     = (Number(page) - 1) * Number(limit);
    const sortDir  = order === 'asc' ? 1 : -1;
    const total    = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email role')
      .sort({ [sort]: sortDir })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: jobs,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

// ─── GET /api/jobs/:id/applicants — Admin: see who applied ───
router.get('/:id/applicants', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('appliedBy', 'name email profilePic role department batch graduationYear');
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ success: true, data: job.appliedBy, total: job.appliedBy.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applicants.' });
  }
});

// ─── PUT /api/jobs/:id — Admin: edit a job ───────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['title', 'company', 'location', 'type', 'experience', 'salary', 'description', 'skills', 'status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.skills && !Array.isArray(updates.skills)) {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const job = await Job.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ success: true, data: job, message: 'Job updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job.' });
  }
});

// ─── POST /api/jobs — Create job (moderated by role) ────────
router.post('/', protect, async (req, res) => {
  try {
    const { title, company, location, type, experience, salary, description, skills } = req.body;
    if (!title || !company) {
      return res.status(400).json({ message: 'Job title and company are required.' });
    }

    const isAdmin = req.user.role === 'admin';
    const jobStatus = isAdmin ? 'Approved' : 'Pending';

    const job = await Job.create({
      title, company, location, type, experience, salary, description,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
      postedBy: req.user._id,
      postedByName: req.user.name,
      postedByRole: req.user.role,
      status: jobStatus
    });

    const obj = job.toJSON();
    obj.applied = false;
    obj.id = obj._id;

    if (isAdmin) {
      // Auto-notify all students and alumni
      try {
        const recipients = await User.find({ role: { $in: ['student', 'alumni'] } }).select('_id');
        const notifDocs = recipients.map(u => ({
          userId: u._id,
          type: 'job_alert',
          title: `New Job: ${job.title} at ${job.company}`,
          description: `${job.location || ''} • ${job.type || ''} • Posted by ${req.user.name}`,
          icon: '💼',
          relatedId: job._id
        }));
        const created = await Notification.insertMany(notifDocs);

        // Real-time socket push to each recipient
        const io = req.app.get('io');
        if (io) {
          created.forEach((notif, i) => {
            io.to(recipients[i]._id.toString()).emit('notification_received', notif);
          });
        }
      } catch (_) {}
    } else {
      // Notify all admins to review the alumni's job — with real-time socket push
      try {
        const io = req.app.get('io');
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifDocs = admins.map(a => ({
          userId: a._id,
          type: 'admin_approval_needed',
          title: `New Job Needs Approval: ${job.title}`,
          description: `Posted by ${req.user.name} (${req.user.role}) at ${job.company} • Pending review`,
          icon: '⏳',
          relatedId: job._id
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
      message: isAdmin ? 'Job posted successfully.' : 'Job submitted for admin review. It will go live once approved.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job.' });
  }
});

// ─── PUT /api/jobs/:id/approve — Admin approves a job ───────
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved' },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    // Notify students and alumni
    try {
      const recipients = await User.find({ role: { $in: ['student', 'alumni'] } }).select('_id');
      const notifDocs = recipients.map(u => ({
        userId: u._id,
        type: 'job_alert',
        title: `New Job: ${job.title} at ${job.company}`,
        description: `${job.location || ''} • ${job.type || ''}`,
        icon: '💼',
        relatedId: job._id
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

    // Notify the job poster their submission was approved
    if (job.postedBy) {
      await createNotification(req.app.get('io'), {
        userId: job.postedBy,
        type: 'job_alert',
        title: `✅ Your job "${job.title}" was approved`,
        description: `Your listing at ${job.company} is now live for students and alumni.`,
        icon: '💼',
        relatedId: job._id,
      });
    }

    res.json({ success: true, message: 'Job approved and published.', data: job });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve job.' });
  }
});

// ─── PUT /api/jobs/:id/reject — Admin rejects a job ────────
router.put('/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    // Notify the poster their job was rejected
    if (job.postedBy) {
      await createNotification(req.app.get('io'), {
        userId: job.postedBy,
        type: 'system',
        title: `❌ Your job "${job.title}" was not approved`,
        description: 'Your submission did not meet our guidelines. Please review and resubmit.',
        icon: '🚫',
        relatedId: job._id,
      });
    }

    res.json({ success: true, message: 'Job rejected and removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject job.' });
  }
});

// ─── PUT /api/jobs/:id/apply — Apply for a job ───────────────
router.put('/:id/apply', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const userId = req.user._id;
    const alreadyApplied = job.appliedBy.some(id => id.toString() === userId.toString());

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    job.appliedBy.push(userId);
    await job.save();

    const obj = job.toJSON();
    obj.applied = true;
    obj.id = obj._id;
    res.json({ success: true, data: obj });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

// ─── DELETE /api/jobs/:id — Delete job (admin only) ──────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json({ success: true, message: 'Job deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job.' });
  }
});

module.exports = router;
