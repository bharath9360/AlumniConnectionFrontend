import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

/**
 * Navbar Component
 * Links "About" and "Contact" to their respective routes.
 * Menu is hidden on Auth pages to match the professional design.
 */
const Navbar = () => {
  const location = useLocation();

  // Auth paths where we only show the logo
  const isAuthPage = 
    location.pathname.startsWith('/login') || 
    location.pathname.startsWith('/register') || 
    location.pathname.startsWith('/signup');

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">
        {/* Brand Logo & Name - Always Linked to Home */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img 
            src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
            alt="MAMCET Logo" 
            className="logo-img me-2" 
            style={{ width: '45px' }}
          />
          <span className="fw-bold brand-name-red" style={{ color: '#c84022' }}>ALUMNI CONNECT</span>
        </Link>

        {/* Navigation Links - Hidden on Auth Pages */}
        {!isAuthPage && (
          <>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto align-items-center">
                <li className="nav-item">
                  <Link className="nav-link mx-2" to="/about">About</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link mx-2" to="/contact">Contact</Link>
                </li>
                <li className="nav-item ms-lg-3">
                  <Link to="/login" className="btn btn-outline-secondary me-2">Log In</Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="btn btn-custom-red text-white" style={{ backgroundColor: '#c84022' }}>Register</Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;