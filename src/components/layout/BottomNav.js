import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navigationConfig, getUserRoleKey } from '../../config/navigationConfig';
import '../../styles/Navbar.css';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();

    const isLandingPage = path === '/';
    const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
    const isDashboard = user && !isLandingPage && !isAuthPage && !path.startsWith('/admin');

    if (!isDashboard) return null;

    const roleKey = getUserRoleKey(user);
    const navItems = (navigationConfig[roleKey] || []).filter(item => item.label !== 'Messaging');

    return (
        <div className="bottom-nav d-lg-none shadow-lg border-top fixed-bottom bg-white d-flex justify-content-around align-items-center py-2" style={{ height: '60px' }}>
            {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = path === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="nav-item text-center text-decoration-none"
                        style={{ color: isActive ? '#c84022' : '#6c757d' }}
                    >
                        {IconComponent && <IconComponent size={24} />}
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
