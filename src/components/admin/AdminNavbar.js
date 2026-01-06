import React from 'react';

const AdminNavbar = () => {
  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-4 py-3">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1 fw-bold text-dark">Overview Dashboard</span>
        <div className="d-flex align-items-center">
            <div className="me-3 position-relative" style={{cursor: 'pointer'}}>
                 <i className="fas fa-bell fs-5 text-secondary"></i>
                 <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
            </div>
            <span className="text-muted small me-2">Welcome,</span>
            <span className="fw-bold brand-red-text">Admin</span>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;