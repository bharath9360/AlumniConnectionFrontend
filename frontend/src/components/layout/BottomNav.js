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
    const isDashboard = user && !isLandingPage && !isAuthPage;

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
                        className="nav-item text-center text-decoration-none d-flex flex-column align-items-center"
                        style={{ color: isActive ? '#c84022' : '#6c757d', minWidth: '44px' }}
                    >
                        {IconComponent && <IconComponent size={22} />}
                        <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
