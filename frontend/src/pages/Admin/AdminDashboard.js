import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';

const DASHBOARD_CONFIG = {
  TITLES: { MAIN: "DASHBOARD", SUB: "OVERVIEW" },
  COLORS: {
    STUDENTS: '#22d3ee',
    ALUMNI: '#ec4899',
    STAFFS: '#a855f7',
    BG_LIGHT_BLUE: '#f0f9ff',
    BG_LIGHT_PINK: '#fdf2f8'
  },
  LABELS: { ALUMNI: "PENDING ALUMNI", STUDENTS: "PENDING JOBS", USERS: "TOTAL USERS" }
};

const StatCard = ({ label, value, bgColor }) => (
  <div className="col-md-4">
    <div className="card shadow-sm border-0 p-4 text-center h-100" style={{ backgroundColor: bgColor, borderRadius: '15px' }}>
      <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px' }}>{label}</p>
      <h2 className="fw-bold mb-0" style={{ color: '#c84022' }}>{value}</h2>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingAlumni: 0,
    pendingJobs: 0,
    pendingEvents: 0,
    totalPosts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        if (res.data?.data) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch admin stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#fff' }}>
        <ClipLoader color="#c84022" size={50} />
      </div>
    );
  }

  const totalPending = stats.pendingAlumni + stats.pendingJobs + stats.pendingEvents;

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <div className="container py-5 text-center" style={{ maxWidth: '900px' }}>
        <h3 className="fw-bold text-danger mb-1" style={{ letterSpacing: '1px' }}>
          {DASHBOARD_CONFIG.TITLES.MAIN}
        </h3>
        <p className="text-muted small fw-bold mb-5">{DASHBOARD_CONFIG.TITLES.SUB}</p>

        {/* Statistics Row */}
        <div className="row justify-content-center mb-5 g-4">
          <StatCard label="TOTAL PLATFORM USERS" value={stats.totalUsers} bgColor={DASHBOARD_CONFIG.COLORS.BG_LIGHT_BLUE} />
          <StatCard label="TOTAL SUBMITTED POSTS" value={stats.totalPosts} bgColor={DASHBOARD_CONFIG.COLORS.BG_LIGHT_PINK} />
          <StatCard label="ITEMS AWAITING APPROVAL" value={totalPending} bgColor="#fff3cd" />
        </div>

        {/* Action/Notification Section */}
        <div className="row justify-content-center mt-5">
          <div className="col-md-8 text-center p-5 bg-light rounded-4 shadow-sm border">
            <h4 className="fw-bold mb-3">Moderation Hub</h4>
            <p className="text-muted mb-4">
              You have <strong>{stats.pendingAlumni}</strong> alumni registrations, <strong>{stats.pendingJobs}</strong> job postings, and <strong>{stats.pendingEvents}</strong> events waiting for your review.
            </p>
            <Link to="/admin/approvals" className="btn btn-lg text-white rounded-pill px-5 fw-bold shadow-sm" style={{ backgroundColor: '#c84022' }}>
              <i className="fas fa-tasks me-2"></i> Open Approval Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;