import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import {
  FaBell, FaCheck, FaUserPlus, FaCommentDots, FaBriefcase,
  FaCalendarAlt, FaNewspaper, FaShieldAlt, FaTrashAlt,
} from 'react-icons/fa';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/Navbar.css';

/* ─── Type config ──────────────────────────────────────────── */
const TYPE_CONFIG = {
  connection_request:    { icon: <FaUserPlus  style={{ color: '#c84022' }} />, label: 'Connection' },
  connection_accepted:   { icon: <FaCheck      style={{ color: '#198754' }} />, label: 'Accepted'   },
  message:               { icon: <FaCommentDots style={{ color: '#0d6efd' }} />, label: 'Message'   },
  job:                   { icon: <FaBriefcase  style={{ color: '#6f42c1' }} />, label: 'Job'        },
  job_alert:             { icon: <FaBriefcase  style={{ color: '#6f42c1' }} />, label: 'Job'        },
  event:                 { icon: <FaCalendarAlt style={{ color: '#fd7e14' }} />, label: 'Event'     },
  event_alert:           { icon: <FaCalendarAlt style={{ color: '#fd7e14' }} />, label: 'Event'     },
  post:                  { icon: <FaNewspaper  style={{ color: '#20c997' }} />, label: 'Post'       },
  admin_approval_needed: { icon: <FaShieldAlt  style={{ color: '#dc3545' }} />, label: 'Approval'   },
  account_activated:     { icon: <FaCheck      style={{ color: '#198754' }} />, label: 'Activated'  },
  system:                { icon: <FiAlertCircle style={{ color: '#856404' }} />, label: 'System'    },
};
const getIcon = (type) => TYPE_CONFIG[type]?.icon || <FaBell style={{ color: '#c84022' }} />;

const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

/* ─── Live Toast ───────────────────────────────────────────── */
const LiveToast = ({ notif, onClose }) => {
  const icon = getIcon(notif?.type);
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit={{   opacity: 0, y: 20,  scale: 0.95  }}
      style={{
        position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
        background: '#fff', borderRadius: 14, padding: '12px 16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)', border: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 320,
        borderLeft: '4px solid #c84022',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,64,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 2 }}>{notif?.title}</div>
        {notif?.description && (
          <div style={{ fontSize: 11.5, color: '#777', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.description}</div>
        )}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 2, flexShrink: 0 }}>
        <FiX size={14} />
      </button>
    </motion.div>
  );
};

/* ─── Dropdown ─────────────────────────────────────────────── */
const NotificationDropdown = () => {
  const [isOpen,   setIsOpen]   = useState(false);
  const [hasNew,   setHasNew]   = useState(false);
  const [search,   setSearch]   = useState('');
  const [toast,    setToast]    = useState(null);   // latest notif for toast
  const [prevLen,  setPrevLen]  = useState(0);      // track new arrivals
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  const { notifications, unreadCount, markOneRead, markAllRead, deleteNotif } = useSocket();

  // ── Detect new incoming notification → show toast (skip message type — handled by chat sidebar) ──
  useEffect(() => {
    if (notifications.length > prevLen && prevLen > 0) {
      const newest = notifications[0];
      // Only ring the bell and show toast for non-message notifications
      if (newest?.type !== 'message') {
        setHasNew(true);
        setToast(newest);
        setTimeout(() => setHasNew(false), 3000);
      }
    }
    setPrevLen(notifications.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.length]);

  // ── Filter out message-type from the bell dropdown (those live in chat sidebar)
  const bellNotifications = useMemo(
    () => notifications.filter(n => n.type !== 'message'),
    [notifications]
  );

  // ── Outside-click close ───────────────────────────────────────
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Sort: unread first, then newest (bell notifications only) ──
  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? bellNotifications.filter(n =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.description || '').toLowerCase().includes(q)
        )
      : bellNotifications;
    return [...list].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [bellNotifications, search]);

  // ── Navigation on item click ─────────────────────────────────
  const handleItemClick = (item) => {
    markOneRead(item._id);
    setIsOpen(false);
    const { type, relatedId } = item;
    if (type === 'message')               navigate('/messaging');
    else if (type === 'job' || type === 'job_alert')     navigate('/opportunities?tab=jobs');
    else if (type === 'event' || type === 'event_alert') navigate('/opportunities?tab=events');
    else if (type === 'connection_request' || type === 'connection_accepted')
      navigate(relatedId ? `/profile/${relatedId}` : '/notifications');
    else if (type === 'admin_approval_needed') navigate('/admin/approvals');
    else navigate('/notifications');
  };

  return (
    <>
      {/* Live Toast (outside dropdown, always rendered) */}
      <AnimatePresence>
        {toast && (
          <LiveToast key={toast._id} notif={toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Bell button */}
      <div className="position-relative" ref={dropdownRef}>
        <motion.button
          className="btn btn-link text-decoration-none p-0 position-relative"
          onClick={() => { setIsOpen(s => !s); setHasNew(false); }}
          style={{ color: '#555' }}
          animate={hasNew ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          <FaBell size={20} />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.6rem', padding: '0.25em 0.4em', minWidth: 18 }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        {/* Dropdown panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.95, y: -8  }}
              transition={{ duration: 0.15 }}
              className="shadow-lg"
              style={{
                position: 'absolute', right: 0, top: 42,
                width: 340, maxHeight: 440, overflowY: 'auto',
                zIndex: 1050, borderRadius: 12,
                background: '#fff', border: '1px solid #e8e8e8',
              }}
            >
              {/* Header */}
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom sticky-top bg-white" style={{ borderRadius: '12px 12px 0 0' }}>
                <h6 className="mb-0 fw-bold" style={{ fontSize: 15 }}>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill ms-1" style={{ backgroundColor: '#c84022', fontSize: 11 }}>
                      {unreadCount}
                    </span>
                  )}
                </h6>
                {sorted.length > 0 && (
                  <button
                    className="btn btn-sm btn-link text-decoration-none fw-semibold"
                    style={{ color: '#c84022', fontSize: 12 }}
                    onClick={(e) => { e.stopPropagation(); markAllRead(); setIsOpen(false); }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Search */}
              {notifications.length > 3 && (
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f5f5f5' }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search…"
                    style={{
                      width: '100%', padding: '6px 10px', borderRadius: 8,
                      border: '1px solid #e8e8e8', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Items */}
              {sorted.length === 0 ? (
                <div className="p-5 text-center text-muted">
                  <FaBell size={28} className="mb-2 opacity-25" />
                  <p className="mb-0 small">You're all caught up!</p>
                </div>
              ) : (
                <div>
                  {sorted.slice(0, 15).map(item => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-3 py-3 d-flex gap-3 align-items-start notif-item ${!item.isRead ? 'notif-unread' : ''}`}
                      onClick={() => handleItemClick(item)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                    >
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38, backgroundColor: '#f5f5f5' }}>
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold text-dark" style={{ fontSize: 13, lineHeight: 1.3 }}>{item.title}</div>
                        <div className="text-muted text-truncate" style={{ fontSize: 12 }}>{item.description}</div>
                        <div className="mt-1" style={{ fontSize: 11, color: item.isRead ? '#aaa' : '#c84022' }}>
                          {timeAgo(item.createdAt)}
                        </div>
                      </div>
                      <div className="d-flex flex-column align-items-center gap-1">
                        {!item.isRead && (
                          <>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c84022', marginTop: 4 }} />
                            <button
                              className="btn btn-sm p-0 border-0 bg-transparent"
                              style={{ fontSize: 10, color: '#aaa' }}
                              onClick={(e) => { e.stopPropagation(); markOneRead(item._id); }}
                              title="Mark as read"
                            >
                              <FaCheck size={10} />
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-sm p-0 border-0 bg-transparent"
                          style={{ color: '#ddd' }}
                          onClick={(e) => { e.stopPropagation(); deleteNotif(item._id); }}
                          title="Delete"
                        >
                          <FaTrashAlt size={10} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-2 border-top sticky-bottom bg-light" style={{ borderRadius: '0 0 12px 12px', fontSize: 13 }}>
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
    </>
  );
};

export default NotificationDropdown;
