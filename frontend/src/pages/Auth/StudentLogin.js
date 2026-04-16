import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';
import { handleError } from '../../utils/errorHandler';
import { ClipLoader } from 'react-spinners';
import '../../styles/Auth.css';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]             = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Show pending banner if redirected back from ProtectedRoute
  useEffect(() => {
    if (location.state?.pendingApproval) {
      setPendingApproval(true);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);
    try {
      const res = await authService.login(email, password, 'student');
      const { user, token } = res.data;
      login(user, token);
      // Bulk-imported user: tempPassword matched → needsPasswordChange=true.
      // Navigate to dashboard so ActivationModal (globally mounted) can intercept.
      if (user.needsPasswordChange) {
        navigate(`/student/home/${user._id || user.id}`);
      } else if (user.status !== 'Pending') {
        navigate(`/student/home/${user._id || user.id}`);
      }
      // else: self-registered Pending user → stay on page, show pendingApproval banner
    } catch (err) {
      const data = err.response?.data;
      if (data?.pendingApproval) {
        setPendingApproval(true);
      } else {
        const msg = handleError(err);
        setError(msg);
        toast.error(msg);
      }
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

        {pendingApproval && (
          <div className="alert py-2 small mb-3" role="alert"
            style={{ background: '#fff8e1', border: '1px solid #ffc107', color: '#856404', borderRadius: 8 }}>
            <i className="fas fa-clock me-2"></i>
            <strong>Pending Approval.</strong> Your account is awaiting admin review.
            You'll receive an email once it's activated.
          </div>
        )}
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