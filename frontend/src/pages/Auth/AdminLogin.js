import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import '../../styles/Auth.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '', secretKey: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(credentials.email, credentials.password, 'admin');
      const { user, token } = res.data;
      login(user, token);
      navigate('/admin/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials or role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background d-flex align-items-center justify-content-center min-vh-100">
      <Link to="/login" className="back-btn-circle"><i className="fas fa-arrow-left"></i></Link>
      <div className="form-glass-container p-4 p-md-5">
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="45" alt="MAMCET" />
          <h2 className="login-title">Admin Login</h2>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Admin Email</label>
            <input
              type="email" name="email" className="form-control"
              placeholder="admin@mamcet.com" required
              onChange={handleChange} disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password" name="password" className="form-control"
              placeholder="••••••••" required
              onChange={handleChange} disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Secret Key</label>
            <input
              type="password" name="secretKey" className="form-control"
              placeholder="Verification key" required
              onChange={handleChange} disabled={loading}
            />
          </div>
          <button type="submit" className="btn-mamcet-red d-flex align-items-center justify-content-center gap-2 w-100" disabled={loading}>
            {loading ? <><ClipLoader size={16} color="#fff" /> Verifying...</> : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;