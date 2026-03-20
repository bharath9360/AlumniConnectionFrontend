import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import '../../styles/Auth.css';

const StudentSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resending, setResending] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    degree: '', batch: '', presentStatus: '',
    password: '', confirmPassword: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.register({ ...form, role: 'student' });
      setRegisteredEmail(form.email);
      setOtpStep(true);
      toast.success('OTP sent to your email! Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      await authService.verifyOtp(registeredEmail, otp);
      toast.success('Account created! You can now login. 🎉');
      setTimeout(() => navigate('/login/student'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await authService.resendOtp(registeredEmail);
      toast.success('OTP resent!');
    } catch (_) { toast.error('Could not resend OTP.'); }
    finally { setResending(false); }
  };

  return (
    <div className="signup-background py-5">
      <Link to="/register" className="back-btn-circle" title="Back to Selection">
        <i className="fas fa-arrow-left"></i>
      </Link>
      <Toaster position="top-center" />

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4 p-md-5">
          <div className="text-center mb-5">
            <div className="brand-logo-container mb-3">
              <span className="ms-2 brand-name-red">ALUMNI CONNECT</span>
            </div>
            {otpStep ? (
              <>
                <h2 className="fw-bold">Verify Your Email</h2>
                <p className="text-muted">We sent a 6-digit OTP to <strong>{registeredEmail}</strong></p>
              </>
            ) : (
              <h2 className="fw-bold">Join Our Student Network</h2>
            )}
          </div>

          {error && <div className="alert alert-danger py-2 small mb-3"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}

          {/* ── OTP Step ── */}
          {otpStep ? (
            <form onSubmit={handleVerifyOtp}>
              <div className="text-center mb-4">
                <input
                  type="text"
                  className="form-control text-center fw-bold fs-3 letter-spacing-lg"
                  maxLength={6}
                  placeholder="● ● ● ● ● ●"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ letterSpacing: '10px', fontSize: '2rem', padding: '16px' }}
                  autoFocus
                />
              </div>
              <div className="d-grid mb-3">
                <button type="submit" className="btn btn-mamcet-red btn-lg d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  {loading ? <><ClipLoader size={18} color="#fff" /> Verifying...</> : '✓ Verify & Create Account'}
                </button>
              </div>
              <div className="text-center">
                <button type="button" className="btn btn-link text-muted small" onClick={handleResendOtp} disabled={resending}>
                  {resending ? 'Resending...' : "Didn't get it? Resend OTP"}
                </button>
              </div>
            </form>
          ) : (
            /* ── Registration Form ── */
            <form className="row g-3" onSubmit={handleSubmit}>
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-control" placeholder="Your full name" required onChange={handleChange} value={form.name} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email ID</label>
                <input type="email" name="email" className="form-control" placeholder="you@example.com" required onChange={handleChange} value={form.email} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" className="form-control" placeholder="Your phone number" required onChange={handleChange} value={form.phone} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Degree & Branch</label>
                <input type="text" name="degree" className="form-control" placeholder="e.g., B.E. CSE" required onChange={handleChange} value={form.degree} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Graduation Year</label>
                <input type="number" name="batch" className="form-control" placeholder="e.g., 2026" required onChange={handleChange} value={form.batch} />
              </div>

              <div className="col-12 mt-4 pt-3 border-top">
                <label className="form-label fw-bold">Current Status</label>
                <select name="presentStatus" className="form-select" required onChange={handleChange} value={form.presentStatus}>
                  <option value="">Choose...</option>
                  <option value="student">Currently Studying</option>
                  <option value="intern">Interning</option>
                </select>
              </div>

              <div className="col-md-6 mt-4">
                <label className="form-label">Password</label>
                <input type="password" name="password" minLength="6" className="form-control" required onChange={handleChange} value={form.password} />
              </div>
              <div className="col-md-6 mt-4">
                <label className="form-label">Confirm Password</label>
                <input type="password" name="confirmPassword" minLength="6" className="form-control" required onChange={handleChange} value={form.confirmPassword} />
              </div>

              <div className="d-grid mt-5">
                <button type="submit" className="btn btn-mamcet-red btn-lg d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                  {loading ? <><ClipLoader size={18} color="#fff" /> Sending OTP...</> : 'Send OTP & Continue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSignUp;