import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { ClipLoader } from 'react-spinners';

const Notification = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationService.getNotifications();
        setNotifications(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to clear all:', err);
    }
  };

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase();
    if (!s) return notifications;
    return notifications.filter(n =>
      (n.title || '').toLowerCase().includes(s) ||
      (n.description || '').toLowerCase().includes(s)
    );
  }, [searchTerm, notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleItemClick = async (notif) => {
    await handleMarkOneRead(notif._id);
    if (notif.type === 'event') navigate('/events');
    else if (notif.type === 'job') navigate('/jobs');
    else if (notif.type === 'message') navigate('/messaging');
  };

  const typeIcon = (type) => {
    if (type === 'event') return '📅';
    if (type === 'job') return '💼';
    if (type === 'message') return '💬';
    return '🔔';
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <ClipLoader color="#c84022" size={40} />
    </div>
  );

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold mb-0" style={{ color: '#c84022' }}>
            Notifications
            {unreadCount > 0 && (
              <span className="badge ms-2 fw-bold" style={{ backgroundColor: '#c84022', borderRadius: '12px', fontSize: '0.65rem', verticalAlign: 'middle' }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button
                className="btn rounded-pill px-4 flex-shrink-0"
                style={{ border: '1.5px solid #333', color: '#333', backgroundColor: 'transparent', fontWeight: 600, fontSize: '0.9rem' }}
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="btn btn-outline-danger rounded-pill px-4 flex-shrink-0"
                style={{ fontWeight: 600, fontSize: '0.9rem' }}
                onClick={handleClearAll}
              >
                <i className="fas fa-check-double me-2"></i>Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 position-relative">
          <i className="fas fa-search position-absolute text-muted" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}></i>
          <input
            type="text"
            className="form-control ps-5 rounded-pill"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ borderColor: '#d0d0d0', backgroundColor: '#ffffff' }}
          />
          {searchTerm && (
            <button className="btn btn-link position-absolute text-muted p-0" style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }} onClick={() => setSearchTerm('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="dashboard-card bg-white text-center py-5 rounded-3">
            <div style={{ fontSize: '3rem' }} className="mb-3">🔔</div>
            <h5 className="fw-semibold text-dark">You're all caught up!</h5>
            <p className="text-muted mb-0">No notifications {searchTerm ? `matching "${searchTerm}"` : 'yet'}.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filtered.map(notif => (
              <div
                key={notif._id}
                className="dashboard-card bg-white rounded-3 p-3 d-flex align-items-start gap-3"
                style={{
                  cursor: 'pointer',
                  borderLeft: !notif.isRead ? '4px solid #c84022' : '4px solid transparent',
                  transition: 'box-shadow 0.15s, transform 0.15s'
                }}
                onClick={() => handleItemClick(notif)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: '48px', height: '48px', backgroundColor: 'rgba(200,64,34,0.08)', fontSize: '1.4rem' }}>
                  {notif.icon || typeIcon(notif.type)}
                </div>
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="fw-bold mb-0 text-dark">{notif.title}</h6>
                    {!notif.isRead && (
                      <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#c84022', display: 'inline-block' }}></span>
                    )}
                    <span className="badge ms-auto" style={{ fontSize: '0.65rem', backgroundColor: notif.type === 'job' ? '#0d6efd' : notif.type === 'event' ? '#198754' : '#c84022', color: 'white', borderRadius: '8px' }}>
                      {notif.type?.toUpperCase()}
                    </span>
                  </div>
                  {notif.description && (
                    <p className="text-muted small mb-1" style={{ lineHeight: '1.4' }}>{notif.description}</p>
                  )}
                  <span className="extra-small text-muted">
                    <i className="fas fa-clock me-1 text-mamcet-red"></i>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                <div className="d-flex flex-column align-items-center gap-2">
                  <i className="fas fa-chevron-right text-muted"></i>
                  <button
                    className="btn btn-link text-danger p-0"
                    title="Delete"
                    onClick={(e) => handleDelete(notif._id, e)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
