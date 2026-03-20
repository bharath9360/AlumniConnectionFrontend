import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { FaBell, FaCheck, FaTrashAlt } from 'react-icons/fa';
import '../../styles/Navbar.css';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await notificationService.getNotifications();
            if (res.data && res.data.data) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        try {
            await notificationService.markRead(id);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const handleClearAll = async (e) => {
        e.stopPropagation();
        try {
            await notificationService.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setIsOpen(false);
        } catch (err) {
            console.error('Failed to clear notifications', err);
        }
    };

    const handleItemClick = (item) => {
        handleMarkAsRead(item._id);
        setIsOpen(false);
        if (item.type === 'event') navigate('/events');
        else if (item.type === 'job') navigate('/jobs');
        else if (item.type === 'message') navigate(`/messaging?chatId=${item.relatedId}`);
    };

    const sortedNotifs = [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) return new Date(b.createdAt) - new Date(a.createdAt);
        return a.isRead ? 1 : -1;
    });

    const unreadCount = sortedNotifs.filter(n => !n.isRead).length;

    return (
        <div className="position-relative" ref={dropdownRef}>
            <button
                className="btn btn-link text-decoration-none p-0 position-relative"
                onClick={() => setIsOpen(!isOpen)}
                style={{ color: '#555' }}
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.65rem', padding: '0.25em 0.4em' }}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="dropdown-menu dropdown-menu-end shadow-sm show"
                    style={{ position: 'absolute', right: 0, top: '40px', width: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 1050, padding: 0, border: '1px solid #ddd', borderRadius: '8px' }}
                >
                    <div className="sticky-top bg-white border-bottom p-2 d-flex justify-content-between align-items-center" style={{ zIndex: 1, borderRadius: '8px 8px 0 0' }}>
                        <h6 className="mb-0 fw-bold px-2">Notifications</h6>
                        {sortedNotifs.length > 0 && (
                            <button className="btn btn-sm btn-link text-danger text-decoration-none" onClick={handleClearAll} style={{ fontSize: '0.8rem' }}>
                                <FaCheck className="me-1" /> Mark All Read
                            </button>
                        )}
                    </div>

                    {sortedNotifs.length === 0 ? (
                        <div className="p-4 text-center text-muted">No notifications</div>
                    ) : (
                        <div className="list-group list-group-flush">
                            {sortedNotifs.map(item => (
                                <div
                                    key={item._id}
                                    className={`list-group-item list-group-item-action p-3 ${!item.isRead ? 'bg-light' : ''}`}
                                    onClick={() => handleItemClick(item)}
                                    style={{ cursor: 'pointer', borderLeft: !item.isRead ? '3px solid #c84022' : '3px solid transparent' }}
                                >
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div className="me-2 text-primary" style={{ fontSize: '1.2rem' }}>
                                            {item.icon || (item.type === 'message' && '💬') || '🔔'}
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{item.title}</h6>
                                            <p className="mb-1 text-muted text-truncate" style={{ fontSize: '0.8rem', maxWidth: '180px' }}>
                                                {item.description}
                                            </p>
                                        </div>
                                        <div>
                                            {!item.isRead && (
                                                <button
                                                    className="btn btn-sm btn-light rounded-circle p-1"
                                                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={(e) => handleMarkAsRead(item._id, e)}
                                                    title="Mark as read"
                                                >
                                                    <FaCheck size={10} className="text-success" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-top p-2 text-center bg-light" style={{ borderRadius: '0 0 8px 8px' }}>
                        <a href="/notifications" className="text-decoration-none small text-primary fw-bold" onClick={(e) => { e.preventDefault(); setIsOpen(false); navigate('/notifications'); }}>
                            View All Notifications
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
