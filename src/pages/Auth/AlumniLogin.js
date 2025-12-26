import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const AlumniLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Professional hardcoded authentication for testing
    if (email === 'alumni@mamcet.com' && password === 'alumni@123') {
      navigate('/alumni/home'); // Redirect to Alumni Dashboard
    } else {
      alert('Invalid Credentials! Use alumni@mamcet.com / alumni@123');
    }
  };

  return (
    <div className="signup-background d-flex align-items-center justify-content-center">
      <Link to="/login" className="back-btn-circle"><i className="fas fa-arrow-left"></i></Link>
      <div className="form-glass-container p-4 p-md-5">
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="45" alt="MAMCET" />
          <h2 className="login-title">Alumni Login</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Alumni Email ID</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="alumni@mamcet.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="alumni@123" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-mamcet-red">Login</button>
          <div className="auth-footer-text text-center text-muted">
            New here? <Link to="/signup/alumni" className="text-decoration-none fw-bold" style={{color: '#c84022'}}>Create Account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlumniLogin;