import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiUsers, FiUserCheck, FiFileText, FiBriefcase,
  FiCalendar, FiGlobe, FiSettings, FiLogOut, FiShield,
  FiBarChart2, FiUploadCloud, FiBell, FiArrowLeft, FiHome,
} from 'react-icons/fi';

// ── Navigation items ──────────────────────────────────────────
const NAV_ITEMS = [
  {
    section: 'Main',
    items: [
      { label: 'Analytics', icon: FiBarChart2, to: '/admin/analytics' },
    ],
  },
  {
    section: 'User Management',
    items: [
      { label: 'Alumni',       icon: FiUserCheck,  to: '/admin/alumni' },
      { label: 'Students',     icon: FiUsers,      to: '/admin/students' },
      { label: 'Groups',       icon: FiUsers,      to: '/admin/groups' },
      { label: 'Approvals',    icon: FiShield,     to: '/admin/approvals', badgeKey: 'pendingApprovals' },
      { label: 'Bulk Import',  icon: FiUploadCloud,to: '/admin/import' },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Posts',     icon: FiFileText,  to: '/admin/posts' },
      { label: 'Jobs',      icon: FiBriefcase, to: '/admin/jobs' },
      { label: 'Events',    icon: FiCalendar,  to: '/admin/events' },
      { label: 'Broadcast', icon: FiBell,      to: '/admin/broadcast' },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Landing Page', icon: FiGlobe,    to: '/admin/landing' },
      { label: 'Settings',     icon: FiSettings, to: '/admin/settings' },
    ],
  },
];

const AdminSidebar = ({ collapsed, mobileOpen, pendingCount = 0, onMobileClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login/admin', { replace: true });
  };

  const sidebarClass = [
    'ap-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Sidebar */}
      <aside className={sidebarClass}>
        {/* Logo */}
        <div className="ap-sidebar-logo">
          <div className="ap-sidebar-logo-icon">🛡️</div>
          <div>
            <div className="ap-sidebar-logo-text">Admin Panel</div>
            <div className="ap-sidebar-badge">MAMCET Connect</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ap-nav">
          {NAV_ITEMS.map(({ section, items }) => (
            <div key={section}>
              <div className="ap-nav-section-label">{section}</div>
              {items.map(({ label, icon: Icon, to, badgeKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `ap-nav-item${isActive ? ' active' : ''}`
                  }
                  onClick={onMobileClose}
                  title={collapsed ? label : undefined}
                >
                  <span className="ap-nav-item-icon">
                    <Icon size={16} />
                  </span>
                  <span className="ap-nav-item-label">{label}</span>
                  {badgeKey === 'pendingApprovals' && pendingCount > 0 && (
                    <span className="ap-nav-badge">{pendingCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="ap-sidebar-footer">
          {/* Mini profile */}
          <div
            className="ap-nav-item"
            style={{ marginBottom: 4, cursor: 'default', background: 'rgba(255,255,255,0.04)' }}
            title={collapsed ? user?.name : undefined}
          >
            <div className="ap-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {user?.profilePic
                ? <img src={user.profilePic} alt="admin" />
                : (user?.name?.[0]?.toUpperCase() || 'A')}
            </div>
            <div className="ap-nav-item-label" style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Administrator</div>
            </div>
          </div>

          {/* Back button */}
          <button
            className="ap-nav-item"
            style={{ width: '100%', border: 'none', textAlign: 'left' }}
            onClick={() => navigate(-1)}
            title={collapsed ? 'Go Back' : undefined}
          >
            <span className="ap-nav-item-icon"><FiArrowLeft size={15} /></span>
            <span className="ap-nav-item-label" style={{ color: 'rgba(255,255,255,0.65)' }}>Go Back</span>
          </button>

          {/* Home button */}
          <button
            className="ap-nav-item"
            style={{ width: '100%', border: 'none', textAlign: 'left' }}
            onClick={() => navigate('/')}
            title={collapsed ? 'Main Site' : undefined}
          >
            <span className="ap-nav-item-icon"><FiHome size={15} /></span>
            <span className="ap-nav-item-label" style={{ color: 'rgba(255,255,255,0.65)' }}>Main Site</span>
          </button>

          {/* Logout */}
          <button
            className="ap-nav-item"
            style={{ width: '100%', border: 'none', textAlign: 'left' }}
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
          >
            <span className="ap-nav-item-icon"><FiLogOut size={15} /></span>
            <span className="ap-nav-item-label" style={{ color: 'rgba(255,130,100,0.9)' }}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
