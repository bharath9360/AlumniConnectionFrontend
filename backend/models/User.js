const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const experienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  duration: String,
  desc: String
}, { _id: false });

const educationSchema = new mongoose.Schema({
  school: String,
  degree: String,
  duration: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['admin', 'alumni', 'student', 'staff'],
    default: 'alumni'
  },
  gender: String,

  // Academic
  batch: String,
  department: String,
  degree: String,
  graduationYear: String,   // Expected graduation year (student) / pass-out year (alumni)
  rollNumber: String,       // College roll / register number

  // Profile
  bio: String,
  profilePic: { type: String, default: '' },
  bannerPic: { type: String, default: '' },
  city: String,
  state: String,
  zipCode: String,
  address: String,

  // Professional
  presentStatus: {
    type: String,
    enum: ['working', 'entrepreneur', 'student', 'intern', 'other', ''],
    default: ''
  },
  company: String,
  designation: String,
  workLocation: String,
  businessName: String,
  natureOfBusiness: String,
  institutionName: String,
  coursePursuing: String,

  // Social
  connectionCount: { type: String, default: '0' },
  views: { type: Number, default: 0 },
  skills: [String],
  experience: [experienceSchema],
  education: [educationSchema],

  // Legacy field removed: connections collection is used now

  // Staff-specific
  staffRole: { type: String, trim: true }, // e.g. Principal, HOD, Professor

  // Account status
  status: {
    type: String,
    enum: ['Pending', 'Active'],
    default: 'Active'
  },
  needsPasswordChange: {
    type: Boolean,
    default: false
  },
  // Bulk-import only: stores the plain-text temp password shown in the credentials email.
  // Cleared to null once user activates (sets their own password).
  tempPassword: { type: String, select: false, default: null },

  // Session tracking (used for "active users" analytics)
  lastLogin: { type: Date, default: null },

  // OTP verification (student & admin sign-up)
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },

  // Admin credentials
  secretKey: { type: String, select: false },

  // Blocked users list
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// ── Performance indexes for admin analytics queries ───────────
userSchema.index({ role: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, department: 1 });
userSchema.index({ role: 1, batch: 1 });
userSchema.index({ lastLogin: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return safe user object (no password)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.secretKey;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
