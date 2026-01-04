import React from 'react';
import '../../styles/Dashboard.css';

const AdminDashboard = () => {
  return (
    <div className="dashboard-main-bg py-4">
      <div className="container">
        <div className="row g-4">
          {/* இடது பக்கம்: Admin Profile */}
          <div className="col-lg-3">
            <div className="dashboard-card p-3 shadow-sm bg-white text-center">
              <div className="profile-avatar-main mx-auto">A</div>
              <h5 className="fw-bold mt-3">Admin Panel</h5>
              <p className="small text-muted">MAMCET Management</p>
            </div>
          </div>

          {/* நடுப்பகுதி: Activity/Approvals (Figma படி) */}
          <div className="col-lg-6">
            <div className="dashboard-card mb-4 p-3 shadow-sm bg-white">
              <h6 className="fw-bold brand-red-text">PENDING APPROVALS</h6>
              <p className="small">புதிய மாணவர் மற்றும் அலுமினிகளின் பதிவுகளை இங்கே சரிபார்க்கலாம்.</p>
            </div>
          </div>

          {/* வலது பக்கம்: Quick Actions */}
          <div className="col-lg-3">
            <div className="dashboard-card p-3 shadow-sm bg-white">
              <h6 className="fw-bold small mb-3">ADMIN TOOLS</h6>
              <button className="btn btn-light btn-sm w-100 text-start mb-2">Manage Users</button>
              <button className="btn btn-light btn-sm w-100 text-start mb-2">Post Notifications</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;