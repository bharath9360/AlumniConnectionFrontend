import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminNavbar = () => {
    const location = useLocation();
    const [search, setSearch] = useState("");

    const navLinkStyle = (path) => ({
        color: location.pathname === path ? '#b22222' : '#555',
        fontWeight: 'bold',
        textDecoration: 'none',
        fontSize: '14px',
        borderBottom: location.pathname === path ? '3px solid #b22222' : 'none',
        paddingBottom: '2px',
        transition: '0.3s'
    });

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm px-3 mb-3">
            <div className="container-fluid">

                {/* Brand / Logo */}
                <Link className="navbar-brand d-flex align-items-center" to="/admin/home">
                    <span className="fw-bold" style={{ color: '#b22222', letterSpacing: '1px' }}>ADMIN PANEL</span>
                </Link>

                {/* Navbar Toggler for Mobile */}
                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#adminNavbarContent"
                    aria-controls="adminNavbarContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Collapsible Content */}
                <div className="collapse navbar-collapse" id="adminNavbarContent">

                    {/* Middle Section: Menus */}
                    <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-4 text-center">
                        <li className="nav-item"><Link className="nav-link py-2" to="/admin/home" style={navLinkStyle('/admin/home')}>HOME</Link></li>
                        <li className="nav-item"><Link className="nav-link py-2" to="/admin/post" style={navLinkStyle('/admin/post')}>POST</Link></li>
                        <li className="nav-item"><Link className="nav-link py-2" to="/admin/alumni" style={navLinkStyle('/admin/alumni')}>ALUMNI</Link></li>
                        <li className="nav-item"><Link className="nav-link py-2" to="/admin/dashboard" style={navLinkStyle('/admin/dashboard')}>DASHBOARD</Link></li>
                    </ul>

                    {/* Right Side: Search and Admin Profile */}
                    <div className="d-flex flex-column flex-lg-row align-items-center gap-3 mt-3 mt-lg-0">
                        <div className="input-group border rounded-pill bg-light px-3 py-1" style={{ width: '100%', maxWidth: '250px' }}>
                            <span className="bg-transparent border-0 mt-1"><i className="fas fa-search text-muted small"></i></span>
                            <input
                                type="text"
                                className="form-control border-0 bg-transparent shadow-none"
                                placeholder="SEARCH MESSAGES..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ fontSize: '11px' }}
                            />
                        </div>

                        <div className="d-flex align-items-center border-start-lg ps-lg-3 border-top border-lg-0 pt-3 pt-lg-0 w-100 justify-content-center justify-content-lg-start">
                            <span className="fw-bold me-2" style={{ color: '#b22222', fontSize: '13px' }}>ADMIN</span>
                            <div className="rounded-circle overflow-hidden border" style={{ width: '35px', height: '35px' }}>
                                <img
                                    src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
                                    alt="AdminAvatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </nav>
    );
};


export default AdminNavbar;