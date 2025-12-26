import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

/**
 * Updated Navbar Component
 * 1. Landing Page: Public links (About, Contact, Login, Register)
 * 2. Auth Pages: Brand Only (No buttons)
 * 3. Logged-in Dashboard: Professional Icons (Home, Jobs, Events, Gallery)
 */
const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  // Conditions for different views
  const isLandingPage = path === '/';
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
  const isDashboard = path.startsWith('/alumni') || path.startsWith('/jobs') || path.startsWith('/events');

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">
        {/* Left Side: Brand Identity (Always Visible) */}
        <Link className="navbar-brand d-flex align-items-center" to={isDashboard ? "/alumni/home" : "/"}>
          <img 
            src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
            alt="MAMCET Logo" 
            className="logo-img me-2" 
            style={{ width: '45px' }}
          />
          <span className="fw-bold brand-name-red" style={{ color: '#c84022' }}>ALUMNI CONNECT</span>
        </Link>

        {/* 1. Landing Page Menu */}
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

        {/* 2. Dashboard Menu (Visible after Login) */}
        {isDashboard && !isAuthPage && (
          <div className="collapse navbar-collapse d-flex justify-content-end" id="dashboardNav">
            <ul className="navbar-nav align-items-center flex-row">
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/alumni/home">
                  <i className="fas fa-home d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Home</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0 active" to="/jobs">
                  <i className="fas fa-briefcase d-block mb-1 fs-5" style={{color: '#c84022'}}></i>
                  <span className="extra-small fw-bold">Jobs</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/events">
                  <i className="fas fa-calendar-alt d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Events</span>
                </Link>
              </li>
              <li className="nav-item mx-3 text-center">
                <Link className="nav-link p-0" to="/gallery">
                  <i className="fas fa-images d-block mb-1 fs-5"></i>
                  <span className="extra-small fw-bold">Gallery</span>
                </Link>
              </li>
              <li className="nav-item ms-4">
                <Link to="/" className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3">Logout</Link>
              </li>
            </ul>
          </div>
        )}

        {/* Note: If isAuthPage is true, nothing will be rendered here (Just Brand) */}
      </div>
    </nav>
  );
};

export default Navbar;