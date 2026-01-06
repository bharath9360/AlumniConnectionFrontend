import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ adminId: '', password: '', secretKey: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Temporary Hardcoded Authentication logic
    if (
      credentials.adminId === 'admin@mamcet.com' &&
      credentials.password === 'admin@123' &&
      credentials.secretKey === '12345'
    ) {
      // Successful login
      navigate('/admin/dashboard');
    } else {
      alert('Invalid Admin Credentials or Secret Key!');
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
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Admin ID</label>
            <input 
              type="text" name="adminId" className="form-control" placeholder="Enter admin id" required 
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" name="password" className="form-control" placeholder="••••••••" required 
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="form-label">Secret Key</label>
            <input 
              type="password" name="secretKey" className="form-control" placeholder="Verification key" required 
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-mamcet-red">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;