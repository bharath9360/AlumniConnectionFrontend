import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { navigationConfig, getUserRoleKey } from '../../config/navigationConfig';
import '../../styles/Navbar.css';

const BottomNav = () => {
    const location = useLocation();
    const path = location.pathname;
    const { user } = useAuth();

    const { unreadCount = 0 } = useNotifications();                    // bell badge (notifications)

    const isLandingPage = path === '/';
    const isAuthPage = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/signup');
    const isDashboard = user && !isLandingPage && !isAuthPage;

    if (!isDashboard) return null;

    const roleKey  = getUserRoleKey(user);
    // Filter out isMessaging items — Messages lives in the top navbar only
    const navItems = (navigationConfig[roleKey] || []).filter(item => !item.isMessaging);

    return (
        <div
            className="bottom-nav d-lg-none shadow-lg border-top fixed-bottom bg-white d-flex justify-content-around align-items-center py-2"
            style={{ height: '60px' }}
        >
            {navItems.map((item) => {
                const isNotifItem = item.isNotification;
                const to = isNotifItem
                    ? '/notifications'
                    : item.noUserId
                        ? item.path
                        : `${item.path}/${user?._id || user?.id}`;

                const IconComponent = item.icon;
                const isActive = path === to || path.startsWith(item.path);

                return (
                    <Link
                        key={item.path}
                        to={to}
                        className="nav-item text-center text-decoration-none d-flex flex-column align-items-center position-relative"
                        style={{ color: isActive ? '#c84022' : '#6c757d', minWidth: '44px' }}
                    >
                        <div className="position-relative d-inline-block">
                            {IconComponent && <IconComponent size={22} />}

                            {/* Bell badge: non-message notifications */}
                            {isNotifItem && unreadCount > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.55rem', padding: '0.22em 0.44em', minWidth: 16, lineHeight: 1.4, fontWeight: 700 }}
                                >
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '9px', marginTop: '2px', fontWeight: isActive ? 700 : 500 }}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;
