import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiChevronRight,
} from 'react-icons/fi';

// Map route paths → human-readable page names
const PAGE_TITLES = {
  '/admin/dashboard':  'Dashboard',
  '/admin/analytics':  'Analytics',
  '/admin/alumni':     'Alumni Management',
  '/admin/students':   'Students',
  '/admin/approvals':  'Approvals',
  '/admin/posts':      'Post Moderation',
  '/admin/jobs':       'Job Management',
  '/admin/events':     'Event Management',
  '/admin/landing':    'Landing Page CMS',
  '/admin/settings':   'Settings',
  '/admin/import':     'Bulk Import',
  '/admin/broadcast':  'Notification Broadcast',
};

const AdminTopbar = ({ onToggleSidebar, pendingCount = 0 }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login/admin', { replace: true });
  };

  const uid = user?._id || user?.id;

  return (
    <header className="ap-topbar">
      {/* Hamburger */}
      <button className="ap-topbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <FiMenu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="ap-topbar-breadcrumb">
        <Link to="/admin/dashboard" className="ap-topbar-breadcrumb-home">Admin</Link>
        <FiChevronRight size={13} className="ap-topbar-breadcrumb-sep" />
        <span className="ap-topbar-breadcrumb-page">{pageTitle}</span>
      </div>

      {/* Right actions */}
      <div className="ap-topbar-actions">
        {/* Notifications */}
        <Link to="/notifications" className="ap-topbar-icon-btn" title="Notifications">
          <FiBell size={19} />
          {pendingCount > 0 && <span className="ap-notif-dot" />}
        </Link>

        {/* Profile dropdown */}
        <div className="ap-dropdown-wrap" ref={dropdownRef}>
          <button
            className="ap-profile-btn"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
          >
            <div className="ap-avatar">
              {user?.profilePic
                ? <img src={user.profilePic} alt="admin" />
                : (user?.name?.[0]?.toUpperCase() || 'A')}
            </div>
            <span className="ap-profile-name">{user?.name?.split(' ')[0] || 'Admin'}</span>
          </button>

          {dropdownOpen && (
            <div className="ap-dropdown">
              {/* Header */}
              <div className="ap-dropdown-header">
                <div className="ap-dropdown-name">{user?.name}</div>
                <div className="ap-dropdown-role">Administrator</div>
              </div>

              {/* Items */}
              <Link
                to={`/profile/${uid}`}
                className="ap-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiUser size={15} /> View Profile
              </Link>
              <Link
                to="/admin/settings"
                className="ap-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <FiSettings size={15} /> Settings
              </Link>

              <div className="ap-dropdown-divider" />

              <button className="ap-dropdown-item danger" onClick={handleLogout}>
                <FiLogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
