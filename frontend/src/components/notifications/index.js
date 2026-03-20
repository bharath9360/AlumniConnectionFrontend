import React from 'react';
import { storage } from '../../utils/storage';
import '../../styles/Notification.css';

/**
 * NotificationHeader Component - Top navigation bar with logo, menu, and icons
 */
export const NotificationHeader = ({ onBack, unreadCount }) => {
  const [userData, setUserData] = React.useState(null);

  React.useEffect(() => {
    setUserData(storage.getCurrentUser());
  }, []);

  return (
    <header className="notification-header">
      <div className="notification-header-container">
        {/* Back Arrow and Logo */}
        <div className="header-left">
          <button className="back-btn" onClick={onBack} aria-label="Go back">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-logo">
            <img 
              src="https://res.cloudinary.com/dnby5o1lt/image/upload/v1754489527/ALUMINI_CONNECT_LOGO_hwlrpw.png" 
              alt="Alumni Connect Logo" 
              className="logo-image"
            />
            <span className="logo-text">Alumni Connect</span>
          </div>
        </div>

        {/* Center Navigation Menu */}
        <nav className="header-nav d-none d-lg-flex">
          <a href="/alumni/home" className="nav-menu-item">Home</a>
          <a href="/alumni/jobs" className="nav-menu-item">Job</a>
          <a href="/alumni/events" className="nav-menu-item">Events</a>
        </nav>

        {/* Icons and Profile - Right Side */}
        <div className="header-right">
          <button className="icon-btn d-none d-md-flex" aria-label="Messages">
            <i className="fas fa-envelope"></i>
          </button>
          <button className="icon-btn active" aria-label="Notifications">
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {userData && (
            <div className="profile-section d-none d-md-flex">
              <div className="profile-avatar">
                {userData?.profilePic ? (
                  <img src={userData.profilePic} alt={userData?.name || "Profile"} />
                ) : (
                  <div className="avatar-initials">{userData?.name?.[0] || "?"}</div>
                )}
              </div>
              <span className="profile-label">{userData?.userType || "Student"}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/**
 * NotificationPageTitle Component - Page title with unread count
 */
export const NotificationPageTitle = ({ unreadCount }) => {
  return (
    <div className="notification-page-header">
      <div className="header-content">
        <h1 className="page-title">
          Notifications
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </h1>
      </div>
    </div>
  );
};

/**
 * MarkAsReadButton Component - Button to mark all notifications as read
 */
export const MarkAsReadButton = ({ unreadCount, onMarkAsRead }) => {
  if (unreadCount === 0) {
    return null;
  }

  return (
    <button 
      className="mark-as-read-btn"
      onClick={onMarkAsRead}
      title="Mark all notifications as read"
    >
      <i className="fas fa-check-circle"></i>
      Mark as Read
    </button>
  );
};

/**
 * SearchBar Component - Search functionality for notifications
 */
export const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="search-bar-wrapper">
      <div className="search-bar-container">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          aria-label="Search notifications"
        />
        {searchTerm && (
          <button
            className="clear-search-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * NotificationSection Component - Container for grouped notifications
 * Reusable for different notification categories
 */
export const NotificationSection = ({ title, count, icon, children }) => {
  return (
    <section className="notification-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <span className="section-icon">{icon}</span>
          <h2 className="section-title">{title}</h2>
        </div>
        <span className="section-count">{count}</span>
      </div>
      <div className="section-content">
        {children}
      </div>
    </section>
  );
};

/**
 * EventCard Component - Display individual event notification
 */
export const EventCard = ({ event, onClick }) => {
  return (
    <div 
      className={`notification-card event-card ${!event.isRead ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="card-left">
        <div className="card-icon-wrapper">
          <span className="card-icon">{event.icon}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{event.title}</h3>
          {!event.isRead && <span className="unread-indicator"></span>}
        </div>
        <p className="card-description">{event.description}</p>
        <div className="card-meta">
          <span className="card-date">
            <i className="fas fa-calendar-alt"></i>
            {event.date}
          </span>
        </div>
      </div>
      <div className="card-action">
        <i className="fas fa-chevron-right"></i>
      </div>
    </div>
  );
};

/**
 * JobCard Component - Display individual job posting notification
 */
export const JobCard = ({ job, onClick }) => {
  return (
    <div 
      className={`notification-card job-card ${!job.isRead ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="card-left">
        <div className="card-icon-wrapper">
          <span className="card-icon">{job.icon}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{job.title}</h3>
          {!job.isRead && <span className="unread-indicator"></span>}
        </div>
        <p className="card-company">
          <i className="fas fa-building"></i>
          {job.company}
        </p>
        <p className="card-description">{job.description}</p>
        <div className="card-meta">
          <span className="card-time">
            <i className="fas fa-clock"></i>
            Posted {job.posted}
          </span>
        </div>
      </div>
      <div className="card-action">
        <i className="fas fa-chevron-right"></i>
      </div>
    </div>
  );
};

/**
 * MessageCard Component - Display individual direct message notification
 */
export const MessageCard = ({ message, onClick }) => {
  return (
    <div 
      className={`notification-card message-card ${!message.isRead ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="card-left">
        <div className="message-avatar">
          {message.avatar}
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <div className="message-header-main">
            <h3 className="card-title">{message.sender}</h3>
            {!message.isRead && <span className="unread-indicator"></span>}
          </div>
          <span className="card-time">{message.timestamp}</span>
        </div>
        <p className="card-description message-preview">{message.lastMessage}</p>
        {message.unreadCount > 0 && (
          <div className="unread-count">
            {message.unreadCount} unread message{message.unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="card-action">
        {message.unreadCount > 0 && (
          <span className="unread-badge-count">{message.unreadCount}</span>
        )}
        <i className="fas fa-chevron-right"></i>
      </div>
    </div>
  );
};

const NotificationComponents = {
  NotificationHeader,
  NotificationPageTitle,
  MarkAsReadButton,
  SearchBar,
  NotificationSection,
  EventCard,
  JobCard,
  MessageCard
};

export default NotificationComponents;
