const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Connection = require('../models/Connection');
const { sendOTPEmail, sendApprovalEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');
const { profileUpload, uploadToCloudinary } = require('../middleware/upload');

const router = express.Router();

// ─── Helper: Auto-connect to Admin ────────────────────────────
const ensureAdminConnection = async (userId) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return;
    if (admin._id.toString() === userId.toString()) return;

    const u1 = userId.toString() < admin._id.toString() ? userId : admin._id;
    const u2 = userId.toString() < admin._id.toString() ? admin._id : userId;

    const exists = await Connection.findOne({ user1: u1, user2: u2 });
    if (!exists) {
      await Connection.create({ user1: u1, user2: u2 });
      
      // Update connection counts
      const count1 = await Connection.countDocuments({ $or: [{ user1: u1 }, { user2: u1 }] });
      const count2 = await Connection.countDocuments({ $or: [{ user1: u2 }, { user2: u2 }] });
      
      await User.findByIdAndUpdate(u1, { connectionCount: count1.toString() });
      await User.findByIdAndUpdate(u2, { connectionCount: count2.toString() });
    }
  } catch (err) {
    console.error('Auto-connect admin error:', err);
  }
};

// ─── Helper: Sign Token ───────────────────────────────────────
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

const sendAuthResponse = (res, statusCode, user, token) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profilePic: user.profilePic,
      coverPic: user.coverPic,
      bio: user.bio,
      batch: user.batch,
      department: user.department,
      degree: user.degree,
      company: user.company,
      designation: user.designation,
      phone: user.phone,
      city: user.city,
      state: user.state,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      connectionCount: user.connectionCount,
      connections: user.connections,
      views: user.views,
      presentStatus: user.presentStatus
    }
  });
};

// ─── In-memory OTP store (dev use; replace with DB in prod) ───
// We store hashed OTP + expiry + partial user data in the User document itself
// using the otp + otpExpiry fields. The user is NOT created until OTP is verified.
// For now we keep a simple Map for pending registrations:
const pendingRegistrations = new Map();

// ─── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, phone, gender,
      batch, department, degree,
      address, city, state, zipCode,
      presentStatus, company, designation, workLocation,
      businessName, natureOfBusiness, institutionName, coursePursuing,
      secretKey
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Check if email already taken
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // ── ALUMNI: Create account with Pending status, notify admins ──
    if (role === 'alumni') {
      const user = await User.create({
        name, email, password, phone, gender,
        role: 'alumni',
        status: 'Pending',
        batch, department, degree,
        address, city, state, zipCode,
        presentStatus, company, designation, workLocation,
        businessName, natureOfBusiness, institutionName, coursePursuing
      });

      // Notify all admins
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        if (admins.length > 0) {
          const notifDocs = admins.map(a => ({
            userId: a._id,
            type: 'admin_approval_needed',
            title: `New Alumni Registration: ${name}`,
            description: `${email} • ${department || ''} • ${batch || ''} — Awaiting your approval.`,
            icon: '👤',
            relatedId: user._id
          }));
          await Notification.insertMany(notifDocs);
        }
      } catch (_) {}

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Registration submitted! Your account is under review by the MAMCET admin team. You will receive an email once approved.'
      });
    }

    // ── ADMIN: Validate secret key before OTP ──
    if (role === 'admin') {
      const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'MAMCET_ADMIN_2026';
      if (secretKey !== ADMIN_SECRET) {
        return res.status(403).json({ message: 'Invalid admin secret key.' });
      }
    }

    // ── STUDENT / ADMIN: Generate OTP, save in pending map, send email ──
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store pending registration data (keyed by email)
    pendingRegistrations.set(email.toLowerCase(), {
      name, email: email.toLowerCase(), password, phone, gender,
      role: role || 'student',
      batch, department, degree,
      address, city, state, zipCode,
      presentStatus, company, designation, workLocation,
      businessName, natureOfBusiness, institutionName, coursePursuing,
      otp,
      otpExpiry: expiry
    });

    await sendOTPEmail(email, otp, name);

    return res.status(200).json({
      success: true,
      otpSent: true,
      message: `OTP sent to ${email}. Please verify to complete registration.`
    });

  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: err.message || 'Registration failed. Please try again.' });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const pending = pendingRegistrations.get(email.toLowerCase());

    if (!pending) {
      return res.status(400).json({ message: 'No pending registration for this email. Please register again.' });
    }

    if (Date.now() > pending.otpExpiry) {
      pendingRegistrations.delete(email.toLowerCase());
      return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    }

    if (otp.toString() !== pending.otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // OTP valid — create the user
    const { otp: _o, otpExpiry: _e, ...userData } = pending;
    const user = await User.create({ ...userData, status: 'Active' });
    pendingRegistrations.delete(email.toLowerCase());

    const token = signToken(user._id);

    // Auto-connect to admin (fire-and-forget)
    ensureAdminConnection(user._id);

    sendAuthResponse(res, 201, user, token);

  } catch (err) {
    console.error('OTP verify error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// ─── POST /api/auth/resend-otp ────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  const pending = pendingRegistrations.get(email?.toLowerCase());
  if (!pending) {
    return res.status(400).json({ message: 'No pending registration. Please register again.' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  pending.otp = otp;
  pending.otpExpiry = Date.now() + 10 * 60 * 1000;
  pendingRegistrations.set(email.toLowerCase(), pending);
  await sendOTPEmail(email, otp, pending.name);
  res.json({ success: true, message: 'OTP resent successfully.' });
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    // Role check
    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is not registered as ${role}.` });
    }

    // Block Pending alumni from logging in
    if (user.status === 'Pending') {
      return res.status(403).json({
        message: 'Your account is pending admin approval. You will receive an email once activated.',
        pendingApproval: true
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    const token = signToken(user._id);
    // Record last-login timestamp for analytics (fire-and-forget)
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(() => {});
    
    // Auto-connect to admin just in case it's a legacy user or missed
    ensureAdminConnection(user._id);

    sendAuthResponse(res, 200, user, token);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const token = signToken(user._id);
  sendAuthResponse(res, 200, user, token);
});

// ─── PUT /api/auth/profile ────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow password or secret key updates via this route
    delete updates.password;
    delete updates.secretKey;
    delete updates.otp;
    delete updates.otpExpiry;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    });
    
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    const token = signToken(user._id);
    // Record last-login timestamp for analytics (fire-and-forget)
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(() => {});
    sendAuthResponse(res, 200, user, token);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// ─── GET /api/auth/users/:id — Public profile ────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -secretKey -otp -otpExpiry');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user.' });
  }
});

// ─── PUT /api/auth/profile-pic — Upload profile picture ──────
// Accepts multipart/form-data with field name 'profilePic'
router.put('/profile-pic', protect, profileUpload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    // Stream buffer to Cloudinary — returns permanent HTTPS URL
    const imageUrl = await uploadToCloudinary(
      req.file.buffer,
      'alumni/profile_pictures',
      'image',
      {
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: imageUrl },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const token = signToken(user._id);
    // Record last-login timestamp for analytics (fire-and-forget)
    User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).catch(() => {});
    sendAuthResponse(res, 200, user, token);
  } catch (err) {
    console.error('Profile pic upload error:', err);
    res.status(500).json({ message: 'Failed to upload profile picture.' });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

module.exports = router;
