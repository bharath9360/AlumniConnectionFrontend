import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

const AdminLogin = () => {
  return (
    <div className="signup-background d-flex align-items-center justify-content-center">
      <Link to="/login" className="back-btn-circle"><i className="fas fa-arrow-left"></i></Link>
      <div className="form-glass-container p-4 p-md-5">
        <div className="text-center mb-4">
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="45" alt="MAMCET" />
          <h2 className="login-title">Admin Login</h2>
        </div>
        <form>
          <div className="mb-3">
            <label className="form-label">Admin ID</label>
            <input type="text" className="form-control" placeholder="Enter admin id" required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" placeholder="••••••••" required />
          </div>
          <div className="mb-4">
            <label className="form-label">Secret Key</label>
            <input type="password" className="form-control" placeholder="Verification key" required />
          </div>
          <button type="submit" className="btn-mamcet-red">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;