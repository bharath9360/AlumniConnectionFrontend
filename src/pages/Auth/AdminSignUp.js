import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

/**
 * AdminSignUp Component
 * Specialized registration for administrative users.
 */
const AdminSignUp = () => {
  return (
    <div className="signup-background py-5">
      <Link to="/register" className="back-btn-circle">
        <i className="fas fa-arrow-left"></i>
      </Link>

      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="form-glass-container p-4 p-md-5" style={{ maxWidth: '500px' }}>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Admin Creation</h2>
            <p className="text-muted">Create a new administrative account</p>
          </div>

          <form className="row g-3">
            <div className="col-12">
              <label className="form-label">Admin Name</label>
              <input type="text" className="form-control" required />
            </div>
            <div className="col-12">
              <label className="form-label">Official Email ID</label>
              <input type="email" className="form-control" required />
            </div>
            <div className="col-12">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required />
            </div>
            <div className="col-12">
              <label className="form-label">Admin Secret Key</label>
              <input type="password" className="form-control" placeholder="Security verification key" required />
            </div>

            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-dark btn-lg">Authorize & Create</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSignUp;