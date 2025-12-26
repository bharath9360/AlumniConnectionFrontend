import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

const StudentLogin = () => {
  return (
    <div className="signup-background d-flex align-items-center justify-content-center">
      <Link to="/login" className="back-btn-circle"><i className="fas fa-arrow-left"></i></Link>
      <div className="form-glass-container p-4 p-md-5">
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="45" alt="MAMCET" />
          <h2 className="login-title">Student Login</h2>
        </div>
        <form>
          <div className="mb-3">
            <label className="form-label">Student Roll Number</label>
            <input type="text" className="form-control" placeholder="Enter your roll no" required />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-mamcet-red">Login</button>
          <div className="auth-footer-text text-center text-muted">
            Not registered? <Link to="/signup/student" className="text-decoration-none fw-bold" style={{color: '#c84022'}}>Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentLogin;