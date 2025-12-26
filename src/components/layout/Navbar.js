import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  // Dummy login state - later replace with Auth Context
  const isLoggedIn = location.pathname.startsWith('/alumni/home'); 

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to={isLoggedIn ? "/alumni/home" : "/"}>
          <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" alt="Logo" className="logo-img me-2" style={{width: '45px'}} />
          <span className="fw-bold brand-name-red" style={{color: '#c84022'}}>ALUMNI CONNECT</span>
        </Link>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center">
            {!isLoggedIn ? (
              // Public Links
              <>
                <li className="nav-item"><Link className="nav-link" to="/about">About</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
                <li className="nav-item ms-lg-3"><Link to="/login" className="btn btn-outline-secondary me-2">Log In</Link></li>
                <li className="nav-item"><Link to="/register" className="btn btn-custom-red text-white" style={{backgroundColor: '#c84022'}}>Register</Link></li>
              </>
            ) : (
              // Alumni Dashboard Links (Professional Icons)
              <>
                <li className="nav-item mx-2 text-center">
                  <Link className="nav-link" to="/alumni/home"><i className="fas fa-home d-block"></i><span className="small">Home</span></Link>
                </li>
                <li className="nav-item mx-2 text-center">
                  <Link className="nav-link" to="/jobs"><i className="fas fa-briefcase d-block"></i><span className="small">Jobs</span></Link>
                </li>
                <li className="nav-item mx-2 text-center">
                  <Link className="nav-link" to="/events"><i className="fas fa-calendar-alt d-block"></i><span className="small">Events</span></Link>
                </li>
                <li className="nav-item mx-2 text-center">
                  <Link className="nav-link" to="/gallery"><i className="fas fa-images d-block"></i><span className="small">Gallery</span></Link>
                </li>
                <li className="nav-item ms-lg-4">
                  <div className="d-flex align-items-center">
                    <img src="https://via.placeholder.com/35" className="rounded-circle me-2" alt="profile" />
                    <button className="btn btn-sm btn-outline-danger">Logout</button>
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;