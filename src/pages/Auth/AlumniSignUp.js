import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

/**
 * AlumniSignUp Component
 * Features dynamic fields for Job, Entrepreneur, and Higher Studies status.
 * Data mapped from MAMCET Alumni requirements.
 */
const AlumniSignUp = () => {
  const [presentStatus, setPresentStatus] = useState('');

  return (
    <div className="signup-background py-4">
      <Link to="/register" className="back-btn-circle" title="Back to Selection">
        <i className="fas fa-arrow-left"></i>
      </Link>

      <div className="container d-flex justify-content-center">
        <div className="form-glass-container p-4">
          <div className="text-center mb-4">
            <div className="brand-logo-container mb-2">
              <img 
                src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
                alt="MAMCET Logo" 
                className="auth-logo" 
              />
              <span className="ms-2 brand-name-red">ALUMNI CONNECT</span>
            </div>
            <h4 className="fw-bold">Alumni Registration</h4>
            <p className="text-muted small">Enter your details to join the network</p>
          </div>

          <form className="row g-3">
            {/* Personal Details Section */}
            <div className="col-md-6">
              <label className="form-label small fw-bold">Full Name</label>
              <input type="text" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-6">
              <label className="form-label small d-block fw-bold">Gender</label>
              <div className="form-check form-check-inline pt-1">
                <input className="form-check-input" type="radio" name="gender" value="male" required />
                <label className="form-check-label small">Male</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="gender" value="female" required />
                <label className="form-check-label small">Female</label>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold">Email ID</label>
              <input type="email" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Phone Number</label>
              <input type="tel" className="form-control form-control-sm" required />
            </div>

            {/* Academic Details Section */}
            <div className="col-md-4">
              <label className="form-label small fw-bold">Department</label>
              <select className="form-select form-select-sm" required>
                <option value="">Choose...</option>
                <option value="AI & DS">AI & DS</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Degree</label>
              <input type="text" className="form-control form-control-sm" placeholder="e.g., B.E." required />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">Batch (Passout Year)</label>
              <input type="text" className="form-control form-control-sm" placeholder="e.g., 2020" required />
            </div>

            {/* Address Details Section */}
            <div className="col-md-8">
              <label className="form-label small fw-bold">Residential Address</label>
              <input type="text" className="form-control form-control-sm" />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold">City</label>
              <input type="text" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">State</label>
              <input type="text" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Zip Code</label>
              <input type="text" className="form-control form-control-sm" required />
            </div>

            {/* Present Status & Conditional Fields Section */}
            <div className="col-12 mt-3 pt-2 border-top">
              <label className="form-label small fw-bold">Present Professional Status</label>
              <select 
                className="form-select form-select-sm" 
                value={presentStatus} 
                onChange={(e) => setPresentStatus(e.target.value)}
                required
              >
                <option value="">Select current activity...</option>
                <option value="working">Job / Working Professional</option>
                <option value="entrepreneur">Entrepreneur / Business Owner</option>
                <option value="student">Higher Studies / Student</option>
              </select>
            </div>

            {/* Conditional Fields: Working */}
            {presentStatus === 'working' && (
              <>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Company Name</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Designation</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Work Location</label>
                  <input type="text" className="form-control form-control-sm" />
                </div>
              </>
            )}

            {/* Conditional Fields: Entrepreneur */}
            {presentStatus === 'entrepreneur' && (
              <>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Business / Startup Name</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Nature of Business</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
              </>
            )}

            {/* Conditional Fields: Higher Studies */}
            {presentStatus === 'student' && (
              <>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Institution / University Name</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Course / Degree Pursuing</label>
                  <input type="text" className="form-control form-control-sm" required />
                </div>
              </>
            )}

            {/* Account Security Section */}
            <div className="col-md-6 mt-2 pt-2 border-top">
              <label className="form-label small fw-bold">Create Password</label>
              <input type="password" minLength="6" className="form-control form-control-sm" required />
            </div>
            <div className="col-md-6 mt-2 pt-2 border-top">
              <label className="form-label small fw-bold">Confirm Password</label>
              <input type="password" minLength="6" className="form-control form-control-sm" required />
            </div>

            <div className="d-grid mt-4">
              <button type="submit" className="btn btn-mamcet-red btn-md fw-bold">
                SUBMIT REGISTRATION
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AlumniSignUp;