import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import '../../styles/Auth.css';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'MBA',
  'MCA',
  'Other'
];

const DESIGNATIONS = ['Principal', 'HOD', 'Professor', 'Associate Professor', 'Assistant Professor'];

const StaffSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState('');
  const [otpStep, setOtpStep]                     = useState(false);
  const [otp, setOtp]                             = useState('');
  const [regEmail, setRegEmail]                   = useState('');
  const [resending, setResending]                 = useState(false);
  const [pendingApproval, setPendingApproval]     = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    department: '', designation: '',
    password: '', confirmPassword: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /* ── Step 1: Submit registration → send OTP ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.designation) { setError('Please select your designation.'); return; }
    setLoading(true);
    try {
      // staffRole mirrors designation so backend stores it in the dedicated field
      await authService.register({ ...form, role: 'staff', staffRole: form.designation });
      setRegEmail(form.email);
      setOtpStep(true);
      toast.success('OTP sent to your email! Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: Verify OTP → account is now Pending (not Active) ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(regEmail, otp);
      const data = res?.data;
      if (data?.pendingApproval) {
        // Backend created user with status=Pending; admin must approve before login
        setPendingApproval(true);
      } else {
        // Fallback (shouldn't normally occur for staff)
        toast.success('Account ready! You can now log in.');
        setTimeout(() => navigate('/login/staff'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await authService.resendOtp(regEmail);
      toast.success('OTP resent!');
    } catch (_) { toast.error('Could not resend OTP.'); }
    finally { setResending(false); }
  };

  /* ────────────────────────── RENDER ────────────────────────── */
  return (
    <div className="signup-background py-5">
      <Link to="/register" className="back-btn-circle" title="Back to Selection">
        <i className="fas fa-arrow-left" />
      </Link>
      <Toaster position="top-center" />

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4 p-md-5">

          {/* ── Brand header ── */}
          <div className="text-center mb-5">
            <div className="brand-logo-container mb-3">
              <img
                src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png"
                alt="MAMCET"
                width={42}
                style={{ objectFit: 'contain' }}
              />
              <span className="ms-2 brand-name-red fw-bold" style={{ fontSize: 15 }}>ALUMNI CONNECT</span>
            </div>

            {pendingApproval ? (
              <h2 className="fw-bold">Registration Submitted! 🎉</h2>
            ) : otpStep ? (
              <>
                <h2 className="fw-bold">Verify Your Email</h2>
                <p className="text-muted">OTP sent to <strong>{regEmail}</strong></p>
              </>
            ) : (
              <>
                <h2 className="fw-bold">Staff Registration</h2>
                <p className="text-muted small">For Principals, HODs &amp; Faculty of MAMCET</p>
              </>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              SCREEN A — Pending admin approval (after OTP)
          ══════════════════════════════════════════════════ */}
          {pendingApproval && (
            <div className="text-center py-3">
              <div style={{ fontSize: 56, marginBottom: 16 }}>🏫</div>
              <h5 className="fw-bold mb-2">Awaiting Admin Approval</h5>
              <p className="text-muted mb-4" style={{ fontSize: 14 }}>
                Your email has been verified. Your staff account is now{' '}
                <strong>under review</strong> by the MAMCET admin team.
                You will receive an email once your account is activated.
              </p>
              <div
                style={{
                  background: 'rgba(200,64,34,0.07)',
                  border: '1.5px solid rgba(200,64,34,0.18)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  fontSize: 13,
                  color: '#c84022',
                  marginBottom: 24,
                  textAlign: 'left',
                }}
              >
                <strong>📧 Registered email:</strong> {regEmail}
              </div>
              <Link
                to="/login/staff"
                className="btn btn-mamcet-red btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                style={{ textDecoration: 'none' }}
              >
                Go to Staff Login
              </Link>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              SCREEN B — OTP verification step
          ══════════════════════════════════════════════════ */}
          {!pendingApproval && otpStep && (
            <form onSubmit={handleVerifyOtp}>
              {error && (
                <div className="alert alert-danger py-2 small mb-3">
                  <i className="fas fa-exclamation-circle me-2" />{error}
                </div>
              )}
              <div className="text-center mb-4">
                <input
                  type="text"
                  className="form-control text-center fw-bold"
                  maxLength={6}
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ letterSpacing: '10px', fontSize: '2rem', padding: '16px' }}
                  autoFocus
                />
              </div>
              <div className="d-grid mb-3">
                <button
                  type="submit"
                  className="btn btn-mamcet-red btn-lg d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? <><ClipLoader size={18} color="#fff" /> Verifying...</> : '✓ Verify & Submit Registration'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-muted small"
                  onClick={handleResendOtp}
                  disabled={resending}
                >
                  {resending ? 'Resending...' : "Didn't get it? Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════
              SCREEN C — Registration form
          ══════════════════════════════════════════════════ */}
          {!pendingApproval && !otpStep && (
            <form className="row g-3" onSubmit={handleSubmit}>

              {error && (
                <div className="col-12">
                  <div className="alert alert-danger py-2 small mb-0">
                    <i className="fas fa-exclamation-circle me-2" />{error}
                  </div>
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input
                  type="text" name="name" className="form-control"
                  placeholder="Dr. / Prof. Your Name"
                  required onChange={handleChange} value={form.name}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Official Email</label>
                <input
                  type="email" name="email" className="form-control"
                  placeholder="you@mamcet.com"
                  required onChange={handleChange} value={form.email}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel" name="phone" className="form-control"
                  placeholder="Your phone number"
                  onChange={handleChange} value={form.phone}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">
                  Designation <span className="text-danger">*</span>
                </label>
                <select
                  name="designation" className="form-select"
                  required onChange={handleChange} value={form.designation}
                >
                  <option value="">Select Designation...</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Department</label>
                <select
                  name="department" className="form-select"
                  onChange={handleChange} value={form.department}
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="col-md-6 mt-3">
                <label className="form-label">Password</label>
                <input
                  type="password" name="password" minLength="6"
                  className="form-control"
                  required onChange={handleChange} value={form.password}
                />
              </div>
              <div className="col-md-6 mt-3">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password" name="confirmPassword" minLength="6"
                  className="form-control"
                  required onChange={handleChange} value={form.confirmPassword}
                />
              </div>

              <div className="d-grid mt-4">
                <button
                  type="submit"
                  className="btn btn-mamcet-red btn-lg d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? <><ClipLoader size={18} color="#fff" /> Sending OTP...</> : 'Send OTP & Continue'}
                </button>
              </div>

              <div className="auth-footer-text text-center text-muted mt-2">
                Already registered?{' '}
                <Link to="/login/staff" className="text-decoration-none fw-bold" style={{ color: '#c84022' }}>
                  Log In
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default StaffSignUp;
