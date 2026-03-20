import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navigationConfig, getUserRoleKey } from '../../config/navigationConfig';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { FaSignOutAlt, FaSearch, FaCommentDots } from 'react-icons/fa';
import '../../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { user, userRole, logout } = useAuth();
  const roleKey = getUserRoleKey(user);

  const isLandingPage = path === '/';
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
  const isDashboard = user && !isLandingPage && !isAuthPage;

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const dashboardNavItems = navigationConfig[userRole] || [];
  const guestNavItems = navigationConfig.guest || [];

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm px-2 px-md-3 mb-3">
      <div className="container-fluid d-flex align-items-center">

        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center flex-grow-1 flex-md-grow-0" to={user ? (roleKey === 'admin' ? "/admin/home" : "/alumni/home") : "/"}>
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="Logo" style={{ width: '40px' }} className="me-2 d-none d-lg-inline" />
          <span className="fw-bold brand-name-red d-none d-lg-inline" style={{ color: roleKey === 'admin' ? '#b22222' : '#c84022', letterSpacing: roleKey === 'admin' ? '1px' : '0' }}>
            {roleKey === 'admin' ? 'ADMIN PANEL' : 'ALUMNI CONNECT'}
          </span>
        </Link>

        {/* Mobile Messaging Icon */}
        {user && isDashboard && (
          <Link to="/messaging" className="d-lg-none ms-auto text-decoration-none me-2" style={{ color: roleKey === 'admin' ? '#b22222' : '#c84022' }}>
            <FaCommentDots size={24} />
          </Link>
        )}

        <div className="collapse navbar-collapse justify-content-end text-center mt-3 mt-lg-0" id="navbarNav">

          {/* Unauthenticated / Guest Routing */}
          {(!user || isLandingPage) && (
            <ul className="navbar-nav ms-auto align-items-center gap-3 gap-lg-0">
              {(navigationConfig.guest || []).map(item => (
                <li className="nav-item" key={item.path}>
                  <Link className="nav-link mx-2 fw-semibold d-flex align-items-center justify-content-center" to={item.path}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="nav-item ms-lg-3 mt-2 mt-lg-0"><Link to="/login" className="btn btn-outline-secondary px-4 w-100 w-lg-auto">Log In</Link></li>
              <li className="nav-item mt-2 mt-lg-0 ms-lg-2"><Link to="/register" className="btn btn-custom-red text-white px-4 w-100 w-lg-auto" style={{ backgroundColor: '#c84022' }}>Register</Link></li>
            </ul>
          )}

          {/* Authenticated Dashboard Routing */}
          {user && isDashboard && (
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-3 gap-lg-4 text-center align-items-center">
              {dashboardNavItems.map(item => {
                const IconComponent = item.icon;
                const isActive = path === item.path || path.startsWith(item.path + '/');
                return (
                  <li className="nav-item" key={item.path}>
                    <Link
                      className={`nav-link py-2 d-flex flex-column align-items-center ${isActive ? 'active-nav-item' : ''}`}
                      to={item.path}
                      style={{
                        color: isActive ? '#b22222' : '#555',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        borderBottom: isActive ? '3px solid #b22222' : 'none',
                        transition: '0.2s',
                        paddingBottom: '2px'
                      }}
                    >
                      {IconComponent && <IconComponent className="mb-1" size={18} />}
                      <span className="text-uppercase" style={{ fontSize: '11px' }}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* User Controls (Search & Profile/Logout) for authenticated users */}
          {user && isDashboard && (
            <div className="d-flex flex-column flex-lg-row align-items-center gap-3 mt-3 mt-lg-0 pb-3 pb-lg-0 border-top border-lg-0 pt-3 pt-lg-0">

              {/* Profile Overview (Desktop) & Logout */}
              <div className="d-flex align-items-center border-start-lg ps-lg-3 w-100 justify-content-center justify-content-lg-start gap-3">

                {/* Notification Dropdown */}
                <NotificationDropdown />

                <span className="fw-bold me-2 text-uppercase d-none d-lg-block" style={{ color: userRole === 'admin' ? '#b22222' : '#c84022', fontSize: '13px' }}>
                  {userRole}
                </span>

                <Link to={userRole === 'admin' ? "/admin/profile" : "/alumni/profile"} className="rounded-circle overflow-hidden border d-none d-lg-block text-decoration-none" style={{ width: '35px', height: '35px', backgroundColor: '#eee' }}>
                  {user?.profilePic ? (
                    <img
                      src={user.profilePic}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center w-100 h-100 fw-bold text-secondary">
                      {user?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </Link>

                <button onClick={handleLogout} className="btn btn-sm btn-link text-danger ms-lg-2 d-flex align-items-center gap-1 text-decoration-none" title="Logout">
                  <FaSignOutAlt size={16} /> <span className="d-lg-none">Logout</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
