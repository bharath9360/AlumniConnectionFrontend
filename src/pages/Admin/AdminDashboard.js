import React, { useState } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';

/** * CONFIGURATION: Centralized data, labels, and styles 
 */
const DASHBOARD_CONFIG = {
  TITLES: {
    MAIN: "DASHBOARD",
    SUB: "OVERVIEW"
  },
  COLORS: {
    STUDENTS: '#22d3ee',
    ALUMNI: '#ec4899',
    STAFFS: '#a855f7',
    BG_LIGHT_BLUE: '#f0f9ff',
    BG_LIGHT_PINK: '#fdf2f8'
  },
  LABELS: {
    ALUMNI: "TOTAL ALUMNI",
    STUDENTS: "TOTAL STUDENTS",
    USERS: "TOTAL USERS",
    STAFFS: "STAFFS",
    RECENT_MSG: "Recent Messages",
    PENDING_VERIF: "Pending Verifications",
    MSG_DESC: "Review contact form submissions",
    VERIF_DESC: "Verify new user accounts",
    MSG_SUFFIX: " New Messages",
    USER_SUFFIX: " Users"
  },
  ICONS: {
    MAIL: "✉️",
    USER: "👤"
  }
};

/** * COMPONENT: StatCard 
 * Renders the top numerical summary cards
 */
const StatCard = ({ label, value, bgColor }) => (
  <div className="col-md-3">
    <div className="card shadow-sm border-0 p-4" style={{ backgroundColor: bgColor, borderRadius: '15px' }}>
      <p className="text-muted fw-bold mb-1" style={{ fontSize: '11px' }}>{label}</p>
      <h2 className="fw-bold mb-0">{value}</h2>
    </div>
  </div>
);

/** * COMPONENT: ChartLegendItem 
 * Renders an individual item in the chart legend
 */
const ChartLegendItem = ({ color, label, percentage }) => (
  <div className="mb-3 d-flex align-items-center">
    <span className="me-3" style={{ width: '40px', height: '15px', backgroundColor: color, display: 'inline-block', borderRadius: '2px' }}></span>
    <span className="fw-bold small text-muted">{label} ({percentage}%)</span>
  </div>
);

/** * COMPONENT: UpdateNotificationCard 
 * Renders the wide cards for messages and verifications
 */
const UpdateNotificationCard = ({ tag, title, description, icon, iconBg }) => (
  <div className="card shadow-sm border-0 p-4 mb-4 text-start bg-white border rounded">
    <div className="row align-items-center">
      <div className="col-8">
        <p className="text-danger fw-bold mb-1" style={{ fontSize: '11px' }}>{tag}</p>
        <h6 className="fw-bold mb-1">{title}</h6>
        <p className="text-muted small mb-0">{description}</p>
      </div>
      <div className="col-4 text-end">
        <div className="d-inline-block p-3 rounded" style={{ backgroundColor: iconBg }}>
          <span className="fs-3">{icon}</span>
        </div>
      </div>
    </div>
  </div>
);

/** * MAIN COMPONENT: AdminDashboard 
 */
const AdminDashboard = () => {
  // Data State (Could be fetched from an API)
  const [stats] = useState({
    students: 3504,
    alumni: 1250,
    staffs: 1500,
    totalUsers: 7059,
    recentMessages: 5,
    pendingVerifications: 10
  });

  // Derived Logic for Chart
  const totalForChart = stats.students + stats.alumni + stats.staffs;
  const studentPerc = Math.round((stats.students / totalForChart) * 100);
  const alumniPerc = Math.round((stats.alumni / totalForChart) * 100);
  const staffPerc = 100 - (studentPerc + alumniPerc);

  const pieStyle = {
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: `conic-gradient(
      ${DASHBOARD_CONFIG.COLORS.STUDENTS} 0% ${studentPerc}%, 
      ${DASHBOARD_CONFIG.COLORS.ALUMNI} ${studentPerc}% ${studentPerc + alumniPerc}%, 
      ${DASHBOARD_CONFIG.COLORS.STAFFS} ${studentPerc + alumniPerc}% 100%
    )`,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <AdminNavbar />
      
      <div className="container py-4 text-center">
        <h3 className="fw-bold text-danger mb-1" style={{ letterSpacing: '1px' }}>
          {DASHBOARD_CONFIG.TITLES.MAIN}
        </h3>
        <p className="text-muted small fw-bold mb-5">{DASHBOARD_CONFIG.TITLES.SUB}</p>

        {/* 1. Statistics Row */}
        <div className="row justify-content-center mb-5 g-4">
          <StatCard label={DASHBOARD_CONFIG.LABELS.ALUMNI} value={stats.alumni} bgColor={DASHBOARD_CONFIG.COLORS.BG_LIGHT_BLUE} />
          <StatCard label={DASHBOARD_CONFIG.LABELS.STUDENTS} value={stats.students} bgColor={DASHBOARD_CONFIG.COLORS.BG_LIGHT_BLUE} />
          <StatCard label={DASHBOARD_CONFIG.LABELS.USERS} value={stats.totalUsers} bgColor={DASHBOARD_CONFIG.COLORS.BG_LIGHT_BLUE} />
        </div>

        {/* 2. Visual Chart Section */}
        <div className="row align-items-center justify-content-center mb-5 py-4">
          <div className="col-md-4 d-flex justify-content-center">
            <div style={pieStyle}></div>
          </div>
          <div className="col-md-3 text-start ps-lg-5">
            <ChartLegendItem color={DASHBOARD_CONFIG.COLORS.STUDENTS} label="STUDENTS" percentage={studentPerc} />
            <ChartLegendItem color={DASHBOARD_CONFIG.COLORS.ALUMNI} label="ALUMNI" percentage={alumniPerc} />
            <ChartLegendItem color={DASHBOARD_CONFIG.COLORS.STAFFS} label={DASHBOARD_CONFIG.LABELS.STAFFS} percentage={staffPerc} />
          </div>
        </div>

        {/* 3. Notification/Update Section */}
        <div className="row justify-content-center mt-5">
          <div className="col-md-8">
            <UpdateNotificationCard 
              tag={DASHBOARD_CONFIG.LABELS.RECENT_MSG}
              title={`${stats.recentMessages}${DASHBOARD_CONFIG.LABELS.MSG_SUFFIX}`}
              description={DASHBOARD_CONFIG.LABELS.MSG_DESC}
              icon={DASHBOARD_CONFIG.ICONS.MAIL}
              iconBg={DASHBOARD_CONFIG.COLORS.BG_LIGHT_BLUE}
            />
            <UpdateNotificationCard 
              tag={DASHBOARD_CONFIG.LABELS.PENDING_VERIF}
              title={`${stats.pendingVerifications}${DASHBOARD_CONFIG.LABELS.USER_SUFFIX}`}
              description={DASHBOARD_CONFIG.LABELS.VERIF_DESC}
              icon={DASHBOARD_CONFIG.ICONS.USER}
              iconBg={DASHBOARD_CONFIG.COLORS.BG_LIGHT_PINK}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;