import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // States for Dynamic Data
    const [search, setSearch] = useState("");
    const [profile, setProfile] = useState({ name: "Loading...", avatar: "" });

    // 1. Navigation Config (Easily updatable via API or Array)
    const navConfig = [
        { id: 'home', label: 'HOME', path: '/admin/home' },
        { id: 'post', label: 'POST', path: '/admin/post' },
        { id: 'alumni', label: 'ALUMNI', path: '/admin/alumni' },
        { id: 'dashboard', label: 'DASHBOARD', path: '/admin/dashboard' },
    ];

    // 2. Profile API Call Simulation
    useEffect(() => {
        // Mocking API call
        setTimeout(() => {
            setProfile({
                name: "ADMIN",
                avatar: "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
            });
        }, 1000);
    }, []);

    // 3. Reusable Style Function
    const getLinkStyle = (path) => ({
        color: location.pathname === path ? '#b22222' : '#555',
        fontWeight: 'bold',
        textDecoration: 'none',
        fontSize: '14px',
        borderBottom: location.pathname === path ? '3px solid #b22222' : 'none',
        paddingBottom: '2px',
        transition: '0.3s'
    });

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1100,
            backgroundColor: '#fff', borderBottom: '1px solid #eee'
        }}>
            <div className="container-fluid d-flex align-items-center justify-content-between px-4" style={{ height: '70px' }}>

                {/* LEFT: Messaging Button (Dynamic Action) */}
                <div style={{ flex: 1 }}>
                    <button 
                        onClick={() => navigate('/admin/messages')}
                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                    >
                        <i className="fas fa-comment-dots me-2"></i> MESSAGING
                    </button>
                </div>

                {/* MIDDLE: List Mapping (No hardcoded tags) */}
                <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                    <ul className="nav gap-5">
                        {navConfig.map((item) => (
                            <li key={item.id} className="nav-item">
                                <Link to={item.path} style={getLinkStyle(item.path)}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* RIGHT: Search & Profile */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} className="gap-3">
                    
                    {/* Clickable Search Group */}
                    <div className="input-group border rounded-pill bg-light px-3 py-1" style={{ width: '200px' }}>
                        <span 
                            style={{ cursor: 'pointer' }} 
                            onClick={() => navigate(`/admin/search?q=${search}`)}
                            className="mt-1"
                        >
                            <i className="fas fa-search text-muted small"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-0 bg-transparent shadow-none"
                            placeholder="SEARCH..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ fontSize: '11px' }}
                        />
                    </div>

                    {/* Profile Section */}
                    <div className="d-flex align-items-center border-start ps-3">
                        <span className="fw-bold me-2" style={{ color: '#b22222', fontSize: '13px' }}>
                            {profile.name}
                        </span>
                        <div className="rounded-circle overflow-hidden border" style={{ width: '35px', height: '35px' }}>
                            <img src={profile.avatar} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    </div>
                </div>

            </div>
        </nav>
    );
};

export default AdminNavbar;