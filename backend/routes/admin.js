const express  = require('express');
const multer   = require('multer');
const XLSX     = require('xlsx');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { sendApprovalEmail, sendBroadcastEmail } = require('../services/emailService');
const { runGraduationJob, promoteStudentToAlumni } = require('../jobs/graduationJob');
const { createNotification } = require('../utils/notifyHelper');
const { deleteCloudinaryImage } = require('../utils/cloudinaryCleanup');

const router = express.Router();

// ── multer (memory storage for xlsx/csv parsing) ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx, .xls or .csv files are allowed.'), ok);
  },
});

// ════════════════════════════════════════════════════════════════
//  STUDENT CRUD
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/students ──────────────────────────────────
router.get('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      search = '',
      department = '',
      batch = '',
      graduationYear = '',
      page  = 1,
      limit = 10,
      sort  = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = { role: 'student' };

    if (search.trim()) {
      query.$or = [
        { name:  { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (department)    query.department    = department;
    if (batch)         query.batch         = batch;
    if (graduationYear) query.graduationYear = graduationYear;

    const skip    = (Number(page) - 1) * Number(limit);
    const sortDir = order === 'asc' ? 1 : -1;

    const [students, total] = await Promise.all([
      User.find(query)
        .select('-password -secretKey -otp -otpExpiry -connections')
        .sort({ [sort]: sortDir })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    const [departments, batches, gradYears] = await Promise.all([
      User.distinct('department',    { role: 'student', department:    { $exists: true, $ne: '' } }),
      User.distinct('batch',         { role: 'student', batch:         { $exists: true, $ne: '' } }),
      User.distinct('graduationYear',{ role: 'student', graduationYear:{ $exists: true, $ne: '' } }),
    ]);

    res.json({
      success: true,
      data: students,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      filters: {
        departments:    departments.sort(),
        batches:        batches.sort(),
        graduationYears:gradYears.sort(),
      },
    });
  } catch (err) {
    console.error('[GET /students]', err);
    res.status(500).json({ message: 'Failed to fetch students.' });
  }
});

// ─── POST /api/admin/students ─────────────────────────────────
// Add a single student (auto-generates password = roll number or email prefix)
router.post('/students', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      name, email, phone, department, batch,
      graduationYear, rollNumber, gender,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'A user with this email already exists.' });

    const rawPass  = rollNumber || email.split('@')[0];
    const hashed   = await bcrypt.hash(rawPass, 12);

    const student = await User.create({
      name, email: email.toLowerCase().trim(),
      password: hashed, phone, department,
      batch, graduationYear, rollNumber, gender,
      role: 'student', status: 'Active',
    });

    res.status(201).json({
      success: true,
      data: { ...student.toObject(), password: undefined },
      message: `Student ${name} added. Default password: "${rawPass}"`,
    });
  } catch (err) {
    console.error('[POST /students]', err);
    res.status(500).json({ message: err.message || 'Failed to add student.' });
  }
});

// ─── PUT /api/admin/students/:id ─────────────────────────────
router.put('/students/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = [
      'name','email','phone','department','batch',
      'graduationYear','rollNumber','gender','city','status',
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -secretKey -otp -otpExpiry');

    if (!user) return res.status(404).json({ message: 'Student not found.' });
    res.json({ success: true, data: user, message: 'Student updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update student.' });
  }
});

// ─── DELETE /api/admin/students/:id ──────────────────────────
router.delete('/students/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!user) return res.status(404).json({ message: 'Student not found.' });
    res.json({ success: true, message: `${user.name}'s account deleted.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student.' });
  }
});

// ─── PUT /api/admin/students/:id/promote ─────────────────────────────────
router.put('/students/:id/promote', protect, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    // Use the shared helper — sets role, status, batch, notification, email
    await promoteStudentToAlumni(student);

    res.json({ success: true, message: `${student.name} has been promoted to Alumni!`, data: { role: 'alumni', batch: student.batch } });
  } catch (err) {
    console.error('[PUT /students/:id/promote]', err);
    res.status(500).json({ message: 'Failed to promote student.' });
  }
});

// ─── POST /api/admin/students/bulk-import ────────────────────
// Accept .xlsx / .xls / .csv, parse rows, create students in bulk
router.post('/students/bulk-import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    // Parse workbook
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ message: 'File is empty or unreadable.' });

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      const name  = (row['Name'] || row['name'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
      const dept  = (row['Department'] || row['department'] || '').toString().trim();
      const batch = (row['Batch'] || row['batch'] || row['Join Year'] || '').toString().trim();
      const gradY = (row['Graduation Year'] || row['graduationYear'] || row['Expected Graduation'] || '').toString().trim();
      const roll  = (row['Roll Number'] || row['rollNumber'] || row['Roll'] || '').toString().trim();
      const phone = (row['Phone'] || row['phone'] || '').toString().trim();
      const gen   = (row['Gender'] || row['gender'] || '').toString().trim();

      if (!name || !email) {
        results.errors.push({ row: name || email || '?', reason: 'Missing name or email' });
        continue;
      }

      const exists = await User.findOne({ email });
      if (exists) {
        results.skipped++;
        continue;
      }

      try {
        const rawPass = roll || email.split('@')[0];
        const hashed  = await bcrypt.hash(rawPass, 10);
        await User.create({
          name, email, password: hashed, phone,
          department: dept, batch, graduationYear: gradY,
          rollNumber: roll, gender: gen,
          role: 'student', status: 'Active',
        });
        results.created++;
      } catch (e) {
        results.errors.push({ row: email, reason: e.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped (duplicates), ${results.errors.length} errors.`,
      results,
    });
  } catch (err) {
    console.error('[POST /students/bulk-import]', err);
    res.status(500).json({ message: err.message || 'Bulk import failed.' });
  }
});

// ─── POST /api/admin/alumni/bulk-import ──────────────────────
router.post('/alumni/bulk-import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ message: 'File is empty or unreadable.' });

    const results = { created: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      const name  = (row['Name'] || row['name'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
      const dept  = (row['Department'] || row['department'] || '').toString().trim();
      const batch = (row['Batch'] || row['batch'] || row['Pass Out Year'] || row['Year'] || row['year'] || '').toString().trim();
      const comp  = (row['Company'] || row['company'] || '').toString().trim();
      const desig = (row['Designation'] || row['designation'] || '').toString().trim();
      const phone = (row['Phone'] || row['phone'] || '').toString().trim();
      const gen   = (row['Gender'] || row['gender'] || '').toString().trim();

      if (!name || !email) {
        results.errors.push({ row: name || email || '?', reason: 'Missing name or email' });
        continue;
      }

      const exists = await User.findOne({ email });
      if (exists) { results.skipped++; continue; }

      try {
        const rawPass = email.split('@')[0];
        const hashed  = await bcrypt.hash(rawPass, 10);
        const alumni  = await User.create({
          name, email, password: hashed, phone, gender: gen,
          department: dept, batch, company: comp, designation: desig,
          role: 'alumni', status: 'Pending',
        });
        // Notify admin-side (no user notification needed at import)
        results.created++;
      } catch (e) {
        results.errors.push({ row: email, reason: e.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped (duplicates), ${results.errors.length} errors.`,
      results,
    });
  } catch (err) {
    console.error('[POST /alumni/bulk-import]', err);
    res.status(500).json({ message: err.message || 'Bulk import failed.' });
  }
});

// ─── POST /api/admin/import ───────────────────────────────────
// Unified import endpoint — role determined by ?type=student|alumni
// Supports dry-run mode: ?preview=true → validates & returns rows without writing to DB
router.post('/import', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { type = 'student', preview = 'false' } = req.query;
    const isDryRun = preview === 'true';

    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    if (!['student','alumni'].includes(type)) {
      return res.status(400).json({ message: 'type must be "student" or "alumni".' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const raw      = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!raw.length) return res.status(400).json({ message: 'File is empty or has no rows.' });

    // ── Normalise each row ──────────────────────────────────
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const normalised = raw.map((row, idx) => {
      const name  = (row['Name']  || row['name']  || '').toString().trim();
      const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
      const dept  = (row['Department'] || row['department'] || '').toString().trim();
      const year  = (
        row['Year'] || row['year'] ||
        (type === 'student'
          ? (row['Batch'] || row['batch'] || row['Join Year'] || '')
          : (row['Batch'] || row['batch'] || row['Pass Out Year'] || ''))
      ).toString().trim();
      const gradY = (row['Graduation Year'] || row['graduationYear'] || row['Expected Graduation'] || '').toString().trim();
      const roll  = (row['Roll Number'] || row['rollNumber'] || row['Roll'] || '').toString().trim();
      const comp  = (row['Company'] || row['company'] || '').toString().trim();
      const desig = (row['Designation'] || row['designation'] || '').toString().trim();
      const phone = (row['Phone'] || row['phone'] || '').toString().trim();
      const gen   = (row['Gender'] || row['gender'] || '').toString().trim();

      // ── per-row validation ──────────────────────────────
      const errors = [];
      if (!name)               errors.push('Name is required');
      if (!email)              errors.push('Email is required');
      else if (!EMAIL_RE.test(email)) errors.push('Invalid email format');

      return {
        _row: idx + 2, // spreadsheet row number (1-indexed header + 1)
        name, email, department: dept, year, graduationYear: gradY,
        rollNumber: roll, company: comp, designation: desig,
        phone, gender: gen,
        _valid: errors.length === 0,
        _errors: errors,
      };
    });

    // ── If preview mode → return normalised data only ────
    if (isDryRun) {
      return res.json({
        success: true,
        rows: normalised,
        totalRows: normalised.length,
        validRows: normalised.filter(r => r._valid).length,
        invalidRows: normalised.filter(r => !r._valid).length,
      });
    }

    // ── Full import ────────────────────────────────────────
    const results = { created: 0, skipped: 0, errors: [] };

    for (const r of normalised) {
      if (!r._valid) {
        results.errors.push({ row: r.email || `Row ${r._row}`, reason: r._errors.join('; ') });
        continue;
      }

      const exists = await User.findOne({ email: r.email });
      if (exists) { results.skipped++; continue; }

      try {
        const rawPass = type === 'student'
          ? (r.rollNumber || r.email.split('@')[0])
          : r.email.split('@')[0];
        const hashed = await bcrypt.hash(rawPass, 10);

        await User.create({
          name: r.name, email: r.email, password: hashed,
          phone: r.phone, gender: r.gender, department: r.department,
          batch: r.year,
          ...(type === 'student'
            ? { graduationYear: r.graduationYear, rollNumber: r.rollNumber, role: 'student', status: 'Active' }
            : { company: r.company, designation: r.designation, role: 'alumni', status: 'Pending' }),
        });
        results.created++;
      } catch (e) {
        results.errors.push({ row: r.email, reason: e.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors.`,
      results,
    });
  } catch (err) {
    console.error('[POST /import]', err);
    res.status(500).json({ message: err.message || 'Import failed.' });
  }
});

// ─── GET /api/admin/alumni ────────────────────────────────────
// Full list with search, filter by dept/batch/status, pagination
router.get('/alumni', protect, authorize('admin'), async (req, res) => {

  try {
    const {
      search = '',
      department = '',
      batch = '',
      status = '',
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = { role: 'alumni' };

    // Search by name or email
    if (search.trim()) {
      query.$or = [
        { name:  { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (batch)      query.batch      = batch;
    if (status)     query.status     = status;

    const skip     = (Number(page) - 1) * Number(limit);
    const sortDir  = order === 'asc' ? 1 : -1;
    const sortObj  = { [sort]: sortDir };

    const [alumni, total] = await Promise.all([
      User.find(query)
        .select('-password -secretKey -otp -otpExpiry -connections')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    // Also return distinct dept + batch lists for filter dropdowns
    const [departments, batches] = await Promise.all([
      User.distinct('department', { role: 'alumni', department: { $exists: true, $ne: '' } }),
      User.distinct('batch',      { role: 'alumni', batch:       { $exists: true, $ne: '' } }),
    ]);

    res.json({
      success: true,
      data: alumni,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      filters: {
        departments: departments.sort(),
        batches:     batches.sort(),
      },
    });
  } catch (err) {
    console.error('[GET /alumni]', err);
    res.status(500).json({ message: 'Failed to fetch alumni.' });
  }
});

// ─── PUT /api/admin/alumni/:id ────────────────────────────────
// Edit an alumni's name, email, department, batch, company, designation, status
router.put('/alumni/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'department', 'batch', 'company',
                     'designation', 'presentStatus', 'city', 'state', 'status'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -secretKey -otp -otpExpiry');

    if (!user) return res.status(404).json({ message: 'Alumni not found.' });
    res.json({ success: true, data: user, message: 'Alumni updated.' });
  } catch (err) {
    console.error('[PUT /alumni/:id]', err);
    res.status(500).json({ message: 'Failed to update alumni.' });
  }
});

// ─── DELETE /api/admin/alumni/:id ────────────────────────────
// Permanently delete an alumni account
router.delete('/alumni/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.id, role: 'alumni' });
    if (!user) return res.status(404).json({ message: 'Alumni not found.' });
    res.json({ success: true, message: `${user.name}'s account has been deleted.` });
  } catch (err) {
    console.error('[DELETE /alumni/:id]', err);
    res.status(500).json({ message: 'Failed to delete alumni.' });
  }
});

// ─── PUT /api/admin/reject-alumni/:userId ────────────────────
// Set status to Pending (un-approve) — leaves the record intact
router.put('/reject-alumni/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { status: 'Pending' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, message: `${user.name}'s account has been set to Pending.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

// ─── GET /api/admin/pending-alumni ───────────────────────────
router.get('/pending-alumni', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingAlumni = await User.find({ role: 'alumni', status: 'Pending' })
      .select('-password -secretKey -otp -otpExpiry')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: pendingAlumni });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending alumni.' });
  }
});

// ─── PUT /api/admin/activate/:userId ─────────────────────────
router.put('/activate/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.status === 'Active') return res.status(400).json({ message: 'Account already active.' });

    user.status = 'Active';
    await user.save();

    // Notify the alumni their account was approved — with real-time socket push
    const notif = await Notification.create({
      userId: user._id,
      type: 'account_activated',
      title: '🎉 Your account has been approved!',
      description: 'Welcome to MAMCET Alumni Connect! You can now log in and explore.',
      icon: '🎉',
    });
    const io = req.app.get('io');
    if (io) io.to(user._id.toString()).emit('notification_received', notif.toObject());

    // Send approval email
    try { await sendApprovalEmail(user.email, user.name); } catch (_) {}

    res.json({ success: true, message: `${user.name} has been activated.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to activate user.' });
  }
});

// ─── DELETE /api/admin/reject/:userId ────────────────────────
router.delete('/reject/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Notify before deleting (so we still have the userId)
    await createNotification(req.app.get('io'), {
      userId: user._id,
      type: 'system',
      title: '❌ Your account application was not approved',
      description: 'Unfortunately your alumni registration did not meet our requirements. Contact the admin for details.',
      icon: '🚫',
    });

    await User.findByIdAndDelete(req.params.userId);
    res.json({ success: true, message: `${user.name}'s application has been rejected and removed.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject user.' });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const Job = require('../models/Job');
    const Event = require('../models/Event');
    const [totalUsers, pendingAlumni, pendingJobs, pendingEvents, totalPosts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'alumni', status: 'Pending' }),
      Job.countDocuments({ status: 'Pending' }),
      Event.countDocuments({ status: 'Pending' }),
      require('../models/Post').countDocuments()
    ]);
    res.json({ success: true, data: { totalUsers, pendingAlumni, pendingJobs, pendingEvents, totalPosts } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
});

// ─── GET /api/admin/pending-events ───────────────────────────
// (Alias — mirrors GET /api/events/pending for admin convenience)
router.get('/pending-events', protect, authorize('admin'), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const events = await Event.find({ status: 'Pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending events.' });
  }
});

// ─── PUT /api/admin/approve-event/:id ────────────────────────
// Alias for PUT /api/events/:id/approve — keeps Admin route prefix consistent
router.put('/approve-event/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Event = require('../models/Event');
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

// ─── PUT /api/admin/reject-event/:id ─────────────────────────
router.put('/reject-event/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Event = require('../models/Event');
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ success: true, message: 'Event rejected and removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject event.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  POST MODERATION
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/posts ─────────────────────────────────────
// Returns all posts (with author details) for admin moderation panel.
// Filters: filter=all|reported|hidden|recent, search, page, limit
router.get('/posts', protect, authorize('admin'), async (req, res) => {
  try {
    const Post = require('../models/Post');
    const {
      filter = 'all',
      search = '',
      page   = 1,
      limit  = 15,
    } = req.query;

    const query = {};

    if (filter === 'reported') query.reportCount = { $gt: 0 };
    else if (filter === 'hidden')   query.isHidden = true;
    else if (filter === 'recent')   {} // just sort createdAt desc — already default

    if (search.trim()) {
      query.$or = [
        { userName:    { $regex: search.trim(), $options: 'i' } },
        { content:     { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email profilePic role status department')
      .populate('reportedBy', 'name email');

    const reportedCount = await Post.countDocuments({ reportCount: { $gt: 0 } });
    const hiddenCount   = await Post.countDocuments({ isHidden: true });

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
      stats: { total, reportedCount, hiddenCount },
    });
  } catch (err) {
    console.error('[GET /admin/posts]', err);
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// ─── DELETE /api/admin/posts/:id ─────────────────────────────
// Hard-delete a post (admin override — bypasses author check)
router.delete('/posts/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    // Clean up Cloudinary image (fire-and-forget)
    if (post.media) {
      deleteCloudinaryImage(post.media).catch(() => {});
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post permanently deleted.' });
  } catch (err) {
    console.error('[DELETE /admin/posts/:id]', err);
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

// ─── PUT /api/admin/posts/:id/hide ───────────────────────────
// Toggle hidden status of a post (soft moderation)
router.put('/posts/:id/hide', protect, authorize('admin'), async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    post.isHidden = !post.isHidden;
    await post.save();

    res.json({
      success: true,
      message: post.isHidden ? 'Post hidden from feed.' : 'Post restored to feed.',
      data: { isHidden: post.isHidden },
    });
  } catch (err) {
    console.error('[PUT /admin/posts/:id/hide]', err);
    res.status(500).json({ message: 'Failed to update post visibility.' });
  }
});

// ─── PUT /api/admin/posts/:id/dismiss-reports ────────────────
// Clear all reports on a post (admin reviewed & dismissed)
router.put('/posts/:id/dismiss-reports', protect, authorize('admin'), async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: { reportedBy: [], reportCount: 0 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ success: true, message: 'Reports dismissed.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to dismiss reports.' });
  }
});

// ─── PUT /api/admin/ban-user/:userId ─────────────────────────
// Ban a user: set status → 'Inactive' (they cannot log in)
router.put('/ban-user/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin account.' });
    }

    const isBanned = user.status === 'Inactive';
    user.status = isBanned ? 'Active' : 'Inactive';
    await user.save();

    // Notify user
    await Notification.create({
      userId      : user._id,
      type        : 'account_update',
      title       : isBanned ? '✅ Your account has been reinstated.' : '🚫 Your account has been suspended.',
      description : isBanned
        ? 'An admin has restored your account. You can log in again.'
        : 'Your account has been suspended by an admin due to a policy violation.',
      icon: isBanned ? '✅' : '🚫',
    });

    res.json({
      success: true,
      message: isBanned ? `${user.name} reinstated.` : `${user.name} banned.`,
      data: { status: user.status },
    });
  } catch (err) {
    console.error('[PUT /admin/ban-user]', err);
    res.status(500).json({ message: 'Failed to update user status.' });
  }
});

// ─── POST /api/admin/graduation/run ─────────────────────────
// Manual trigger: promotes all eligible students (graduationYear < current year)
router.post('/graduation/run', protect, authorize('admin'), async (req, res) => {
  try {
    console.log(`[Admin] Manual graduation triggered by ${req.user?.email}`);
    const result = await runGraduationJob();

    const message = result.promoted > 0
      ? `🎓 ${result.promoted} student(s) promoted to Alumni!`
      : 'No students eligible for graduation at this time.';

    res.json({
      success : true,
      message,
      data    : result,
    });
  } catch (err) {
    console.error('[POST /graduation/run]', err);
    res.status(500).json({ message: 'Graduation job failed.' });
  }
});

// ════════════════════════════════════════════════════════════
//  NOTIFICATION BROADCAST
// ════════════════════════════════════════════════════════════

/**
 * POST /api/admin/broadcast
 *
 * Body:
 *   {
 *     audience : 'all' | 'students' | 'alumni' | 'batch',
 *     batch    : '2022'          // required when audience === 'batch'
 *     title    : string          // required
 *     message  : string          // required
 *     icon     : string          // optional emoji, default '📢'
 *     sendEmail: boolean         // optional, default false
 *   }
 */
router.post('/broadcast', protect, authorize('admin'), async (req, res) => {
  try {
    const { audience = 'all', batch, title, message, icon = '📢', sendEmail = false } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }

    // ── Build recipient query ──────────────────────────────
    const query = {};
    switch (audience) {
      case 'students': query.role = 'student';                      break;
      case 'alumni':   query.role = 'alumni';                       break;
      case 'batch':    query.role = 'alumni'; query.batch = batch;  break;
      default:         query.role = { $in: ['student', 'alumni'] }; break; // 'all'
    }

    const recipients = await User.find(query).select('_id name email');

    if (recipients.length === 0) {
      return res.json({ success: true, message: 'No recipients matched the selected audience.', data: { sent: 0 } });
    }

    // ── Create in-app notifications (bulk) ──────────────────
    const notifDocs = recipients.map(u => ({
      userId     : u._id,
      type       : 'broadcast',
      title      : title.trim(),
      description: message.trim(),
      icon,
    }));

    const created = await Notification.insertMany(notifDocs);

    // ── Real-time socket push ────────────────────────
    const io = req.app.get('io');
    if (io) {
      created.forEach((notif, i) => {
        io.to(recipients[i]._id.toString()).emit('notification_received', notif);
      });
    }

    // ── Optional email blast ─────────────────────────
    let emailResult = { sent: 0, skipped: 0, failed: 0 };
    if (sendEmail) {
      try {
        emailResult = await sendBroadcastEmail(
          recipients.map(u => ({ email: u.email, name: u.name })),
          title.trim(),
          title.trim(),
          message.trim()
        );
      } catch (emailErr) {
        console.error('[Broadcast] Email send error:', emailErr.message);
      }
    }

    const audienceLabel = {
      all:      'All users',
      students: 'All students',
      alumni:   'All alumni',
      batch:    `Batch ${batch}`,
    }[audience] || audience;

    console.log(`[Broadcast] "${title}" → ${recipients.length} recipients (${audienceLabel}) | email: ${JSON.stringify(emailResult)}`);

    res.json({
      success: true,
      message: `📢 Broadcast sent to ${recipients.length} ${audienceLabel} recipient${recipients.length !== 1 ? 's' : ''}.`,
      data: {
        sent         : recipients.length,
        audienceLabel,
        emailResult,
      },
    });
  } catch (err) {
    console.error('[POST /admin/broadcast]', err);
    res.status(500).json({ message: 'Broadcast failed. Please try again.' });
  }
});

// ─── GET /api/admin/batches ──────────────────────────────
// Returns distinct batch years for the batch-specific audience dropdown
router.get('/batches', protect, authorize('admin'), async (req, res) => {
  try {
    const batches = await User.distinct('batch', {
      role: 'alumni',
      batch: { $exists: true, $ne: '', $ne: null},
    });
    const sorted = batches.filter(Boolean).sort((a, b) => Number(b) - Number(a));
    res.json({ success: true, data: sorted });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch batches.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  ROLE MANAGEMENT
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/users/roles — list all users with roles ──
router.get('/users/roles', protect, authorize('admin'), async (req, res) => {
  try {
    const { search = '', role = '', page = 1, limit = 10 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search.trim()) {
      query.$or = [
        { name:  { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('name email role status department batch profilePic createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// ─── PUT /api/admin/users/:id/role — change a user's role ────
router.put('/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'alumni', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student, alumni, or admin.' });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found.' });

    // Prevent self-demotion
    if (target._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot change your own admin role.' });
    }

    const oldRole = target.role;
    target.role = role;
    await target.save();

    // Notify the user
    await Notification.create({
      userId     : target._id,
      type       : 'role_changed',
      title      : `Your account role has been updated to ${role}.`,
      description: `An admin changed your role from ${oldRole} → ${role}.`,
      icon       : '🔄',
    });

    res.json({ success: true, message: `${target.name}'s role updated to ${role}.`, data: { role } });
  } catch (err) {
    console.error('[PUT /admin/users/:id/role]', err);
    res.status(500).json({ message: 'Failed to update role.' });
  }
});

// ════════════════════════════════════════════════════════════════
//  SYSTEM CONFIG
// ════════════════════════════════════════════════════════════════
// Simple in-process store (persists while server is up).
// For production, store in a DB collection or .env overrides.
const _sysConfig = {
  siteName          : 'MAMCET Alumni Connect',
  allowAlumniJobs   : true,
  allowAlumniEvents : true,
  requireApproval   : true,
  maintenanceMode   : false,
  notifEmailEnabled : false,
  maxUploadSizeMB   : 5,
};

// ─── GET /api/admin/system-config ────────────────────────────
router.get('/system-config', protect, authorize('admin'), (req, res) => {
  res.json({ success: true, data: { ..._sysConfig } });
});

// ─── PUT /api/admin/system-config ────────────────────────────
router.put('/system-config', protect, authorize('admin'), (req, res) => {
  const allowed = Object.keys(_sysConfig);
  Object.entries(req.body).forEach(([k, v]) => {
    if (allowed.includes(k)) _sysConfig[k] = v;
  });
  console.log('[System Config] Updated:', _sysConfig);
  res.json({ success: true, message: 'System configuration saved.', data: { ..._sysConfig } });
});

module.exports = router;

