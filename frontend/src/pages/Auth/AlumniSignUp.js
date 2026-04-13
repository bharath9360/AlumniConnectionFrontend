import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';

import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import '../../styles/Auth.css';

// ── OTP Verification Screen ───────────────────────────────────────────────────
const OTPScreen = ({ email, onSuccess, onBack }) => {
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, otp);
      if (res.data.pendingApproval) {
        onSuccess(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await authService.resendOtp(email);
      toast.success('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="signup-background d-flex align-items-center justify-content-center">
      <Toaster position="top-center" />
      <div className="form-glass-container p-4 p-md-5" style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="MAMCET Logo" width={45} />
          <h4 className="fw-bold mt-3">Verify Your Email</h4>
          <p className="text-muted small">
            We sent a 6-digit OTP to <strong>{email}</strong>.<br />
            Please enter it below to continue.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="fas fa-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <label className="form-label fw-bold">Enter OTP</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-control form-control-lg text-center"
              style={{ letterSpacing: '0.5rem', fontWeight: 700, fontSize: '1.4rem' }}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="——————"
              required
              autoFocus
            />
            <div className="d-flex justify-content-end mt-2">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none"
                style={{ color: '#c84022', fontSize: 13 }}
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Resending…' : 'Resend OTP'}
              </button>
            </div>
          </div>

          <div className="d-grid gap-2">
            <button
              type="submit"
              className="btn btn-mamcet-red fw-bold d-flex align-items-center justify-content-center gap-2"
              disabled={loading || otp.length !== 6}
            >
              {loading ? <><ClipLoader size={16} color="#fff" /> Verifying…</> : 'Verify & Submit'}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onBack}>
              ← Back to form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Success Screen ─────────────────────────────────────────────────────────────
const SuccessScreen = ({ message }) => (
  <div className="signup-background d-flex align-items-center justify-content-center">
    <div className="form-glass-container p-4 p-md-5 text-center" style={{ maxWidth: 420 }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: '#fff5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, margin: '0 auto 20px'
      }}>⏳</div>
      <h4 className="fw-bold mb-3">Registration Submitted!</h4>
      <p className="text-muted small mb-4">{message}</p>
      <div
        className="alert small mb-4"
        style={{ background: '#fff8e1', border: '1px solid #ffc107', color: '#856404', borderRadius: 10 }}
      >
        <i className="fas fa-info-circle me-2"></i>
        Your account will be activated once an admin reviews and approves it. You'll receive an email after approval.
      </div>
      <Link to="/login/alumni" className="btn btn-mamcet-red fw-bold w-100">
        Go to Login
      </Link>
    </div>
  </div>
);

// ── Main Registration Form ────────────────────────────────────────────────────
const AlumniSignUp = () => {
  const [step, setStep]       = useState('form');   // 'form' | 'otp' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '', gender: '', email: '', phone: '',
    department: '', degree: '', batch: '',
    address: '', city: '', state: '', zipCode: '',
    presentStatus: '',
    company: '', designation: '', workLocation: '',
    businessName: '', natureOfBusiness: '',
    institutionName: '', coursePursuing: '',
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
      // FLOW 1 Step 1: register → backend sends OTP, not creating user yet
      await authService.register({ ...form, role: 'alumni' });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (message) => {
    setSuccessMsg(message);
    setStep('success');
  };

  if (step === 'otp') {
    return (
      <OTPScreen
        email={form.email}
        onSuccess={handleOTPSuccess}
        onBack={() => setStep('form')}
      />
    );
  }
  if (step === 'success') {
    return <SuccessScreen message={successMsg} />;
  }

  return (
    <div className="signup-background py-4">
      <Link to="/register" className="back-btn-circle" title="Back to Selection">
        <i className="fas fa-arrow-left"></i>
      </Link>
      <Toaster position="top-center" />

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4">
          <div className="text-center mb-4">
            <div className="brand-logo-container mb-2">
              <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="MAMCET Logo" className="auth-logo" />
              <span className="ms-2 brand-name-red">ALUMNI CONNECT</span>
            </div>
            <h4 className="fw-bold">Alumni Registration</h4>
            <p className="text-muted small">Enter your details to join the network</p>
          </div>

          {error && <div className="alert alert-danger py-2 small mb-3"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}

          <form className="row g-3" onSubmit={handleSubmit}>
            {/* Personal */}
            <div className="col-md-6">
              <label className="form-label small fw-bold">Full Name</label>
              <input type="text" name="name" className="form-control form-control-sm" required onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label small d-block fw-bold">Gender</label>
              <div className="form-check form-check-inline pt-1">
                <input className="form-check-input" type="radio" name="gender" value="male" onChange={handleChange} required />
                <label className="form-check-label small">Male</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="gender" value="female" onChange={handleChange} />
                <label className="form-check-label small">Female</label>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Email ID</label>
              <input type="email" name="email" className="form-control form-control-sm" required onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Phone Number</label>
              <input type="tel" name="phone" className="form-control form-control-sm" required onChange={handleChange} />
            </div>

            {/* Academic */}
            <div className="col-md-4">
              <label className="form-label small fw-bold">Department</label>
              <select name="department" className="form-select form-select-sm" required onChange={handleChange}>
                <option value="">Choose...</option>
                <option>AI &amp; DS</option><option>CSE</option><option>IT</option>
                <option>ECE</option><option>EEE</option><option>MECH</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Degree</label>
              <input type="text" name="degree" className="form-control form-control-sm" placeholder="e.g., B.E." required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Batch (Passout Year)</label>
              <input type="text" name="batch" className="form-control form-control-sm" placeholder="e.g., 2024" required onChange={handleChange} />
            </div>

            {/* Address */}
            <div className="col-md-8">
              <label className="form-label small fw-bold">Residential Address</label>
              <input type="text" name="address" className="form-control form-control-sm" onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">City</label>
              <input type="text" name="city" className="form-control form-control-sm" required onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">State</label>
              <input type="text" name="state" className="form-control form-control-sm" required onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Zip Code</label>
              <input type="text" name="zipCode" className="form-control form-control-sm" onChange={handleChange} />
            </div>

            {/* Status */}
            <div className="col-12 mt-3 pt-2 border-top">
              <label className="form-label small fw-bold">Present Professional Status</label>
              <select name="presentStatus" className="form-select form-select-sm" value={form.presentStatus} onChange={handleChange} required>
                <option value="">Select current activity...</option>
                <option value="working">Job / Working Professional</option>
                <option value="entrepreneur">Entrepreneur / Business Owner</option>
                <option value="student">Higher Studies / Student</option>
              </select>
            </div>

            {form.presentStatus === 'working' && (
              <>
                <div className="col-md-4"><label className="form-label small fw-bold">Company Name</label><input type="text" name="company" className="form-control form-control-sm" required onChange={handleChange} /></div>
                <div className="col-md-4"><label className="form-label small fw-bold">Designation</label><input type="text" name="designation" className="form-control form-control-sm" required onChange={handleChange} /></div>
                <div className="col-md-4"><label className="form-label small fw-bold">Work Location</label><input type="text" name="workLocation" className="form-control form-control-sm" onChange={handleChange} /></div>
              </>
            )}
            {form.presentStatus === 'entrepreneur' && (
              <>
                <div className="col-md-6"><label className="form-label small fw-bold">Business Name</label><input type="text" name="businessName" className="form-control form-control-sm" required onChange={handleChange} /></div>
                <div className="col-md-6"><label className="form-label small fw-bold">Nature of Business</label><input type="text" name="natureOfBusiness" className="form-control form-control-sm" required onChange={handleChange} /></div>
              </>
            )}
            {form.presentStatus === 'student' && (
              <>
                <div className="col-md-6"><label className="form-label small fw-bold">Institution / University</label><input type="text" name="institutionName" className="form-control form-control-sm" required onChange={handleChange} /></div>
                <div className="col-md-6"><label className="form-label small fw-bold">Course Pursuing</label><input type="text" name="coursePursuing" className="form-control form-control-sm" required onChange={handleChange} /></div>
              </>
            )}

            {/* Password */}
            <div className="col-md-6 mt-2 pt-2 border-top">
              <label className="form-label small fw-bold">Create Password</label>
              <input type="password" name="password" minLength="6" className="form-control form-control-sm" required onChange={handleChange} />
            </div>
            <div className="col-md-6 mt-2 pt-2 border-top">
              <label className="form-label small fw-bold">Confirm Password</label>
              <input type="password" name="confirmPassword" minLength="6" className="form-control form-control-sm" required onChange={handleChange} />
            </div>

            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-mamcet-red btn-md fw-bold d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                {loading ? <><ClipLoader size={16} color="#fff" /> Sending OTP…</> : 'CONTINUE →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AlumniSignUp;