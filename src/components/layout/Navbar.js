// src/components/layout/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  const isLandingPage = path === '/';
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
  const isDashboard = path.startsWith('/alumni') || path.startsWith('/jobs') || path.startsWith('/events') || path.startsWith('/messaging') || path.startsWith('/notifications');

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to={isDashboard ? "/alumni/home" : "/"}>
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="Logo" style={{ width: '45px' }} className="me-2" />
          <span className="fw-bold brand-name-red" style={{ color: '#c84022' }}>ALUMNI CONNECT</span>
        </Link>

        {isLandingPage && (
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item"><Link className="nav-link mx-2 fw-semibold" to="/about">About</Link></li>
              <li className="nav-item"><Link className="nav-link mx-2 fw-semibold" to="/contact">Contact</Link></li>
              <li className="nav-item ms-lg-3"><Link to="/login" className="btn btn-outline-secondary me-2 px-4">Log In</Link></li>
              <li className="nav-item"><Link to="/register" className="btn btn-custom-red text-white px-4" style={{ backgroundColor: '#c84022' }}>Register</Link></li>
            </ul>
          </div>
        )}

        {isDashboard && !isAuthPage && (
          <div className="collapse navbar-collapse d-flex justify-content-end">
            <ul className="navbar-nav align-items-center flex-row">
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/alumni/home">
                  <i className="fas fa-home d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Home</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/jobs">
                  <i className="fas fa-briefcase d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Jobs</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/events">
                  <i className="fas fa-calendar-alt d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Events</span>
                </Link>
              </li>
              {/* Notifications instead of Gallery */}
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/notifications">
                  <i className="fas fa-bell d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Notifications</span>
                </Link>
              </li>
              {/* New Messaging/Chatting Icon */}
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/messaging">
                  <i className="fas fa-comment-dots d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Messaging</span>
                </Link>
              </li>
              <li className="nav-item ms-4">
                <Link to="/" className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3">Logout</Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;