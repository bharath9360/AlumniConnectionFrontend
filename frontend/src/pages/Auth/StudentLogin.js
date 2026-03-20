import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import '../../styles/Auth.css';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password, 'student');
      const { user, token } = res.data;
      login(user, token);
      navigate('/alumni/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-background d-flex align-items-center justify-content-center">
      <Link to="/login" className="back-btn-circle"><i className="fas fa-arrow-left"></i></Link>
      <div className="form-glass-container p-4 p-md-5">
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="45" alt="MAMCET" />
          <h2 className="login-title">Student Login</h2>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3" role="alert">
            <i className="fas fa-exclamation-circle me-2"></i>{error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Student Email ID</label>
            <input
              type="email"
              className="form-control"
              placeholder="student@mamcet.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-mamcet-red d-flex align-items-center justify-content-center gap-2 w-100" disabled={loading}>
            {loading ? <><ClipLoader size={16} color="#fff" /> Logging in...</> : 'Login'}
          </button>
          <div className="auth-footer-text text-center text-muted">
            Not registered? <Link to="/signup/student" className="text-decoration-none fw-bold" style={{ color: '#c84022' }}>Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;