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
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1100,
            pointerEvents: 'none'
        }}>
            {/* d-flex and justify-content-between aligns everything */}
            <div className="container-fluid d-flex align-items-center justify-content-between px-4" style={{ height: '70px', pointerEvents: 'auto' }}>

                {/* 1. Left Side: Space for Main Navbar Logo (Empty Space) */}
                <div style={{ flex: 1 }}></div>

                {/* 2. Middle Section: Menus centered (Center Section) */}
                <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                    <ul className="navbar-nav flex-row align-items-center gap-5">
                        <li className="nav-item"><Link to="/admin/home" style={navLinkStyle('/admin/home')}>HOME</Link></li>
                        <li className="nav-item"><Link to="/admin/post" style={navLinkStyle('/admin/post')}>POST</Link></li>
                        <li className="nav-item"><Link to="/admin/alumni" style={navLinkStyle('/admin/alumni')}>ALUMNI</Link></li>
                        <li className="nav-item"><Link to="/admin/dashboard" style={navLinkStyle('/admin/dashboard')}>DASHBOARD</Link></li>
                    </ul>
                </div>

                {/* 3. Right Side: Search and Admin Profile (Right Section) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} className="gap-3">
                    <div className="input-group border rounded-pill bg-light px-3 py-1" style={{ width: '200px' }}>
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

                    <div className="d-flex align-items-center border-start ps-3">
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
    );
};


export default AdminNavbar;