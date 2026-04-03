import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import {
  FaBell, FaCheck, FaUserPlus, FaCommentDots, FaBriefcase,
  FaCalendarAlt, FaNewspaper, FaShieldAlt, FaTrashAlt,
  FaCheckDouble, FaSearch, FaTimes, FaInbox,
} from 'react-icons/fa';
import { FiChevronRight, FiAlertCircle } from 'react-icons/fi';

/* ─── Type config ──────────────────────────────────────────── */
const TYPE_CONFIG = {
  connection_request:    { icon: <FaUserPlus />,     color: '#c84022', label: 'Connection',  bg: 'rgba(200,64,34,0.1)'  },
  connection_accepted:   { icon: <FaCheck />,        color: '#198754', label: 'Connection',  bg: 'rgba(25,135,84,0.1)'  },
  message:               { icon: <FaCommentDots />,  color: '#0d6efd', label: 'Message',     bg: 'rgba(13,110,253,0.1)' },
  job:                   { icon: <FaBriefcase />,    color: '#6f42c1', label: 'Job',         bg: 'rgba(111,66,193,0.1)' },
  job_alert:             { icon: <FaBriefcase />,    color: '#6f42c1', label: 'Job',         bg: 'rgba(111,66,193,0.1)' },
  event:                 { icon: <FaCalendarAlt />,  color: '#fd7e14', label: 'Event',       bg: 'rgba(253,126,20,0.1)' },
  event_alert:           { icon: <FaCalendarAlt />,  color: '#fd7e14', label: 'Event',       bg: 'rgba(253,126,20,0.1)' },
  post:                  { icon: <FaNewspaper />,    color: '#20c997', label: 'Post',        bg: 'rgba(32,201,151,0.1)' },
  admin_approval_needed: { icon: <FaShieldAlt />,   color: '#dc3545', label: 'Approval',    bg: 'rgba(220,53,69,0.1)'  },
  account_activated:     { icon: <FaCheck />,        color: '#198754', label: 'Account',     bg: 'rgba(25,135,84,0.1)'  },
  broadcast:             { icon: <FaBell />,         color: '#6f42c1', label: 'Broadcast',   bg: 'rgba(111,66,193,0.1)' },
  system:                { icon: <FiAlertCircle />,  color: '#856404', label: 'System',      bg: 'rgba(133,100,4,0.1)'  },
};
const getCfg  = (type) => TYPE_CONFIG[type] || { icon: <FaBell />, color: '#c84022', label: 'Alert', bg: 'rgba(200,64,34,0.08)' };

/* ─── Helpers ──────────────────────────────────────────────── */
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const dayLabel = (d) => {
  if (!d) return 'Older';
  const date = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
  const week  = new Date(today); week.setDate(week.getDate() - 7);
  if (date >= today) return 'Today';
  if (date >= yest)  return 'Yesterday';
  if (date >= week)  return 'This Week';
  return 'Older';
};

const FILTER_TABS = [
  { id: 'all',      label: 'All' },
  { id: 'unread',   label: 'Unread' },
  { id: 'message',  label: 'Messages' },
  { id: 'job',      label: 'Jobs' },
  { id: 'event',    label: 'Events' },
  { id: 'system',   label: 'System' },
];

const TYPE_TO_FILTER = {
  message: 'message',
  job: 'job', job_alert: 'job',
  event: 'event', event_alert: 'event',
  system: 'system', broadcast: 'system',
  admin_approval_needed: 'system', account_activated: 'system',
  connection_request: 'system', connection_accepted: 'system',
};

/* ─── Single notification card ─────────────────────────────── */
const NotifCard = ({ notif, onRead, onDelete, onClick }) => {
  const cfg = getCfg(notif.type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      onClick={() => onClick(notif)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
        background: '#fff', borderRadius: 14, cursor: 'pointer',
        borderLeft: !notif.isRead ? `4px solid ${cfg.color}` : '4px solid transparent',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        marginBottom: 8,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = ''; }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: cfg.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: cfg.color, fontSize: 18, flexShrink: 0,
      }}>
        {notif.icon || cfg.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', flex: 1 }}>{notif.title}</span>
          {!notif.isRead && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />
          )}
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: cfg.color,
            background: cfg.bg, borderRadius: 6, padding: '2px 7px', flexShrink: 0,
          }}>
            {cfg.label}
          </span>
        </div>
        {notif.description && (
          <p style={{ margin: '0 0 4px', fontSize: 12.5, color: '#666', lineHeight: 1.5 }}>{notif.description}</p>
        )}
        <div style={{ fontSize: 11, color: '#aaa' }}>{timeAgo(notif.createdAt)}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <FiChevronRight size={14} color="#ccc" />
        {!notif.isRead && (
          <button
            onClick={e => { e.stopPropagation(); onRead(notif._id); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#198754', padding: 2 }}
            title="Mark as read"
          >
            <FaCheck size={11} />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif._id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: 2 }}
          title="Delete"
        >
          <FaTrashAlt size={11} />
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Main Notification Page ────────────────────────────────── */
const Notification = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, notifLoaded, markOneRead, markAllRead, deleteNotif, clearAll } = useSocket();

  const [activeTab,   setActiveTab]   = useState('all');
  const [search,      setSearch]      = useState('');
  const [clearing,    setClearing]    = useState(false);

  /* ── Navigation on click ──────────────────────────────────── */
  const handleClick = useCallback((notif) => {
    markOneRead(notif._id);
    const { type, relatedId } = notif;
    if (type === 'message')                    navigate('/messaging');
    else if (type === 'job' || type === 'job_alert')       navigate('/opportunities?tab=jobs');
    else if (type === 'event' || type === 'event_alert')   navigate('/opportunities?tab=events');
    else if (type === 'connection_request' || type === 'connection_accepted')
      navigate(relatedId ? `/profile/${relatedId}` : '/notifications');
    else if (type === 'admin_approval_needed') navigate('/admin/approvals');
    else if (type === 'account_activated')     navigate('/alumni/home');
  }, [navigate, markOneRead]);

  /* ── Filter + search ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notifications.filter(n => {
      const matchTab = activeTab === 'all'
        ? true
        : activeTab === 'unread'
          ? !n.isRead
          : TYPE_TO_FILTER[n.type] === activeTab;
      const matchQ = !q || (n.title || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  }, [notifications, activeTab, search]);

  /* ── Group by date ────────────────────────────────────────── */
  const groups = useMemo(() => {
    const map = {};
    filtered.forEach(n => {
      const label = dayLabel(n.createdAt);
      if (!map[label]) map[label] = [];
      map[label].push(n);
    });
    const ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];
    return ORDER.filter(k => map[k]).map(k => ({ label: k, items: map[k] }));
  }, [filtered]);

  /* ── Clear all handler ────────────────────────────────────── */
  const handleClearAll = async () => {
    setClearing(true);
    await clearAll();
    setClearing(false);
  };

  /* ── Tab unread dots ──────────────────────────────────────── */
  const tabCounts = useMemo(() => ({
    all: notifications.filter(n => !n.isRead).length,
    unread: notifications.filter(n => !n.isRead).length,
    message: notifications.filter(n => !n.isRead && TYPE_TO_FILTER[n.type] === 'message').length,
    job: notifications.filter(n => !n.isRead && TYPE_TO_FILTER[n.type] === 'job').length,
    event: notifications.filter(n => !n.isRead && TYPE_TO_FILTER[n.type] === 'event').length,
    system: notifications.filter(n => !n.isRead && TYPE_TO_FILTER[n.type] === 'system').length,
  }), [notifications]);

  if (!notifLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ClipLoader color="#c84022" size={40} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: 40 }}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #c84022 100%)',
        padding: '24px 16px 16px', color: '#fff',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaBell size={20} />
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: 10, background: '#fff', color: '#c84022', borderRadius: 10, fontSize: 12, fontWeight: 800, padding: '2px 8px' }}>
                    {unreadCount}
                  </span>
                )}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  <FaCheckDouble size={11} /> Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} disabled={clearing} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, color: '#ffaeae', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>
                  {clearing ? <ClipLoader size={10} color="#fff" /> : <FaTrashAlt size={11} />}
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notifications…"
              style={{
                width: '100%', padding: '9px 36px', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
        {/* ── Filter tabs ─────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '14px 0 12px',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        }}>
          {FILTER_TABS.map(tab => {
            const cnt = tabCounts[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: isActive ? '#c84022' : '#fff',
                  color: isActive ? '#fff' : '#555',
                  fontWeight: 600, fontSize: 12.5, flexShrink: 0,
                  boxShadow: isActive ? '0 2px 10px rgba(200,64,34,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                {cnt > 0 && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.3)' : '#c84022',
                    color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 800,
                    padding: '1px 6px', minWidth: 18, textAlign: 'center',
                  }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Notification list ────────────────────────────── */}
        <AnimatePresence mode="wait">
          {groups.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <FaInbox size={48} color="#e0e0e0" />
              <h4 style={{ marginTop: 16, color: '#888', fontWeight: 700 }}>
                {search ? `No results for "${search}"` : "You're all caught up!"}
              </h4>
              <p style={{ color: '#bbb', fontSize: 14, margin: 0 }}>No notifications here yet.</p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {groups.map(group => (
                <div key={group.label}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase',
                    letterSpacing: '0.8px', margin: '16px 0 8px', paddingLeft: 4,
                  }}>
                    {group.label}
                  </div>
                  <AnimatePresence>
                    {group.items.map(notif => (
                      <NotifCard
                        key={notif._id}
                        notif={notif}
                        onRead={markOneRead}
                        onDelete={deleteNotif}
                        onClick={handleClick}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notification;
