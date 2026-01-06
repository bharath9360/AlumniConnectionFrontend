import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="admin-sidebar bg-dark text-white d-flex flex-column p-3">
      <Link to="/admin/dashboard" className="d-flex align-items-center mb-4 text-white text-decoration-none brand-section">
        <img src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" width="40" alt="Logo" className="me-2" />
        <span className="fs-5 fw-bold">Admin Panel</span>
      </Link>
      
      <hr className="text-secondary" />
      
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-2">
          <NavLink to="/admin/dashboard" className="nav-link text-white" aria-current="page">
            <i className="fas fa-tachometer-alt me-3 width-20"></i> Dashboard
          </NavLink>
        </li>
        <li className="nav-item mb-2">
          {/* Link to existing create event page */}
          <NavLink to="/admin/create-event" className="nav-link text-white">
            <i className="fas fa-calendar-plus me-3 width-20"></i> Events
          </NavLink>
        </li>
        <li className="nav-item mb-2">
          <NavLink to="/admin/jobs" className="nav-link text-white">
             <i className="fas fa-briefcase me-3 width-20"></i> Jobs & Internships
          </NavLink>
        </li>
        <li className="nav-item mb-2">
          <NavLink to="/admin/mentorship" className="nav-link text-white">
            <i className="fas fa-hands-helping me-3 width-20"></i> Mentorship
          </NavLink>
        </li>
         <li className="nav-item mb-2">
          <NavLink to="/admin/gallery" className="nav-link text-white">
            <i className="fas fa-images me-3 width-20"></i> Gallery Manager
          </NavLink>
        </li>
      </ul>
      
      <hr className="text-secondary" />
      
      <div className="dropdown">
        <Link to="/" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
          <div className="avatar-sm bg-danger text-white me-2">A</div>
          <strong>MAMCET Admin</strong>
        </Link>
        <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
          <li><Link className="dropdown-item" to="/admin/settings">Settings</Link></li>
          <li><hr className="dropdown-divider" /></li>
          <li><Link className="dropdown-item" to="/">Sign out</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;