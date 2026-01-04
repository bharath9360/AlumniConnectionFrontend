import React from 'react';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
  return (
    <div className="dashboard-main-bg py-4">
      <div className="container">
        <div className="row g-4">
          {/* Left: Admin Info */}
          <div className="col-lg-3">
            <div className="dashboard-card profile-card text-center p-3 shadow-sm bg-white">
              <div className="profile-avatar-main mx-auto">A</div>
              <h5 className="fw-bold mt-3">MAMCET Admin</h5>
              <p className="small text-muted">Management Portal</p>
            </div>
          </div>
          {/* Middle: Figma Model Approvals */}
          <div className="col-lg-6">
            <div className="dashboard-card p-4 shadow-sm bg-white mb-3">
              <h6 className="fw-bold brand-red-text">PENDING REGISTRATIONS</h6>
              <hr />
              <div className="d-flex justify-content-between align-items-center p-3 border rounded">
                <span>New Alumni: Rajesh K (2022 Batch)</span>
                <div>
                   <button className="btn btn-sm btn-success me-2">Approve</button>
                   <button className="btn btn-sm btn-outline-danger">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;