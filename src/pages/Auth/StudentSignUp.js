import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

const StudentSignUp = () => {
  const [presentStatus, setPresentStatus] = useState('');

  return (
    <div className="signup-background py-5">
      <Link to="/register" className="back-btn-circle" title="Back to Selection">
        <i className="fas fa-arrow-left"></i>
      </Link>

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4 p-md-5">
          <div className="text-center mb-5">
            <div className="brand-logo-container mb-3">
              <span className="ms-2 brand-name-red">ALUMNI CONNECT</span>
            </div>
            <h2 className="fw-bold">Join Our Student Network</h2>
          </div>

          <form className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="Your full name" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email ID</label>
              <input type="email" className="form-control" placeholder="you@example.com" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-control" placeholder="Your phone number" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Degree & Branch</label>
              <input type="text" className="form-control" placeholder="e.g., B.E. CSE" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Graduation Year</label>
              <input type="number" className="form-control" placeholder="e.g., 2026" required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Roll No / Register No</label>
              <input type="text" className="form-control" placeholder="College roll number" />
            </div>

            <div className="col-12 mt-4 pt-3 border-top">
              <label className="form-label fw-bold">Current Status</label>
              <select className="form-select" value={presentStatus} onChange={(e) => setPresentStatus(e.target.value)}>
                <option value="">Choose...</option>
                <option value="student">Currently Studying</option>
                <option value="intern">Interning</option>
              </select>
            </div>

            <div className="col-md-6 mt-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" required />
            </div>
            <div className="col-md-6 mt-4">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" required />
            </div>

            <div className="d-grid mt-5">
              <button type="submit" className="btn btn-mamcet-red btn-lg">Create Account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentSignUp;