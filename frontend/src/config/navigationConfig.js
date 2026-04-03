import {
    FaHome,
    FaLayerGroup,
    FaBell,
    FaCommentDots,
    FaChartLine,
    FaClipboardCheck,
    FaInfoCircle,
    FaEnvelope,
    FaBriefcase,
    FaUserFriends
} from 'react-icons/fa';

export const navigationConfig = {
    alumni: [
        { path: '/alumni/home',    icon: FaHome,        label: 'Home'          },
        { path: '/requests',       icon: FaUserFriends, label: 'Network',       noUserId: true },
        { path: '/opportunities',  icon: FaLayerGroup,  label: 'Opportunities', noUserId: true },
        { path: '/notifications',  icon: FaBell,        label: 'Notifications', noUserId: true, isNotification: true },
        { path: '/messaging',      icon: FaCommentDots, label: 'Messaging',     noUserId: true, isMessaging: true }
    ],
    admin: [
        { path: '/admin/home',       icon: FaHome,           label: 'Home'      },
        { path: '/admin/approvals',  icon: FaClipboardCheck, label: 'Approvals' },
        { path: '/admin/dashboard',  icon: FaChartLine,      label: 'Stats'     },
        { path: '/notifications',    icon: FaBell,           label: 'Alerts',   noUserId: true, isNotification: true },
        { path: '/messaging',        icon: FaCommentDots,    label: 'Inbox',    noUserId: true, isMessaging: true }
    ],
    student: [
        { path: '/student/home',   icon: FaHome,        label: 'Home'          },
        { path: '/requests',       icon: FaUserFriends, label: 'Network',       noUserId: true },
        { path: '/opportunities',  icon: FaBriefcase,   label: 'Opportunities', noUserId: true },
        { path: '/notifications',  icon: FaBell,        label: 'Notifications', noUserId: true, isNotification: true },
        { path: '/messaging',      icon: FaCommentDots, label: 'Messaging',     noUserId: true, isMessaging: true }
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
