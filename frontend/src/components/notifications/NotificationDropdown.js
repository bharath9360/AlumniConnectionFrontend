import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { FaBell, FaCheck, FaUserPlus, FaCommentDots, FaBriefcase, FaCalendarAlt, FaNewspaper } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Navbar.css';

// Icon map per notification type
const TYPE_CONFIG = {
  connection_request:  { icon: <FaUserPlus  style={{ color: '#c84022' }} />, label: 'Connection' },
  connection_accepted: { icon: <FaCheck      style={{ color: '#198754' }} />, label: 'Accepted'   },
  message:             { icon: <FaCommentDots style={{ color: '#0d6efd' }} />, label: 'Message'    },
  job:                 { icon: <FaBriefcase  style={{ color: '#6f42c1' }} />, label: 'Job'        },
  event:               { icon: <FaCalendarAlt style={{ color: '#fd7e14' }} />, label: 'Event'      },
  post:                { icon: <FaNewspaper  style={{ color: '#20c997' }} />, label: 'Post'       },
  admin_approval_needed: { icon: <FaUserPlus style={{ color: '#dc3545' }} />, label: 'Approval Required' },
  account_activated:   { icon: <FaCheck      style={{ color: '#198754' }} />, label: 'Activated'  },
};

const getIcon = (type) => TYPE_CONFIG[type]?.icon || <FaBell style={{ color: '#c84022' }} />;

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationDropdown = () => {
  const [isOpen,         setIsOpen]         = useState(false);
  const [notifications,  setNotifications]  = useState([]);
  const [hasNew,         setHasNew]         = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const { socket }  = useSocket();

  // ── Fetch notifications from REST ──────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.data?.data) setNotifications(res.data.data);
    } catch { /* silent */ }
  }, [user]);

  // ── Real-time notification listener via shared SocketContext socket ───
  useEffect(() => {
    if (!socket) return;

    const handleNotif = (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setHasNew(true);
      setTimeout(() => setHasNew(false), 3000);
    };

    socket.on('notification_received', handleNotif);
    return () => socket.off('notification_received', handleNotif);
  }, [socket]);

  // ── Initial fetch + polling (fallback every 30s) ───────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Actions ─────────────────────────────────────────────────
  const markRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setIsOpen(false);
    } catch { /* silent */ }
  };

  const handleItemClick = (item) => {
    markRead(item._id);
    setIsOpen(false);
    const type = item.type;
    if (type === 'event')               navigate('/events');
    else if (type === 'job')            navigate('/jobs');
    else if (type === 'message')        navigate(`/messaging`);
    else if (type === 'connection_request' || type === 'connection_accepted')
      navigate(item.relatedId ? `/profile/${item.relatedId}` : '/notifications');
    else if (type === 'admin_approval_needed') navigate('/admin/approvals');
    else if (type === 'post')           navigate('/alumni/home');
    else                                navigate('/notifications');
  };

  const sorted    = [...notifications].sort((a, b) => {
    if (a.isRead === b.isRead) return new Date(b.createdAt) - new Date(a.createdAt);
    return a.isRead ? 1 : -1;
  });
  const unread    = sorted.filter(n => !n.isRead).length;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        className="btn btn-link text-decoration-none p-0 position-relative"
        onClick={() => { setIsOpen(s => !s); setHasNew(false); }}
        style={{ color: '#555' }}
        animate={hasNew ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <FaBell size={20} />
        {unread > 0 && (
          <motion.span
            key={unread}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.6rem', padding: '0.25em 0.4em', minWidth: '18px' }}
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: -8  }}
            transition={{ duration: 0.15 }}
            className="shadow-lg"
            style={{
              position: 'absolute', right: 0, top: '42px',
              width: 340, maxHeight: 440, overflowY: 'auto',
              zIndex: 1050, borderRadius: '12px',
              backgroundColor: '#fff', border: '1px solid #e8e8e8'
            }}
          >
            {/* Header */}
            <div
              className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom sticky-top bg-white"
              style={{ borderRadius: '12px 12px 0 0' }}
            >
              <h6 className="mb-0 fw-bold" style={{ fontSize: 15 }}>
                Notifications {unread > 0 && <span className="badge rounded-pill ms-1" style={{ backgroundColor: '#c84022', fontSize: 11 }}>{unread}</span>}
              </h6>
              {sorted.length > 0 && (
                <button
                  className="btn btn-sm btn-link text-decoration-none fw-semibold"
                  style={{ color: '#c84022', fontSize: 12 }}
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            {sorted.length === 0 ? (
              <div className="p-5 text-center text-muted">
                <FaBell size={28} className="mb-2 opacity-25" />
                <p className="mb-0 small">You're all caught up!</p>
              </div>
            ) : (
              <div>
                {sorted.map(item => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`px-3 py-3 d-flex gap-3 align-items-start notif-item ${!item.isRead ? 'notif-unread' : ''}`}
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                  >
                    {/* Icon bubble */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 38, height: 38, backgroundColor: '#f5f5f5' }}
                    >
                      {getIcon(item.type)}
                    </div>

                    {/* Text */}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold text-dark" style={{ fontSize: 13, lineHeight: 1.3 }}>{item.title}</div>
                      <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{item.description}</div>
                      <div className="mt-1" style={{ fontSize: 11, color: item.isRead ? '#aaa' : '#c84022' }}>
                        {timeAgo(item.createdAt)}
                      </div>
                    </div>

                    {/* Unread dot + mark-read btn */}
                    <div className="d-flex flex-column align-items-center gap-1">
                      {!item.isRead && (
                        <>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c84022', marginTop: 4 }} />
                          <button
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{ fontSize: 10, color: '#aaa' }}
                            onClick={(e) => markRead(item._id, e)}
                            title="Mark as read"
                          >
                            <FaCheck size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div
              className="text-center py-2 border-top sticky-bottom bg-light"
              style={{ borderRadius: '0 0 12px 12px', fontSize: 13 }}
            >
              <Link
                to="/notifications"
                className="text-decoration-none fw-semibold"
                style={{ color: '#c84022' }}
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
