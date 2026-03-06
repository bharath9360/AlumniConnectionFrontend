import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navigationConfig, getUserRoleKey } from '../../config/navigationConfig';
import '../../styles/Navbar.css';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();

    const isDashboard = path.startsWith('/alumni') || path.startsWith('/jobs') || path.startsWith('/events') || path.startsWith('/messaging') || path.startsWith('/notifications') || path.startsWith('/profile');

    if (!isDashboard || !user || path.startsWith('/admin')) return null;

    const roleKey = getUserRoleKey(user);
    const navItems = navigationConfig[roleKey] || [];

    return (
        <div className="bottom-nav d-lg-none shadow-lg border-top fixed-bottom bg-white d-flex justify-content-around align-items-center py-2">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-item text-center text-decoration-none ${path === item.path ? 'text-mamcet-red' : 'text-muted'}`}
                >
                    <i className={`fas ${item.icon} d-block fs-5`}></i>
                    <span className="extra-small fw-bold">{item.label}</span>
                </Link>
            ))}
        </div>
    );
};

export default BottomNav;
