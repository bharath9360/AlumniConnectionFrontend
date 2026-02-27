import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/storage';

const Notification = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState({
    events: [],
    jobs: [],
    messages: []
  });

  React.useEffect(() => {
    setNotifications(storage.getNotifications());
  }, []);

  const updateNotifications = (newNotifications) => {
    setNotifications(newNotifications);
    storage.saveNotifications(newNotifications);
  };

  const filteredNotifications = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return {
      events: notifications.events.filter(e =>
        e.title.toLowerCase().includes(s) || e.description.toLowerCase().includes(s)
      ),
      jobs: notifications.jobs.filter(j =>
        j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.description.toLowerCase().includes(s)
      ),
      messages: notifications.messages.filter(m =>
        m.sender.toLowerCase().includes(s) || m.lastMessage.toLowerCase().includes(s)
      )
    };
  }, [searchTerm, notifications]);

  const handleMarkAsRead = () => {
    const updated = {
      events: notifications.events.map(e => ({ ...e, isRead: true })),
      jobs: notifications.jobs.map(j => ({ ...j, isRead: true })),
      messages: notifications.messages.map(m => ({ ...m, isRead: true }))
    };
    updateNotifications(updated);
  };

  const handleDeleteNotification = (type, id, e) => {
    e.stopPropagation(); // Prevent navigation
    const updated = {
      ...notifications,
      [type]: notifications[type].filter(item => item.id !== id)
    };
    updateNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = {
      events: [],
      jobs: [],
      messages: []
    };
    updateNotifications(updated);
  };

  const unreadCount = [
    ...notifications.events,
    ...notifications.jobs,
    ...notifications.messages
  ].filter(n => !n.isRead).length;

  const hasResults =
    filteredNotifications.events.length > 0 ||
    filteredNotifications.jobs.length > 0 ||
    filteredNotifications.messages.length > 0;

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="fw-bold mb-0" style={{ color: '#c84022' }}>Notifications</h2>
          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button
                className="btn rounded-pill px-4 flex-shrink-0"
                style={{ border: '1.5px solid #333', color: '#333', backgroundColor: 'transparent', fontWeight: 600, fontSize: '0.9rem' }}
                onClick={handleMarkAsRead}
              >
                Mark as Read
              </button>
            )}
            {(notifications.events.length > 0 || notifications.jobs.length > 0 || notifications.messages.length > 0) && (
              <button
                className="btn btn-outline-danger rounded-pill px-4 flex-shrink-0"
                style={{ fontWeight: 600, fontSize: '0.9rem' }}
                onClick={handleClearAll}
              >
                <i className="fas fa-trash-alt me-2"></i>Clear All
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
            placeholder="search notifications"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ borderColor: '#d0d0d0', backgroundColor: '#ffffff' }}
          />
          {searchTerm && (
            <button
              className="btn btn-link position-absolute text-muted p-0"
              style={{ right: '14px', top: '50%', transform: 'translateY(-50%)' }}
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {!hasResults ? (
          <div className="dashboard-card bg-white text-center py-5 rounded-3">
            <i className="fas fa-search text-muted mb-3" style={{ fontSize: '2rem' }}></i>
            <p className="text-muted mb-0">No notifications found matching "<strong>{searchTerm}</strong>"</p>
          </div>
        ) : (
          <>
            {/* College Events Section */}
            {filteredNotifications.events.length > 0 && (
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>📅</span>
                  <h5 className="fw-bold mb-0 text-dark">College Events</h5>
                  {filteredNotifications.events.filter(e => !e.isRead).length > 0 && (
                    <span
                      className="badge ms-2 fw-bold"
                      style={{ backgroundColor: '#c84022', borderRadius: '12px', fontSize: '0.7rem' }}
                    >
                      {filteredNotifications.events.filter(e => !e.isRead).length}
                    </span>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  {filteredNotifications.events.map(event => (
                    <div
                      key={event.id}
                      className="dashboard-card bg-white rounded-3 p-3 d-flex align-items-start gap-3"
                      style={{
                        cursor: 'pointer',
                        borderLeft: !event.isRead ? '4px solid #c84022' : '4px solid transparent',
                        transition: 'box-shadow 0.15s, transform 0.15s'
                      }}
                      onClick={() => {
                        const updated = {
                          ...notifications,
                          events: notifications.events.map(e =>
                            e.id === event.id ? { ...e, isRead: true } : e
                          )
                        };
                        updateNotifications(updated);
                        navigate('/events');
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '48px', height: '48px', backgroundColor: 'rgba(200,64,34,0.08)', fontSize: '1.4rem' }}
                      >
                        {event.icon}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h6 className="fw-bold mb-0 text-dark">{event.title}</h6>
                          {!event.isRead && (
                            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#c84022', display: 'inline-block' }}></span>
                          )}
                        </div>
                        <p className="text-muted small mb-1" style={{ lineHeight: '1.4' }}>{event.description}</p>
                        <span className="extra-small text-muted">
                          <i className="fas fa-calendar-alt me-1 text-mamcet-red"></i>{event.date}
                        </span>
                      </div>
                      <div className="d-flex flex-column align-items-center gap-2">
                        <i className="fas fa-chevron-right text-muted"></i>
                        <button
                          className="btn btn-link text-danger p-0 delete-btn"
                          title="Delete notification"
                          onClick={(e) => handleDeleteNotification('events', event.id, e)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Postings Section */}
            {filteredNotifications.jobs.length > 0 && (
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>💼</span>
                  <h5 className="fw-bold mb-0 text-dark">Job Postings</h5>
                  {filteredNotifications.jobs.filter(j => !j.isRead).length > 0 && (
                    <span
                      className="badge ms-2 fw-bold"
                      style={{ backgroundColor: '#c84022', borderRadius: '12px', fontSize: '0.7rem' }}
                    >
                      {filteredNotifications.jobs.filter(j => !j.isRead).length}
                    </span>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  {filteredNotifications.jobs.map(job => (
                    <div
                      key={job.id}
                      className="dashboard-card bg-white rounded-3 p-3 d-flex align-items-start gap-3"
                      style={{
                        cursor: 'pointer',
                        borderLeft: !job.isRead ? '4px solid #c84022' : '4px solid transparent',
                        transition: 'box-shadow 0.15s, transform 0.15s'
                      }}
                      onClick={() => {
                        const updated = {
                          ...notifications,
                          jobs: notifications.jobs.map(j =>
                            j.id === job.id ? { ...j, isRead: true } : j
                          )
                        };
                        updateNotifications(updated);
                        navigate('/jobs');
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '48px', height: '48px', backgroundColor: 'rgba(200,64,34,0.08)', fontSize: '1.4rem' }}
                      >
                        {job.icon}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <h6 className="fw-bold mb-0 text-dark">{job.title}</h6>
                          {!job.isRead && (
                            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#c84022', display: 'inline-block' }}></span>
                          )}
                        </div>
                        <p className="extra-small fw-semibold text-muted mb-1">
                          <i className="fas fa-building me-1 text-mamcet-red"></i>{job.company}
                        </p>
                        <p className="text-muted small mb-1" style={{ lineHeight: '1.4' }}>{job.description}</p>
                        <span className="extra-small text-muted">
                          <i className="fas fa-clock me-1 text-mamcet-red"></i>Posted {job.posted}
                        </span>
                      </div>
                      <div className="d-flex flex-column align-items-center gap-2">
                        <i className="fas fa-chevron-right text-muted"></i>
                        <button
                          className="btn btn-link text-danger p-0 delete-btn"
                          title="Delete notification"
                          onClick={(e) => handleDeleteNotification('jobs', job.id, e)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Messages Section */}
            {filteredNotifications.messages.length > 0 && (
              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>💬</span>
                  <h5 className="fw-bold mb-0 text-dark">Direct Messages</h5>
                  {filteredNotifications.messages.filter(m => !m.isRead).length > 0 && (
                    <span
                      className="badge ms-2 fw-bold"
                      style={{ backgroundColor: '#c84022', borderRadius: '12px', fontSize: '0.7rem' }}
                    >
                      {filteredNotifications.messages.filter(m => !m.isRead).length}
                    </span>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  {filteredNotifications.messages.map(message => (
                    <div
                      key={message.id}
                      className="dashboard-card bg-white rounded-3 p-3 d-flex align-items-start gap-3"
                      style={{
                        cursor: 'pointer',
                        borderLeft: !message.isRead ? '4px solid #c84022' : '4px solid transparent',
                        transition: 'box-shadow 0.15s, transform 0.15s'
                      }}
                      onClick={() => {
                        // Mark as read
                        const updated = {
                          ...notifications,
                          messages: notifications.messages.map(m =>
                            m.id === message.id ? { ...m, isRead: true, unreadCount: 0 } : m
                          )
                        };
                        updateNotifications(updated);
                        navigate(`/messaging?chatId=${message.chatId}`);
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = '';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: '48px', height: '48px', backgroundColor: '#c84022', fontSize: '0.85rem' }}
                      >
                        {message.avatar}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-dark">{message.sender}</h6>
                            {!message.isRead && (
                              <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: '#c84022', display: 'inline-block' }}></span>
                            )}
                          </div>
                          <span className="extra-small text-muted">{message.timestamp}</span>
                        </div>
                        <p className="text-muted small mb-1">{message.lastMessage}</p>
                        {message.unreadCount > 0 && (
                          <span className="badge extra-small fw-semibold" style={{ backgroundColor: '#e8f4fd', color: '#0b66c2', borderRadius: '4px' }}>
                            {message.unreadCount} unread message{message.unreadCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="align-self-center d-flex align-items-center gap-3">
                        {message.unreadCount > 0 && (
                          <span
                            className="badge rounded-pill text-white fw-bold"
                            style={{ backgroundColor: '#c84022', fontSize: '0.7rem' }}
                          >
                            {message.unreadCount}
                          </span>
                        )}
                        <div className="d-flex flex-column align-items-center gap-2">
                          <i className="fas fa-chevron-right text-muted" style={{ fontSize: '0.75rem' }}></i>
                          <button
                            className="btn btn-link text-danger p-0 delete-btn"
                            title="Delete notification"
                            onClick={(e) => handleDeleteNotification('messages', message.id, e)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notification;
