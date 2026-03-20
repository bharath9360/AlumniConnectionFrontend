import {
    FaHome,
    FaBriefcase,
    FaCalendarAlt,
    FaBell,
    FaCommentDots,
    FaUserGraduate,
    FaChartLine,
    FaClipboardList,
    FaClipboardCheck,
    FaInfoCircle,
    FaEnvelope
} from 'react-icons/fa';

export const navigationConfig = {
    alumni: [
        { path: '/alumni/home', icon: FaHome, label: 'Home' },
        { path: '/jobs', icon: FaBriefcase, label: 'Jobs' },
        { path: '/events', icon: FaCalendarAlt, label: 'Events' },
        { path: '/notifications', icon: FaBell, label: 'Notifications' },
        { path: '/messaging', icon: FaCommentDots, label: 'Messaging' }
    ],
    admin: [
        { path: '/admin/home', icon: FaHome, label: 'Home' },
        { path: '/admin/post', icon: FaClipboardList, label: 'Post' },
        { path: '/admin/approvals', icon: FaClipboardCheck, label: 'Approvals' },
        { path: '/admin/alumni', icon: FaUserGraduate, label: 'Alumni' },
        { path: '/admin/dashboard', icon: FaChartLine, label: 'Dashboard' },
        { path: '/notifications', icon: FaBell, label: 'Notifications' },
        { path: '/messaging', icon: FaCommentDots, label: 'Messaging' }
    ],
    student: [
        { path: '/alumni/home', icon: FaHome, label: 'Home' },
        { path: '/student/JobSearch', icon: FaBriefcase, label: 'Jobs' },
        { path: '/student/StudentEvents', icon: FaCalendarAlt, label: 'Events' },
        { path: '/notifications', icon: FaBell, label: 'Notifications' },
        { path: '/messaging', icon: FaCommentDots, label: 'Messaging' }
    ],
    guest: [
        { path: '/about', icon: FaInfoCircle, label: 'About' },
        { path: '/contact', icon: FaEnvelope, label: 'Contact' }
    ]
};

export const getUserRoleKey = (user) => {
    if (!user) return 'guest';
    const rawRole = (user.role || '').toLowerCase();
    if (rawRole === 'admin' || rawRole === 'administrator') return 'admin';
    if (rawRole === 'student') return 'student';
    return 'alumni'; // default logged-in role
};
