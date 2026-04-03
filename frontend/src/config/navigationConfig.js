import {
    FaHome,
    FaLayerGroup,
    FaBell,
    FaChartLine,
    FaClipboardCheck,
    FaInfoCircle,
    FaEnvelope,
    FaBriefcase,
    FaUserFriends,
    FaCommentDots
} from 'react-icons/fa';

export const navigationConfig = {
    alumni: [
        { path: '/alumni/home',    icon: FaHome,         label: 'Home'          },
        { path: '/network',        icon: FaUserFriends,  label: 'Network',       noUserId: true },
        { path: '/opportunities',  icon: FaLayerGroup,   label: 'Opportunities', noUserId: true },
        { path: '/messages',       icon: FaCommentDots,  label: 'Messages',      noUserId: true, isMessaging: true },
        { path: '/notifications',  icon: FaBell,         label: 'Notifications', noUserId: true, isNotification: true },
    ],
    admin: [
        { path: '/admin/home',       icon: FaHome,           label: 'Home'      },
        { path: '/admin/approvals',  icon: FaClipboardCheck, label: 'Approvals' },
        { path: '/admin/dashboard',  icon: FaChartLine,      label: 'Stats'     },
        { path: '/notifications',    icon: FaBell,           label: 'Alerts',   noUserId: true, isNotification: true },
    ],
    student: [
        { path: '/student/home',   icon: FaHome,         label: 'Home'          },
        { path: '/network',        icon: FaUserFriends,  label: 'Network',       noUserId: true },
        { path: '/opportunities',  icon: FaBriefcase,    label: 'Opportunities', noUserId: true },
        { path: '/messages',       icon: FaCommentDots,  label: 'Messages',      noUserId: true, isMessaging: true },
        { path: '/notifications',  icon: FaBell,         label: 'Notifications', noUserId: true, isNotification: true },
    ],
    guest: [
        { path: '/about',   icon: FaInfoCircle, label: 'About'   },
        { path: '/contact', icon: FaEnvelope,   label: 'Contact' }
    ]
};

export const getUserRoleKey = (user) => {
    if (!user) return 'guest';
    const rawRole = (user.role || '').toLowerCase();
    if (rawRole === 'admin' || rawRole === 'administrator') return 'admin';
    if (rawRole === 'student') return 'student';
    return 'alumni'; // default logged-in role
};
