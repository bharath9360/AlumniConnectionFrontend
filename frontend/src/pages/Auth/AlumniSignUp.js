import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import '../../styles/Auth.css';

const AlumniSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await authService.register({ ...form, role: 'alumni' });
      toast.success('Registration Successful! Please login.');
      setTimeout(() => navigate('/login/alumni'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                {loading ? <><ClipLoader size={16} color="#fff" /> Submitting...</> : 'SUBMIT REGISTRATION'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AlumniSignUp;