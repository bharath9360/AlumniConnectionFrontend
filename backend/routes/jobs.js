const express = require('express');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/jobs — All approved jobs, newest first ───────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Approved' }).sort({ createdAt: -1 });
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
      // Notify all admins to review the alumni's job
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const notifDocs = admins.map(a => ({
          userId: a._id,
          type: 'admin_approval_needed',
          title: `Alumni Job Needs Approval: ${job.title}`,
          description: `Posted by ${req.user.name} at ${job.company} • Pending review`,
          icon: '⏳',
          relatedId: job._id
        }));
        await Notification.insertMany(notifDocs);
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
