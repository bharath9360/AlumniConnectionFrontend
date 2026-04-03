import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useMessage } from '../../context/MessageContext';
import { navigationConfig, getUserRoleKey } from '../../config/navigationConfig';
import NotificationDropdown from '../notifications/NotificationDropdown';
import { FaSignOutAlt, FaCommentDots, FaBars, FaTimes } from 'react-icons/fa';
import '../../styles/Navbar.css';

const LOGO_URL =
  'https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png';

// ─── tiny reusable avatar ─────────────────────────────────────
const Avatar = ({ user, size = 38 }) => {
  const { resolveImageUrl } = useAuth();
  const picUrl = resolveImageUrl(user?.profilePic || '');

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        backgroundColor: '#eee',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.15)',
      }}
    >
      {picUrl ? (
        <img
          src={picUrl}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.4, color: '#c84022' }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
};

// ─── component ───────────────────────────────────────────────
const Navbar = () => {
  const location  = useLocation();
  const path      = location.pathname;
  const navigate  = useNavigate();
  const { user, userRole, logout } = useAuth();
  useSocket(); // keep socket alive — unreadCount for bell still used by NotificationDropdown internally
  const { totalUnreadCount = 0 } = useMessage();
  const roleKey   = getUserRoleKey(user);

  // used for the pre‑login mobile menu
  const [isOpen, setIsOpen] = useState(false);

  const isLandingPage = path === '/';
  const isAuthPage    = path.startsWith('/login') ||
                        path.startsWith('/register') ||
                        path.startsWith('/signup') ||
                        path.startsWith('/role-selection');
  const isDashboard   = !!user && !isLandingPage && !isAuthPage;

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const brandColor     = roleKey === 'admin' ? '#b22222' : '#c84022';
  const brandLabel     = roleKey === 'admin' ? 'ADMIN PANEL' : 'ALUMNI CONNECT';
  const dashboardHome  = roleKey === 'admin' ? `/admin/home/${user?._id || user?.id}` : roleKey === 'student' ? `/student/home/${user?._id || user?.id}` : `/alumni/home/${user?._id || user?.id}`;
  const dashboardItems = navigationConfig[userRole] || [];

  /* ─────────────────────────────────────────────────────────── *
   *  RENDER                                                       *
   * ─────────────────────────────────────────────────────────── */
  return (
    <nav className="navbar navbar-light bg-white sticky-top shadow-sm mb-3"
         style={{ padding: '0 12px' }}>

      <div className="d-flex align-items-center w-100" style={{ minHeight: 56 }}>

        {/* ═══════════════════════════════════════════════════ *
         *  LEFT SECTION                                         *
         * ═══════════════════════════════════════════════════ */}
        <div className="d-flex align-items-center" style={{ flex: '0 0 auto' }}>

          {/* POST‑LOGIN MOBILE: avatar FIRST (far left), then logo */}
          {user && isDashboard && (
            <Link
              to={`/profile/${user._id || user.id}`}
              className="d-lg-none text-decoration-none me-2"
            >
              <Avatar user={user} size={38} />
            </Link>
          )}

          {/* brand logo — hidden on mobile when logged in (avatar takes its place) */}
          <Link
            className={`navbar-brand d-flex align-items-center m-0 p-0 ${
              user && isDashboard ? 'd-none d-lg-flex' : 'd-flex'
            }`}
            to={user ? dashboardHome : '/'}
          >
            <img
              src={LOGO_URL}
              alt="MAMCET Alumni Connect"
              style={{ width: 38, height: 38, objectFit: 'contain' }}
            />
            {/* brand text: hidden on xs; always visible sm+ */}
            <span
              className="fw-bold ms-2 d-none d-sm-inline"
              style={{ color: brandColor, fontSize: 14, letterSpacing: roleKey === 'admin' ? 1 : 0 }}
            >
              {brandLabel}
            </span>
          </Link>
        </div>

        {/* spacer */}
        <div className="flex-grow-1" />

        {/* ═══════════════════════════════════════════════════ *
         *  RIGHT SECTION — depends on auth state               *
         * ═══════════════════════════════════════════════════ */}

        {/* ── GUEST (not logged in) ── */}
        {!user && (
          <>
            {/* Desktop: About / Contact links + Login / Register */}
            <div className="d-none d-lg-flex align-items-center gap-3">
              {(navigationConfig.guest || []).map(item => (
                <Link key={item.path} className="nav-link fw-semibold" to={item.path}>
                  {item.label}
                </Link>
              ))}
              {/* Hide Login/Register on auth pages and landing page */}
              {!isAuthPage && !isLandingPage && (
                <>
                  <Link to="/login" className="btn btn-outline-secondary px-3 rounded-pill" style={{ fontSize: 13 }}>
                    Log In
                  </Link>
                  <Link to="/register" className="btn text-white px-3 rounded-pill" style={{ backgroundColor: brandColor, fontSize: 13 }}>
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: hamburger toggle (About/Contact open in drawer below) */}
            <button
              className="btn border-0 shadow-none d-lg-none"
              onClick={() => setIsOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </>
        )}

        {/* ── LOGGED IN — desktop only right controls ── */}
        {user && isDashboard && (
          <div className="d-none d-lg-flex align-items-center gap-3">
            {dashboardItems
              .filter(item => !item.isNotification)   /* NotificationDropdown below handles this */
              .map(item => {
              const itemPath = item.noUserId
                ? item.path
                : `${item.path}/${user?._id || user?.id}`;
              const Icon     = item.icon;
              const isActive = path === itemPath || path.startsWith(itemPath + '/');
              return (
                <Link
                  key={item.path}
                  to={itemPath}
                  className="d-flex flex-column align-items-center text-decoration-none position-relative"
                  style={{
                    color: isActive ? '#b22222' : '#555',
                    fontWeight: 700,
                    borderBottom: isActive ? '3px solid #b22222' : '3px solid transparent',
                    paddingBottom: 2,
                    fontSize: 11,
                    transition: '0.2s',
                  }}
                >
                  <div className="position-relative">
                    {Icon && <Icon size={18} className="mb-1" />}
                    {item.isMessaging && totalUnreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.5rem', padding: '0.2em 0.4em', minWidth: 14, lineHeight: 1.4, fontWeight: 700 }}
                      >
                        {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-uppercase">{item.label}</span>
                </Link>
              );
            })}

            <NotificationDropdown />

            <Link
              to={`/profile/${user?._id || user?.id}`}
              className="text-decoration-none"
            >
              <Avatar user={user} size={34} />
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-sm btn-link text-danger p-0 ms-1"
              title="Logout"
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
        )}

        {/* ── LOGGED IN — mobile chat icon (top nav only) ── */}
        {user && isDashboard && (
          <div className="d-lg-none d-flex align-items-center gap-2 ms-2">
            <Link
              to="/messages"
              className="text-decoration-none position-relative"
              style={{ color: brandColor }}
              aria-label="Messages"
            >
              <FaCommentDots size={22} />
              {totalUnreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.5rem', padding: '0.2em 0.4em', minWidth: 14, lineHeight: 1.4, fontWeight: 700 }}
                >
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </span>
              )}
            </Link>
          </div>
        )}

        {/* ── LOGGED IN on landing/auth page — "Go to Dashboard" button ── */}
        {user && !isDashboard && (
          <Link
            to={dashboardHome}
            className="btn text-white px-3 fw-bold rounded-pill"
            style={{ backgroundColor: brandColor, fontSize: 13 }}
          >
            Dashboard
          </Link>
        )}

      </div>{/* /d-flex */}

      {/* ══════════════════════════════════════════════════════════ *
       *  MOBILE DRAWER — pre‑login only                            *
       *  Appears below the header row when hamburger is toggled     *
       * ══════════════════════════════════════════════════════════ */}
      {!user && isOpen && (
        <div
          className="d-lg-none pb-3 border-top mt-2"
          style={{ width: '100%' }}
        >
          <ul className="navbar-nav text-center gap-2 mt-2">
            {(navigationConfig.guest || []).map(item => (
              <li className="nav-item" key={item.path}>
                <Link
                  className="nav-link fw-semibold"
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {/* Hide Login/Register on auth pages and landing page */}
            {!isAuthPage && !isLandingPage && (
              <>
                <li className="nav-item mt-1">
                  <Link
                    to="/login"
                    className="btn btn-outline-secondary w-100 rounded-pill"
                    onClick={() => setIsOpen(false)}
                  >
                    Log In
                  </Link>
                </li>
                <li className="nav-item mt-1">
                  <Link
                    to="/register"
                    className="btn text-white w-100 rounded-pill"
                    style={{ backgroundColor: brandColor }}
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      )}

    </nav>
  );
};

export default Navbar;
