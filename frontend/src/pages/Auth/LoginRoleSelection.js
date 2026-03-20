import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

/**
 * LoginRoleSelection Component
 * The first screen displayed after clicking "Log In" on the navbar.
 * Allows users to choose their role before presenting the specific login form.
 */
const LoginRoleSelection = () => {
  return (
    // Reusing existing Auth styles for consistency
    <div className="auth-body d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-card text-center p-5 shadow-lg">
         <div className="brand-logo-container mb-4 justify-content-center">
              <img 
                src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
                alt="MAMCET Logo" 
                className="auth-logo" 
                style={{width: '50px'}}
              />
            </div>
        <h3 className="fw-bold mb-2">WELCOME BACK!</h3>
        <p className="text-muted mb-4">Please select your role to login</p>
        
        <div className="d-grid gap-3">
          {/* Links pointing to specific login pages */}
          <Link to="/login/student" className="btn btn-role-select d-flex align-items-center">
            <i className="fas fa-user-graduate fa-lg me-3 text-secondary"></i> 
            <span className="fw-bold">STUDENT LOGIN</span>
          </Link>
          <Link to="/login/alumni" className="btn btn-role-select d-flex align-items-center">
            <i className="fas fa-user-tie fa-lg me-3 text-secondary"></i> 
            <span className="fw-bold">ALUMNI LOGIN</span>
          </Link>
          <Link to="/login/admin" className="btn btn-role-select d-flex align-items-center">
            <i className="fas fa-user-shield fa-lg me-3 text-secondary"></i> 
            <span className="fw-bold">ADMIN LOGIN</span>
          </Link>
        </div>

        <div className="mt-4 text-muted small">
          Don't have an account yet? <Link to="/register" className="brand-name-red text-decoration-none fw-bold">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginRoleSelection;