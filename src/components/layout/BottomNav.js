import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storage } from '../../utils/storage';
import '../../styles/Navbar.css';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        setUserData(storage.getCurrentUser());
    }, []);

    const isDashboard = path.startsWith('/alumni') || path.startsWith('/jobs') || path.startsWith('/events') || path.startsWith('/messaging') || path.startsWith('/notifications') || path.startsWith('/profile');

    if (!isDashboard || !userData) return null;

    const navItems = [
        { path: '/alumni/home', icon: 'fa-home', label: 'Home' },
        { path: '/jobs', icon: 'fa-briefcase', label: 'Jobs' },
        { path: '/events', icon: 'fa-calendar-alt', label: 'Events' },
        { path: '/messaging', icon: 'fa-comment-dots', label: 'Messaging' },
        { path: '/notifications', icon: 'fa-bell', label: 'Notifications' }
    ];

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
