// src/components/layout/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storage } from '../../utils/storage';
import '../../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    setUserData(storage.getCurrentUser());
  }, []);

  const isLandingPage = path === '/';
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
  const isDashboard = path.startsWith('/alumni') || path.startsWith('/jobs') || path.startsWith('/events') || path.startsWith('/messaging') || path.startsWith('/notifications') || path.startsWith('/profile');

  const handleLogout = (e) => {
    e.preventDefault();
    storage.logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm px-2 px-md-0">
      <div className="container d-flex align-items-center">

        {/* Mobile Profile Toggle - LinkedIn Style */}
        {isDashboard && userData && (
          <Link to="/alumni/profile" className="d-lg-none navbar-mobile-profile">
            <div className="avatar-xs bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
              {userData.profilePic ? <img src={userData.profilePic} alt="Me" className="nav-profile-img" /> : (userData.name?.[0] || "?")}
            </div>
          </Link>
        )}

        <Link className="navbar-brand d-flex align-items-center flex-grow-1 flex-md-grow-0" to={isDashboard ? "/alumni/home" : "/"}>
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="Logo" style={{ width: '40px' }} className="me-2 d-none d-sm-inline" />
          <span className="fw-bold brand-name-red" style={{ color: '#c84022' }}>ALUMNI CONNECT</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="collapse navbar-collapse d-none d-lg-flex justify-content-end" id="navbarNav">
          {isLandingPage && (
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><Link className="nav-link mx-2 fw-semibold" to="/about">About</Link></li>
              <li className="nav-item"><Link className="nav-link mx-2 fw-semibold" to="/contact">Contact</Link></li>
              <li className="nav-item ms-lg-3"><Link to="/login" className="btn btn-outline-secondary me-2 px-4">Log In</Link></li>
              <li className="nav-item"><Link to="/register" className="btn btn-custom-red text-white px-4" style={{ backgroundColor: '#c84022' }}>Register</Link></li>
            </ul>
          )}

          {isDashboard && !isAuthPage && (
            <ul className="navbar-nav align-items-center flex-row">
              <li className="nav-item mx-3 text-center">
                <Link className={`nav-link p-0 ${path === '/alumni/home' ? 'text-mamcet-red' : ''}`} to="/alumni/home">
                  <i className="fas fa-home d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Home</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className={`nav-link p-0 ${path === '/jobs' ? 'text-mamcet-red' : ''}`} to="/jobs">
                  <i className="fas fa-briefcase d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Jobs</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className={`nav-link p-0 ${path === '/events' ? 'text-mamcet-red' : ''}`} to="/events">
                  <i className="fas fa-calendar-alt d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Events</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className={`nav-link p-0 ${path === '/notifications' ? 'text-mamcet-red' : ''}`} to="/notifications">
                  <i className="fas fa-bell d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Notifications</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className={`nav-link p-0 ${path === '/messaging' ? 'text-mamcet-red' : ''}`} to="/messaging">
                  <i className="fas fa-comment-dots d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Messaging</span>
                </Link>
              </li>
              <li className="nav-item ms-4">
                <button onClick={handleLogout} className="btn btn-sm btn-pro btn-pro-outline btn-pro-sm text-danger border-danger">Logout</button>
              </li>
            </ul>
          )}
        </div>

        {/* Small Search Icon for Mobile */}
        {isDashboard && (
          <button className="btn btn-link text-muted d-lg-none">
            <i className="fas fa-search"></i>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
