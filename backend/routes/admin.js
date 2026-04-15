const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const {
  protect,
  authorize
} = require('../middleware/auth');
const {
  sendApprovalEmail,
  sendBroadcastEmail,
  sendCredentialsEmail
} = require('../services/emailService');
const ImportLog = require('../models/ImportLog');
const {
  runGraduationJob,
  promoteStudentToAlumni
} = require('../jobs/graduationJob');
const {
  createNotification
} = require('../utils/notifyHelper');
const {
  deleteCloudinaryImage
} = require('../utils/cloudinaryCleanup');
const asyncHandler = require("../middleware/asyncHandler");
const router = express.Router();

// ── multer (memory storage for xlsx/csv parsing) ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx, .xls or .csv files are allowed.'), ok);
  }
});

// ════════════════════════════════════════════════════════════════
//  STUDENT CRUD
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/students ──────────────────────────────────
router.get('/students', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    search = '',
    department = '',
    batch = '',
    graduationYear = '',
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  const query = {
    role: 'student'
  };
  if (search.trim()) {
    query.$or = [{
      name: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      email: {
        $regex: search.trim(),
        $options: 'i'
      }
    }];
  }
  if (department) query.department = department;
  if (batch) query.batch = batch;
  if (graduationYear) query.graduationYear = graduationYear;
  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === 'asc' ? 1 : -1;
  const [students, total] = await Promise.all([User.find(query).select('-password -secretKey -otp -otpExpiry -connections').sort({
    [sort]: sortDir
  }).skip(skip).limit(Number(limit)), User.countDocuments(query)]);
  const [departments, batches, gradYears] = await Promise.all([User.distinct('department', {
    role: 'student',
    department: {
      $exists: true,
      $ne: ''
    }
  }), User.distinct('batch', {
    role: 'student',
    batch: {
      $exists: true,
      $ne: ''
    }
  }), User.distinct('graduationYear', {
    role: 'student',
    graduationYear: {
      $exists: true,
      $ne: ''
    }
  })]);
  res.json({
    success: true,
    data: students,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    },
    filters: {
      departments: departments.sort(),
      batches: batches.sort(),
      graduationYears: gradYears.sort()
    }
  });
}));

// ─── POST /api/admin/students ─────────────────────────────────
// Add a single student (auto-generates password = roll number or email prefix)
router.post('/students', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    department,
    batch,
    graduationYear,
    rollNumber,
    gender
  } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      message: 'Name and email are required.'
    });
  }
  const exists = await User.findOne({
    email: email.toLowerCase().trim()
  });
  if (exists) return res.status(409).json({
    message: 'A user with this email already exists.'
  });
  const rawPass = rollNumber || email.split('@')[0];
  const hashed = await bcrypt.hash(rawPass, 12);
  const student = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashed,
    phone,
    department,
    batch,
    graduationYear,
    rollNumber,
    gender,
    role: 'student',
    status: 'Active'
  });
  res.status(201).json({
    success: true,
    data: {
      ...student.toObject(),
      password: undefined
    },
    message: `Student ${name} added. Default password: "${rawPass}"`
  });
}));

// ─── PUT /api/admin/students/:id ─────────────────────────────
router.put('/students/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'email', 'phone', 'department', 'batch', 'graduationYear', 'rollNumber', 'gender', 'city', 'status'];
  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const user = await User.findByIdAndUpdate(req.params.id, {
    $set: updates
  }, {
    new: true,
    runValidators: true
  }).select('-password -secretKey -otp -otpExpiry');
  if (!user) return res.status(404).json({
    message: 'Student not found.'
  });
  res.json({
    success: true,
    data: user,
    message: 'Student updated.'
  });
}));

// ─── DELETE /api/admin/students/:id ──────────────────────────
router.delete('/students/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndDelete({
    _id: req.params.id,
    role: 'student'
  });
  if (!user) return res.status(404).json({
    message: 'Student not found.'
  });
  res.json({
    success: true,
    message: `${user.name}'s account deleted.`
  });
}));

// ─── PUT /api/admin/students/:id/promote ─────────────────────────────────
router.put('/students/:id/promote', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: 'student'
  });
  if (!student) return res.status(404).json({
    message: 'Student not found.'
  });

  // Use the shared helper — sets role, status, batch, notification, email
  await promoteStudentToAlumni(student);
  res.json({
    success: true,
    message: `${student.name} has been promoted to Alumni!`,
    data: {
      role: 'alumni',
      batch: student.batch
    }
  });
}));

// ─── POST /api/admin/students/bulk-import ────────────────────
// Accept .xlsx / .xls / .csv, parse rows, create students in bulk
router.post('/students/bulk-import', protect, authorize('admin'), upload.single('file'), asyncHandler(async (req, res, next) => {
  if (!req.file) return res.status(400).json({
    message: 'No file uploaded.'
  });

  // Parse workbook
  const workbook = XLSX.read(req.file.buffer, {
    type: 'buffer'
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: ''
  });
  if (!rows.length) return res.status(400).json({
    message: 'File is empty or unreadable.'
  });
  const results = {
    created: 0,
    skipped: 0,
    errors: []
  };
  const createdInBatch = []; // track created users to send emails
  for (const row of rows) {
    const name = (row['Name'] || row['name'] || '').toString().trim();
    const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
    const dept = (row['Department'] || row['department'] || '').toString().trim();
    const batch = (row['Batch'] || row['batch'] || row['Join Year'] || '').toString().trim();
    const gradY = (row['Graduation Year'] || row['graduationYear'] || row['Expected Graduation'] || '').toString().trim();
    const roll = (row['Roll Number'] || row['rollNumber'] || row['Roll'] || '').toString().trim();
    const phone = (row['Phone'] || row['phone'] || '').toString().trim();
    const gen = (row['Gender'] || row['gender'] || '').toString().trim();
    if (!name || !email) {
      results.errors.push({
        row: name || email || '?',
        reason: 'Missing name or email'
      });
      continue;
    }
    const exists = await User.findOne({
      email
    });
    if (exists) {
      results.skipped++;
      continue;
    }
    try {
      const rawPass = roll || email.split('@')[0];
      const hashed = await bcrypt.hash(rawPass, 10);
      await User.create({
        name,
        email,
        password: hashed,
        tempPassword: rawPass,   // store temp password for activation flow
        phone,
        department: dept,
        batch,
        graduationYear: gradY,
        rollNumber: roll,
        gender: gen,
        role: 'student',
        status: 'Pending',
        needsPasswordChange: true,
      });
      results.created++;
      createdInBatch.push({ name, email, rawPass, role: 'student' });
    } catch (e) {
      results.errors.push({ row: email, reason: e.message });
    }
  }

  // Send ONE credentials email per new user
  const emailStats = { sent: 0, failed: 0 };
  for (const u of createdInBatch) {
    try {
      await sendCredentialsEmail(u.email, u.name, u.rawPass, u.role);
      emailStats.sent++;
    } catch (emailErr) {
      console.error(`[BulkImport] Email failed for ${u.email}:`, emailErr.message);
      emailStats.failed++;
    }
  }
  res.json({
    success: true,
    message: `Import complete: ${results.created} created, ${results.skipped} skipped (duplicates), ${results.errors.length} errors. ${emailStats.sent} credential email${emailStats.sent !== 1 ? 's' : ''} sent.`,
    results,
    emailStats
  });
}));

// ─── POST /api/admin/alumni/bulk-import ──────────────────────
router.post('/alumni/bulk-import', protect, authorize('admin'), upload.single('file'), asyncHandler(async (req, res, next) => {
  if (!req.file) return res.status(400).json({
    message: 'No file uploaded.'
  });
  const workbook = XLSX.read(req.file.buffer, {
    type: 'buffer'
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: ''
  });
  if (!rows.length) return res.status(400).json({
    message: 'File is empty or unreadable.'
  });
  const results = {
    created: 0,
    skipped: 0,
    errors: []
  };
  const createdInBatch = []; // track created users to send emails
  for (const row of rows) {
    const name  = (row['Name']  || row['name']  || '').toString().trim();
    const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
    const dept  = (row['Department'] || row['department'] || '').toString().trim();
    const batch = (row['Batch'] || row['batch'] || row['Pass Out Year'] || row['Year'] || row['year'] || '').toString().trim();
    const comp = (row['Company'] || row['company'] || '').toString().trim();
    const desig = (row['Designation'] || row['designation'] || '').toString().trim();
    const phone = (row['Phone'] || row['phone'] || '').toString().trim();
    const gen = (row['Gender'] || row['gender'] || '').toString().trim();
    if (!name || !email) {
      results.errors.push({
        row: name || email || '?',
        reason: 'Missing name or email'
      });
      continue;
    }
    const exists = await User.findOne({
      email
    });
    if (exists) {
      results.skipped++;
      continue;
    }
    try {
      const rawPass = email.split('@')[0];
      const hashed = await bcrypt.hash(rawPass, 10);
      await User.create({
        name,
        email,
        password: hashed,
        tempPassword: rawPass,   // store temp password for activation flow
        phone,
        gender: gen,
        department: dept,
        batch,
        company: comp,
        designation: desig,
        role: 'alumni',
        status: 'Pending',
        needsPasswordChange: true,
      });
      results.created++;
      createdInBatch.push({ name, email, rawPass, role: 'alumni' });
    } catch (e) {
      results.errors.push({ row: email, reason: e.message });
    }
  }

  // Send ONE credentials email per new user (FLOW 2)
  const emailStats = { sent: 0, failed: 0 };
  for (const u of createdInBatch) {
    try {
      await sendCredentialsEmail(u.email, u.name, u.rawPass, u.role);
      emailStats.sent++;
    } catch (emailErr) {
      console.error(`[BulkImport] Email failed for ${u.email}:`, emailErr.message);
      emailStats.failed++;
    }
  }
  res.json({
    success: true,
    message: `Import complete: ${results.created} created, ${results.skipped} skipped (duplicates), ${results.errors.length} errors. ${emailStats.sent} credential email${emailStats.sent !== 1 ? 's' : ''} sent.`,
    results,
    emailStats
  });
}));

// ─── POST /api/admin/import ───────────────────────────────────
// Unified import endpoint — role determined by ?type=student|alumni|staff
// Supports dry-run mode: ?preview=true → validates & returns rows without writing to DB
// On full import: creates accounts with status=Pending, sends credentials email to each new user.
router.post('/import', protect, authorize('admin'), upload.single('file'), asyncHandler(async (req, res, next) => {
  const {
    type = 'student',
    preview = 'false'
  } = req.query;
  const isDryRun = preview === 'true';
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  if (!['student', 'alumni', 'staff'].includes(type)) {
    return res.status(400).json({ message: 'type must be "student", "alumni", or "staff".' });
  }

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!raw.length) return res.status(400).json({ message: 'File is empty or has no rows.' });

  // ── Normalise each row ──────────────────────────────────────
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalised = raw.map((row, idx) => {
    const name  = (row['Name']  || row['name']  || '').toString().trim();
    const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
    const dept  = (row['Department'] || row['department'] || '').toString().trim();
    const year  = (row['Year'] || row['year'] ||
      (type === 'student'
        ? row['Batch'] || row['batch'] || row['Join Year']     || ''
        : row['Batch'] || row['batch'] || row['Pass Out Year'] || '')
    ).toString().trim();
    const gradY = (row['Graduation Year'] || row['graduationYear'] || row['Expected Graduation'] || '').toString().trim();
    const roll  = (row['Roll Number'] || row['rollNumber'] || row['Roll'] || '').toString().trim();
    const comp  = (row['Company']     || row['company']     || '').toString().trim();
    const desig = (row['Designation'] || row['designation'] || row['Staff Role'] || row['staffRole'] || '').toString().trim();
    const phone = (row['Phone'] || row['phone'] || '').toString().trim();
    const gen   = (row['Gender'] || row['gender'] || '').toString().trim();

    const errors = [];
    if (!name)  errors.push('Name is required');
    if (!email) errors.push('Email is required');
    else if (!EMAIL_RE.test(email)) errors.push('Invalid email format');

    return {
      _row: idx + 2, // spreadsheet row number (header = row 1)
      name, email,
      department: dept,
      year,
      graduationYear: gradY,
      rollNumber: roll,
      company: comp,
      designation: desig,
      phone,
      gender: gen,
      _valid: errors.length === 0,
      _errors: errors
    };
  });

  // ── Preview / dry-run — return parsed data only ─────────────
  if (isDryRun) {
    return res.json({
      success: true,
      rows: normalised,
      totalRows: normalised.length,
      validRows:   normalised.filter(r => r._valid).length,
      invalidRows: normalised.filter(r => !r._valid).length
    });
  }

  // ── Full import ─────────────────────────────────────────────
  const results = { created: 0, skipped: 0, errors: [] };
  const emailStats = { sent: 0, failed: 0 };
  const createdUsers = []; // { email, name, rawPass, role } — for batch email

  for (const r of normalised) {
    if (!r._valid) {
      results.errors.push({ row: r.email || `Row ${r._row}`, reason: r._errors.join('; ') });
      continue;
    }
    const exists = await User.findOne({ email: r.email });
    if (exists) { results.skipped++; continue; }

    try {
      // ── Generate default password ──────────────────────
      // student: roll number (or email prefix) | alumni/staff: email prefix
      const rawPass = type === 'student'
        ? (r.rollNumber || r.email.split('@')[0])
        : r.email.split('@')[0];
      const hashed = await bcrypt.hash(rawPass, 10);

      // ── Role-specific field mapping ─────────────────────
      const roleFields = {
        student: {
          role: 'student',
          status: 'Pending',   // uniform Pending — admin can bulk-activate later
          graduationYear: r.graduationYear,
          rollNumber: r.rollNumber,
        },
        alumni: {
          role: 'alumni',
          status: 'Pending',
          company: r.company,
          designation: r.designation,
        },
        staff: {
          role: 'staff',
          status: 'Pending',
          designation: r.designation,
          staffRole: r.designation,
        },
      }[type];

      await User.create({
        name: r.name,
        email: r.email,
        password: hashed,
        tempPassword: rawPass,   // STEP 3: store plain-text temp password for audit/resend
        phone: r.phone,
        gender: r.gender,
        department: r.department,
        batch: r.year,
        needsPasswordChange: true,
        ...roleFields
      });

      results.created++;
      createdUsers.push({ name: r.name, email: r.email, rawPass, role: type });
    } catch (e) {
      results.errors.push({ row: r.email, reason: e.message });
    }
  }

  // ── Send credentials emails (fire serially to respect provider limits) ──
  for (const u of createdUsers) {
    try {
      await sendCredentialsEmail(u.email, u.name, u.rawPass, u.role);
      emailStats.sent++;
    } catch (emailErr) {
      console.error(`[BulkImport] Credentials email failed for ${u.email}:`, emailErr.message);
      emailStats.failed++;
    }
  }

  // ── Persist import log ──────────────────────────────────────
  try {
    await ImportLog.create({
      importedBy:   req.user._id,
      type,
      totalRows:    normalised.length,
      created:      results.created,
      skipped:      results.skipped,
      failed:       results.errors.length,
      emailsSent:   emailStats.sent,
      emailsFailed: emailStats.failed,
      errors:       results.errors,
      fileName:     req.file.originalname,
    });
  } catch (logErr) {
    console.error('[BulkImport] Failed to save import log:', logErr.message);
  }

  res.json({
    success: true,
    message: `Import complete: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors. ${emailStats.sent} credential email${emailStats.sent !== 1 ? 's' : ''} sent.`,
    results,
    emailStats,
  });
}));

// ─── GET /api/admin/alumni ────────────────────────────────────
// Full list with search, filter by dept/batch/status, pagination
router.get('/alumni', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    search = '',
    department = '',
    batch = '',
    status = '',
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  const query = {
    role: 'alumni'
  };

  // Search by name or email
  if (search.trim()) {
    query.$or = [{
      name: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      email: {
        $regex: search.trim(),
        $options: 'i'
      }
    }];
  }
  if (department) query.department = department;
  if (batch) query.batch = batch;
  if (status) query.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === 'asc' ? 1 : -1;
  const sortObj = {
    [sort]: sortDir
  };
  const [alumni, total] = await Promise.all([User.find(query).select('-password -secretKey -otp -otpExpiry -connections').sort(sortObj).skip(skip).limit(Number(limit)), User.countDocuments(query)]);

  // Also return distinct dept + batch lists for filter dropdowns
  const [departments, batches] = await Promise.all([User.distinct('department', {
    role: 'alumni',
    department: {
      $exists: true,
      $ne: ''
    }
  }), User.distinct('batch', {
    role: 'alumni',
    batch: {
      $exists: true,
      $ne: ''
    }
  })]);
  res.json({
    success: true,
    data: alumni,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    },
    filters: {
      departments: departments.sort(),
      batches: batches.sort()
    }
  });
}));

// ─── PUT /api/admin/alumni/:id ────────────────────────────────
// Edit an alumni's name, email, department, batch, company, designation, status
router.put('/alumni/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'email', 'phone', 'department', 'batch', 'company', 'designation', 'presentStatus', 'city', 'state', 'status'];
  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const user = await User.findByIdAndUpdate(req.params.id, {
    $set: updates
  }, {
    new: true,
    runValidators: true
  }).select('-password -secretKey -otp -otpExpiry');
  if (!user) return res.status(404).json({
    message: 'Alumni not found.'
  });
  res.json({
    success: true,
    data: user,
    message: 'Alumni updated.'
  });
}));

// ─── DELETE /api/admin/alumni/:id ────────────────────────────
// Permanently delete an alumni account
router.delete('/alumni/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndDelete({
    _id: req.params.id,
    role: 'alumni'
  });
  if (!user) return res.status(404).json({
    message: 'Alumni not found.'
  });
  res.json({
    success: true,
    message: `${user.name}'s account has been deleted.`
  });
}));

// ─── PUT /api/admin/reject-alumni/:userId ────────────────────
// Set status to Pending (un-approve) — leaves the record intact
router.put('/reject-alumni/:userId', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.userId, {
    status: 'Pending'
  }, {
    new: true
  });
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  res.json({
    success: true,
    message: `${user.name}'s account has been set to Pending.`
  });
}));

// ─── GET /api/admin/pending-alumni ───────────────────────────
// Returns ONLY self-registered alumni awaiting approval.
// Bulk-imported users (needsPasswordChange: true) are excluded — they
// self-activate via the first-login wizard and do NOT need admin approval.
router.get('/pending-alumni', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const pendingAlumni = await User.find({
    role: 'alumni',
    status: 'Pending',
    $or: [
      { needsPasswordChange: { $exists: false } },
      { needsPasswordChange: false },
    ]
  }).select('-password -secretKey -otp -otpExpiry').sort({ createdAt: -1 });
  res.json({ success: true, data: pendingAlumni });
}));

// ─── PUT /api/admin/activate/:userId ─────────────────────────
// EMAIL RULE:
//   • Self-registered users (alumni/staff who went through the OTP flow)
//     → receive the "approval" email (their first email from us after activation).
//   • Bulk-imported users (have tempPassword set at import time)
//     → already received their credentials email during import.
//     → DO NOT send another email here to avoid confusion / duplicates.
router.put('/activate/:userId', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId).select('+tempPassword');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  if (user.status === 'Active') return res.status(400).json({ message: 'Account already active.' });

  user.status = 'Active';
  await user.save();

  // ── In-app notification (real-time socket push) ──────────────
  const notif = await Notification.create({
    userId: user._id,
    type:   'account_activated',
    title:  '🎉 Your account has been approved!',
    description: 'Welcome to MAMCET Alumni Connect! You can now log in and explore.',
    icon: '🎉'
  });
  const io = req.app.get('io');
  if (io) io.to(user._id.toString()).emit('notification_received', notif.toObject());

  // ── Email: only for SELF-REGISTERED users ───────────────────
  // Bulk-imported users already got their credentials email at import time.
  // tempPassword is set during bulk import and cleared only after activation wizard.
  // If tempPassword is still present → bulk user → skip approval email.
  const isBulkImported = !!user.tempPassword;
  if (!isBulkImported) {
    try {
      await sendApprovalEmail(user.email, user.name);
    } catch (emailErr) {
      console.error(`[Activate] Approval email failed for ${user.email}:`, emailErr.message);
    }
  }

  res.json({
    success: true,
    message: `${user.name} has been activated.`
  });
}));

// ─── DELETE /api/admin/reject/:userId ────────────────────────
router.delete('/reject/:userId', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });

  // Notify before deleting (so we still have the userId)
  await createNotification(req.app.get('io'), {
    userId: user._id,
    type: 'system',
    title: '❌ Your account application was not approved',
    description: 'Unfortunately your alumni registration did not meet our requirements. Contact the admin for details.',
    icon: '🚫'
  });
  await User.findByIdAndDelete(req.params.userId);
  res.json({
    success: true,
    message: `${user.name}'s application has been rejected and removed.`
  });
}));

// ─── GET /api/admin/stats ─────────────────────────────────────
// Only counts ACTIVATED (status === 'Active') users.
// Pending and Rejected users are excluded from all totals.
router.get('/stats', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Job   = require('../models/Job');
  const Event = require('../models/Event');
  const Post  = require('../models/Post');

  const [
    activeStudents,
    activeAlumni,
    activeStaff,
    pendingAlumni,
    pendingStaff,
    pendingJobs,
    pendingEvents,
    totalPosts,
  ] = await Promise.all([
    // ── Active counts (only fully activated users) ────────────
    User.countDocuments({ role: 'student', status: 'Active' }),
    User.countDocuments({ role: 'alumni',  status: 'Active' }),
    User.countDocuments({ role: 'staff',   status: 'Active' }),
    // ── Pending counts (for approval badges) ─────────────────
    User.countDocuments({ role: 'alumni', status: 'Pending' }),
    User.countDocuments({ role: 'staff',  status: 'Pending' }),
    Job.countDocuments({ status: 'Pending' }),
    Event.countDocuments({ status: 'Pending' }),
    Post.countDocuments(),
  ]);

  // Total active users = students + alumni + staff (excludes pending/rejected)
  const totalUsers = activeStudents + activeAlumni + activeStaff;

  res.json({
    success: true,
    data: {
      totalUsers,       // active only
      activeStudents,
      activeAlumni,
      activeStaff,
      pendingAlumni,
      pendingStaff,
      pendingJobs,
      pendingEvents,
      totalPosts,
    }
  });
}));

// ─── GET /api/admin/pending-events ───────────────────────────
// (Alias — mirrors GET /api/events/pending for admin convenience)
router.get('/pending-events', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Event = require('../models/Event');
  const events = await Event.find({
    status: 'Pending'
  }).populate('createdBy', 'name email role').sort({
    createdAt: -1
  });
  res.json({
    success: true,
    data: events
  });
}));

// ─── PUT /api/admin/approve-event/:id ────────────────────────
// Alias for PUT /api/events/:id/approve — keeps Admin route prefix consistent
router.put('/approve-event/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Event = require('../models/Event');
  const event = await Event.findByIdAndUpdate(req.params.id, {
    status: 'Approved'
  }, {
    new: true
  });
  if (!event) return res.status(404).json({
    message: 'Event not found.'
  });
  try {
    const recipients = await User.find({
      role: {
        $in: ['student', 'alumni']
      }
    }).select('_id');
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
  res.json({
    success: true,
    message: 'Event approved.',
    data: event
  });
}));

// ─── PUT /api/admin/reject-event/:id ─────────────────────────
router.put('/reject-event/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Event = require('../models/Event');
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({
    message: 'Event not found.'
  });
  res.json({
    success: true,
    message: 'Event rejected and removed.'
  });
}));

// ════════════════════════════════════════════════════════════════
//  POST MODERATION
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/posts ─────────────────────────────────────
// Returns all posts (with author details) for admin moderation panel.
// Filters: filter=all|reported|hidden|recent, search, page, limit
router.get('/posts', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Post = require('../models/Post');
  const {
    filter = 'all',
    search = '',
    page = 1,
    limit = 15
  } = req.query;
  const query = {};
  if (filter === 'reported') query.reportCount = {
    $gt: 0
  };else if (filter === 'hidden') query.isHidden = true;else if (filter === 'recent') {} // just sort createdAt desc — already default

  if (search.trim()) {
    query.$or = [{
      userName: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      content: {
        $regex: search.trim(),
        $options: 'i'
      }
    }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Post.countDocuments(query);
  const posts = await Post.find(query).sort({
    createdAt: -1
  }).skip(skip).limit(Number(limit)).populate('userId', 'name email profilePic role status department').populate('reportedBy', 'name email');
  const reportedCount = await Post.countDocuments({
    reportCount: {
      $gt: 0
    }
  });
  const hiddenCount = await Post.countDocuments({
    isHidden: true
  });
  res.json({
    success: true,
    data: posts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    },
    stats: {
      total,
      reportedCount,
      hiddenCount
    }
  });
}));

// ─── DELETE /api/admin/posts/:id ─────────────────────────────
// Hard-delete a post (admin override — bypasses author check)
router.delete('/posts/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Post = require('../models/Post');
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({
    message: 'Post not found.'
  });

  // Clean up Cloudinary image (fire-and-forget)
  if (post.media) {
    deleteCloudinaryImage(post.media).catch(() => {});
  }
  await post.deleteOne();
  res.json({
    success: true,
    message: 'Post permanently deleted.'
  });
}));

// ─── PUT /api/admin/posts/:id/hide ───────────────────────────
// Toggle hidden status of a post (soft moderation)
router.put('/posts/:id/hide', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Post = require('../models/Post');
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({
    message: 'Post not found.'
  });
  post.isHidden = !post.isHidden;
  await post.save();
  res.json({
    success: true,
    message: post.isHidden ? 'Post hidden from feed.' : 'Post restored to feed.',
    data: {
      isHidden: post.isHidden
    }
  });
}));

// ─── PUT /api/admin/posts/:id/dismiss-reports ────────────────
// Clear all reports on a post (admin reviewed & dismissed)
router.put('/posts/:id/dismiss-reports', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const Post = require('../models/Post');
  const post = await Post.findByIdAndUpdate(req.params.id, {
    $set: {
      reportedBy: [],
      reportCount: 0
    }
  }, {
    new: true
  });
  if (!post) return res.status(404).json({
    message: 'Post not found.'
  });
  res.json({
    success: true,
    message: 'Reports dismissed.'
  });
}));

// ─── PUT /api/admin/ban-user/:userId ─────────────────────────
// Ban a user: set status → 'Inactive' (they cannot log in)
router.put('/ban-user/:userId', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({
    message: 'User not found.'
  });
  if (user.role === 'admin') {
    return res.status(400).json({
      message: 'Cannot ban an admin account.'
    });
  }
  const isBanned = user.status === 'Inactive';
  user.status = isBanned ? 'Active' : 'Inactive';
  await user.save();

  // Notify user
  await Notification.create({
    userId: user._id,
    type: 'account_update',
    title: isBanned ? '✅ Your account has been reinstated.' : '🚫 Your account has been suspended.',
    description: isBanned ? 'An admin has restored your account. You can log in again.' : 'Your account has been suspended by an admin due to a policy violation.',
    icon: isBanned ? '✅' : '🚫'
  });
  res.json({
    success: true,
    message: isBanned ? `${user.name} reinstated.` : `${user.name} banned.`,
    data: {
      status: user.status
    }
  });
}));

// ─── POST /api/admin/graduation/run ─────────────────────────
// Manual trigger: promotes all eligible students (graduationYear < current year)
router.post('/graduation/run', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  console.log(`[Admin] Manual graduation triggered by ${req.user?.email}`);
  const result = await runGraduationJob();
  const message = result.promoted > 0 ? `🎓 ${result.promoted} student(s) promoted to Alumni!` : 'No students eligible for graduation at this time.';
  res.json({
    success: true,
    message,
    data: result
  });
}));

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
router.post('/broadcast', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    audience = 'all',
    batch,
    title,
    message,
    icon = '📢',
    sendEmail = false
  } = req.body;
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({
      message: 'Title and message are required.'
    });
  }

  // ── Build recipient query ──────────────────────────────
  const query = {};
  switch (audience) {
    case 'students':
      query.role = 'student';
      break;
    case 'alumni':
      query.role = 'alumni';
      break;
    case 'batch':
      query.role = 'alumni';
      query.batch = batch;
      break;
    default:
      query.role = {
        $in: ['student', 'alumni']
      };
      break;
    // 'all'
  }
  const recipients = await User.find(query).select('_id name email');
  if (recipients.length === 0) {
    return res.json({
      success: true,
      message: 'No recipients matched the selected audience.',
      data: {
        sent: 0
      }
    });
  }

  // ── Create in-app notifications (bulk) ──────────────────
  const notifDocs = recipients.map(u => ({
    userId: u._id,
    type: 'broadcast',
    title: title.trim(),
    description: message.trim(),
    icon
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
  let emailResult = {
    sent: 0,
    skipped: 0,
    failed: 0
  };
  if (sendEmail) {
    try {
      emailResult = await sendBroadcastEmail(recipients.map(u => ({
        email: u.email,
        name: u.name
      })), title.trim(), title.trim(), message.trim());
    } catch (emailErr) {
      console.error('[Broadcast] Email send error:', emailErr.message);
    }
  }
  const audienceLabel = {
    all: 'All users',
    students: 'All students',
    alumni: 'All alumni',
    batch: `Batch ${batch}`
  }[audience] || audience;
  console.log(`[Broadcast] "${title}" → ${recipients.length} recipients (${audienceLabel}) | email: ${JSON.stringify(emailResult)}`);
  res.json({
    success: true,
    message: `📢 Broadcast sent to ${recipients.length} ${audienceLabel} recipient${recipients.length !== 1 ? 's' : ''}.`,
    data: {
      sent: recipients.length,
      audienceLabel,
      emailResult
    }
  });
}));

// ─── GET /api/admin/batches ──────────────────────────────
// Returns distinct batch years for the batch-specific audience dropdown
router.get('/batches', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const batches = await User.distinct('batch', {
    role: 'alumni',
    batch: {
      $exists: true,
      $ne: '',
      $ne: null
    }
  });
  const sorted = batches.filter(Boolean).sort((a, b) => Number(b) - Number(a));
  res.json({
    success: true,
    data: sorted
  });
}));

// ════════════════════════════════════════════════════════════════
//  ROLE MANAGEMENT
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/users/roles — list all users with roles ──
router.get('/users/roles', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    search = '',
    role = '',
    page = 1,
    limit = 10
  } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search.trim()) {
    query.$or = [{
      name: {
        $regex: search.trim(),
        $options: 'i'
      }
    }, {
      email: {
        $regex: search.trim(),
        $options: 'i'
      }
    }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query).select('name email role status department batch profilePic createdAt').sort({
    createdAt: -1
  }).skip(skip).limit(Number(limit));
  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
}));

// ─── PUT /api/admin/users/:id/role — change a user's role ────
router.put('/users/:id/role', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    role
  } = req.body;
  if (!['student', 'alumni', 'admin'].includes(role)) {
    return res.status(400).json({
      message: 'Invalid role. Must be student, alumni, or admin.'
    });
  }
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({
    message: 'User not found.'
  });

  // Prevent self-demotion
  if (target._id.toString() === req.user._id.toString() && role !== 'admin') {
    return res.status(400).json({
      message: 'You cannot change your own admin role.'
    });
  }
  const oldRole = target.role;
  target.role = role;
  await target.save();

  // Notify the user
  await Notification.create({
    userId: target._id,
    type: 'role_changed',
    title: `Your account role has been updated to ${role}.`,
    description: `An admin changed your role from ${oldRole} → ${role}.`,
    icon: '🔄'
  });
  res.json({
    success: true,
    message: `${target.name}'s role updated to ${role}.`,
    data: {
      role
    }
  });
}));

// ════════════════════════════════════════════════════════════════
//  SYSTEM CONFIG
// ════════════════════════════════════════════════════════════════
// Simple in-process store (persists while server is up).
// For production, store in a DB collection or .env overrides.
const _sysConfig = {
  siteName: 'MAMCET Alumni Connect',
  allowAlumniJobs: true,
  allowAlumniEvents: true,
  requireApproval: true,
  maintenanceMode: false,
  notifEmailEnabled: false,
  maxUploadSizeMB: 5
};

// ─── GET /api/admin/system-config ────────────────────────────
router.get('/system-config', protect, authorize('admin'), (req, res) => {
  res.json({
    success: true,
    data: {
      ..._sysConfig
    }
  });
});

// ─── PUT /api/admin/system-config ────────────────────────────
router.put('/system-config', protect, authorize('admin'), (req, res) => {
  const allowed = Object.keys(_sysConfig);
  Object.entries(req.body).forEach(([k, v]) => {
    if (allowed.includes(k)) _sysConfig[k] = v;
  });
  console.log('[System Config] Updated:', _sysConfig);
  res.json({
    success: true,
    message: 'System configuration saved.',
    data: {
      ..._sysConfig
    }
  });
});
// ════════════════════════════════════════════════════════════════
//  STAFF APPROVAL
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/pending-staff ────────────────────────────
// Returns all staff whose status is still Pending (awaiting admin approval)
// Returns ONLY self-registered staff awaiting admin approval.
// Bulk-imported staff (needsPasswordChange: true) are excluded — they
// self-activate via the first-login wizard and do NOT need admin approval.
router.get('/pending-staff', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const pendingStaff = await User.find({
    role: 'staff',
    status: 'Pending',
    $or: [
      { needsPasswordChange: { $exists: false } },
      { needsPasswordChange: false },
    ]
  })
    .select('-password -secretKey -otp -otpExpiry')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: pendingStaff });
}));

// ─── GET /api/admin/imported-users ──────────────────────────
// Bulk-imported users who have NOT yet completed the activation wizard.
// These are Pending + needsPasswordChange: true (set during bulk import).
// They self-activate — admin cannot approve/reject them here, only monitor.
// Query params: role (student|alumni|staff|all), page, limit
router.get('/imported-users', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const { role = 'all', page = 1, limit = 20 } = req.query;

  const query = {
    status: 'Pending',
    needsPasswordChange: true,
  };
  if (role !== 'all') query.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-password -secretKey -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// ─── POST /api/admin/approve-staff ───────────────────────────
// Body: { userId, action: 'approve' | 'reject' }
router.post('/approve-staff', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const { userId, action } = req.body;
  if (!userId || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'userId and action (approve|reject) are required.' });
  }

  const staffUser = await User.findOne({ _id: userId, role: 'staff' });
  if (!staffUser) return res.status(404).json({ message: 'Staff user not found.' });

  if (action === 'approve') {
    staffUser.status = 'Active';
    await staffUser.save();

    // Notify the staff member
    const notif = await Notification.create({
      userId: staffUser._id,
      type: 'account_activated',
      title: '🎉 Your staff account has been approved!',
      description: 'Welcome to MAMCET Alumni Connect! You can now log in and access the staff dashboard.',
      icon: '🎉'
    });
    const io = req.app.get('io');
    if (io) io.to(staffUser._id.toString()).emit('notification_received', notif.toObject());

    // ── Email: only for SELF-REGISTERED staff ─────────────────
    // Bulk-imported staff already received credentials email at import time.
    // tempPassword is present on bulk users until they complete the activation wizard.
    const staffUserWithPass = await User.findById(staffUser._id).select('+tempPassword');
    const isBulkImportedStaff = !!(staffUserWithPass?.tempPassword);
    if (!isBulkImportedStaff) {
      try { await sendApprovalEmail(staffUser.email, staffUser.name); } catch (emailErr) {
        console.error(`[ApproveStaff] Email failed for ${staffUser.email}:`, emailErr.message);
      }
    }

    return res.json({
      success: true,
      message: `${staffUser.name} has been approved and can now log in.`
    });
  }

  // action === 'reject'
  await createNotification(req.app.get('io'), {
    userId: staffUser._id,
    type: 'system',
    title: '❌ Staff registration not approved',
    description: 'Unfortunately your staff registration was not approved. Please contact the admin for details.',
    icon: '🚫'
  });
  await User.findByIdAndDelete(userId);

  res.json({
    success: true,
    message: `${staffUser.name}'s staff registration has been rejected and removed.`
  });
}));

// ════════════════════════════════════════════════════════════════
//  STAFF CRUD (Approved/All Staff)
// ════════════════════════════════════════════════════════════════

// ─── GET /api/admin/staff ────────────────────────────────────
// Full list with search, filter by dept/status, pagination
router.get('/staff', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const {
    search = '',
    department = '',
    roleFilter = '',
    status = '',
    page = 1,
    limit = 10,
    sort = 'createdAt',
    order = 'desc'
  } = req.query;
  const query = {
    role: 'staff'
  };

  if (search.trim()) {
    query.$or = [{
      name: { $regex: search.trim(), $options: 'i' }
    }, {
      email: { $regex: search.trim(), $options: 'i' }
    }];
  }
  if (department) query.department = department;
  if (roleFilter) query.designation = roleFilter; // staff role maps to designation
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const sortDir = order === 'asc' ? 1 : -1;
  const sortObj = { [sort]: sortDir };

  const [staff, total] = await Promise.all([
    User.find(query).select('-password -secretKey -otp -otpExpiry -connections').sort(sortObj).skip(skip).limit(Number(limit)),
    User.countDocuments(query)
  ]);

  const [departments, roles] = await Promise.all([
    User.distinct('department', { role: 'staff', department: { $exists: true, $ne: '' } }),
    User.distinct('designation', { role: 'staff', designation: { $exists: true, $ne: '' } })
  ]);

  res.json({
    success: true,
    data: staff,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    },
    filters: {
      departments: departments.sort(),
      roles: roles.sort()
    }
  });
}));

// ─── PUT /api/admin/staff/:id ────────────────────────────────
router.put('/staff/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const allowed = ['name', 'email', 'phone', 'department', 'designation', 'status'];
  const updates = {};
  allowed.forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });
  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, {
    new: true,
    runValidators: true
  }).select('-password -secretKey -otp -otpExpiry');
  
  if (!user || user.role !== 'staff') {
    return res.status(404).json({ message: 'Staff member not found.' });
  }
  
  res.json({
    success: true,
    data: user,
    message: 'Staff profile updated.'
  });
}));

// ─── DELETE /api/admin/staff/:id ────────────────────────────
router.delete('/staff/:id', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndDelete({
    _id: req.params.id,
    role: 'staff'
  });
  if (!user) return res.status(404).json({ message: 'Staff member not found.' });
  
  res.json({
    success: true,
    message: `${user.name}'s account has been deleted.`
  });
}));

// ─── PUT /api/admin/reject-staff/:userId ────────────────────
// Move an approved staff back to pending
router.put('/reject-staff/:userId', protect, authorize('admin'), asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndUpdate({ _id: req.params.userId, role: 'staff' }, {
    status: 'Pending'
  }, { new: true });
  
  if (!user) return res.status(404).json({ message: 'Staff member not found.' });
  
  res.json({
    success: true,
    message: `${user.name}'s account has been set to Pending.`
  });
}));

module.exports = router;