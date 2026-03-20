import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import '../../styles/Auth.css';

/**
 * AdminSignUp Component
 * Specialized registration for administrative users.
 */
const AdminSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', secretKey: ''
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
      await authService.register({ ...form, role: 'admin' });
      toast.success('Admin Created Successfully! Please login.');
      setTimeout(() => navigate('/login/admin'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin creation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background py-5">
      <Link to="/register" className="back-btn-circle">
        <i className="fas fa-arrow-left"></i>
      </Link>
      <Toaster position="top-center" />

      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="form-glass-container p-4 p-md-5" style={{ maxWidth: '500px' }}>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Admin Creation</h2>
            <p className="text-muted">Create a new administrative account</p>
          </div>

          {error && <div className="alert alert-danger py-2 small mb-3"><i className="fas fa-exclamation-circle me-2"></i>{error}</div>}

          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <label className="form-label">Admin Name</label>
              <input type="text" name="name" className="form-control" required onChange={handleChange} value={form.name} />
            </div>
            <div className="col-12">
              <label className="form-label">Official Email ID</label>
              <input type="email" name="email" className="form-control" required onChange={handleChange} value={form.email} />
            </div>
            <div className="col-12">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" minLength="6" required onChange={handleChange} value={form.password} />
            </div>
            <div className="col-12">
              <label className="form-label">Confirm Password</label>
              <input type="password" name="confirmPassword" className="form-control" minLength="6" required onChange={handleChange} value={form.confirmPassword} />
            </div>
            <div className="col-12 mt-4 pt-4 border-top">
              <label className="form-label text-danger fw-bold">Admin Secret Key</label>
              <input type="password" name="secretKey" className="form-control" placeholder="Security verification key" required onChange={handleChange} value={form.secretKey} />
              <small className="text-muted">Provided by the system administrator.</small>
            </div>

            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-dark btn-lg d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                {loading ? <><ClipLoader size={18} color="#fff" /> Authorizing...</> : 'Authorize & Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignUp;