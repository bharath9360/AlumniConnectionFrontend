// src/components/layout/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img 
            src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
            alt="Logo" 
            className="rounded-circle me-2" 
            style={{ width: '45px' }} 
          />
          <span className="fw-bold" style={{ color: '#c84022' }}>ALUMNI CONNECT</span>
        </Link>
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
              <Link to="/register" className="btn btn-custom-red" style={{ backgroundColor: '#c84022', color: 'white' }}>Register</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;