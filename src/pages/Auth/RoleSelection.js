import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

/**
 * RoleSelection Component
 * Allows users to select their specific role (Admin, Alumni, Student) 
 * before proceeding to the registration form.
 */
const RoleSelection = () => {
  return (
    <div className="auth-body d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-card text-center p-5 shadow-lg">
        <h1 className="h3 fw-bold mb-4">SELECT YOUR ROLE</h1>
        <div className="d-grid gap-3">
          <Link to="/signup/admin" className="btn btn-role-select">
            <i className="fas fa-user-shield me-2"></i> ADMIN
          </Link>
          <Link to="/signup/alumni" className="btn btn-role-select">
            <i className="fas fa-user-graduate me-2"></i> ALUMNI
          </Link>
          <Link to="/signup/student" className="btn btn-role-select">
            <i className="fas fa-users me-2"></i> STUDENT
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;