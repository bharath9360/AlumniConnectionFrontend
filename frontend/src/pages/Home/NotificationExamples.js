/**
 * REUSABLE COMPONENTS EXAMPLES
 * This file demonstrates how to use and extend the Notification components
 * for building similar notification systems in other parts of the application
 */

import React, { useState } from 'react';
import {
  NotificationHeader,
  NotificationPageTitle,
  MarkAsReadButton,
  SearchBar,
  NotificationSection,
  EventCard,
  JobCard,
  MessageCard
} from '../components/notifications';

/**
 * EXAMPLE 1: Creating a Simple Alerts Page
 * Reuses NotificationHeader, SearchBar, and creates custom alert cards
 */
export const AlertsPageExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'Profile Incomplete',
      description: 'Complete your profile to get better job recommendations',
      type: 'warning',
      icon: '⚠️',
      timestamp: '2 hours ago',
      isRead: false
    }
  ]);

  return (
    <div>
      <NotificationHeader unreadCount={1} onBack={() => {}} />
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <NotificationSection title="Alerts" count={1} icon="🔔">
        {alerts.map(alert => (
          <EventCard key={alert.id} event={alert} onClick={() => {}} />
        ))}
      </NotificationSection>
    </div>
  );
};

/**
 * EXAMPLE 2: Creating a Dashboard Widget
 * Reuses NotificationSection and EventCard as a compact widget
 */
export const UpcomingEventsWidgetExample = () => {
  const events = [
    {
      id: 1,
      title: 'Tech Summit 2026',
      description: 'Annual technology conference with industry experts',
      date: 'April 10, 2026',
      icon: '📱',
      isRead: true
    },
    {
      id: 2,
      title: 'Networking Breakfast',
      description: 'Join peers for morning networking and breakfast',
      date: 'April 15, 2026',
      icon: '🥐',
      isRead: true
    }
  ];

  return (
    <div style={{ maxWidth: '400px' }}>
      <NotificationSection title="Upcoming Events" count={2} icon="📅">
        {events.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            onClick={() => console.log(event)}
          />
        ))}
      </NotificationSection>
    </div>
  );
};

/**
 * EXAMPLE 3: Creating a Job Recommendations Page
 * Reuses NotificationSection, SearchBar, and JobCard
 */
export const JobRecommendationsPageExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs] = useState([
    {
      id: 1,
      title: 'Senior Developer',
      company: 'Google',
      description: 'Build scalable systems with our engineering team',
      posted: '3 days ago',
      icon: '💻',
      isRead: false
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'Meta',
      description: 'Lead product strategy and cross-functional teams',
      posted: '1 week ago',
      icon: '📊',
      isRead: false
    }
  ]);

  const filtered = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <NotificationPageTitle unreadCount={2} />
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <NotificationSection title="Recommended Jobs" count={filtered.length} icon="💼">
        {filtered.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => console.log(job)}
          />
        ))}
      </NotificationSection>
    </div>
  );
};

/**
 * EXAMPLE 4: Creating a Messages/Chat List
 * Reuses MessageCard for displaying recent conversations
 */
export const ChatListExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [messages] = useState([
    {
      id: 1,
      sender: 'Alice Johnson',
      lastMessage: 'Can you review my resume?',
      unreadCount: 2,
      timestamp: 'Just now',
      avatar: 'AJ',
      isRead: false
    },
    {
      id: 2,
      sender: 'Bob Smith',
      lastMessage: 'Let\'s meet tomorrow at 3 PM',
      unreadCount: 0,
      timestamp: '30 mins ago',
      avatar: 'BS',
      isRead: true
    }
  ]);

  const filtered = messages.filter(msg =>
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <NotificationSection title="Messages" count={filtered.length} icon="💬">
        {filtered.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            onClick={() => console.log(msg)}
          />
        ))}
      </NotificationSection>
    </div>
  );
};

/**
 * EXAMPLE 5: Creating a Custom Card Component
 * Pattern to follow for creating new card types
 */
export const AnnounceCardExample = ({ announcement, onClick }) => {
  // Follow the same structure as EventCard, JobCard, MessageCard
  return (
    <div 
      className={`notification-card announce-card ${!announcement.isRead ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="card-left">
        <div className="card-icon-wrapper">
          <span className="card-icon">{announcement.icon}</span>
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{announcement.title}</h3>
          {!announcement.isRead && <span className="unread-indicator"></span>}
        </div>
        <p className="card-description">{announcement.content}</p>
        <div className="card-meta">
          <span className="card-date">
            <i className="fas fa-calendar-alt"></i>
            {announcement.publishedDate}
          </span>
          <span className="card-time">
            <i className="fas fa-user"></i>
            {announcement.author}
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
 * EXAMPLE 6: Creating a Multi-category Page (Advanced)
 * Combines multiple NotificationSection components with different data
 */
export const HubPageExample = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data] = useState({
    urgent: [
      {
        id: 1,
        title: 'Action Required: Verify Your Email',
        description: 'Please verify your email to maintain access',
        icon: '🚨',
        isRead: false
      }
    ],
    trending: [
      {
        id: 2,
        title: 'New AI Job Opportunities',
        company: 'Tech Leaders Inc.',
        description: 'Growing demand for AI/ML specialists',
        icon: '🤖',
        posted: 'today',
        isRead: false
      }
    ],
    connections: [
      {
        id: 3,
        sender: 'Alumni Network',
        lastMessage: '15 new connection requests',
        unreadCount: 15,
        timestamp: 'now',
        avatar: 'AN',
        isRead: false
      }
    ]
  });

  return (
    <div>
      <NotificationPageTitle unreadCount={3} />
      <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <NotificationSection title="Urgent" count={1} icon="🚨">
        {data.urgent.map(item => (
          <EventCard key={item.id} event={item} onClick={() => {}} />
        ))}
      </NotificationSection>

      <NotificationSection title="Trending Jobs" count={1} icon="📈">
        {data.trending.map(job => (
          <JobCard key={job.id} job={job} onClick={() => {}} />
        ))}
      </NotificationSection>

      <NotificationSection title="Connections" count={1} icon="👥">
        {data.connections.map(conn => (
          <MessageCard key={conn.id} message={conn} onClick={() => {}} />
        ))}
      </NotificationSection>
    </div>
  );
};

/**
 * EXAMPLE 7: Custom Styling Override
 * Shows how to customize component styles
 */
export const StyledNotificationExample = () => {
  return (
    <div style={{
      // Override CSS variables for custom colors
      '--primary-red': '#8B0000',
      '--primary-red-dark': '#660000',
      '--bg-light': '#f5f5f5',
      '--text-dark': '#222222'
    }}>
      {/* Your notification components here will use custom colors */}
    </div>
  );
};

/**
 * EXAMPLE 8: Combining with State Management
 * Shows integration with Redux or Context API patterns
 */
export const StateManagementExample = () => {
  // This could be Redux state, Context state, or any state management solution
  const notifications = {
    events: [],
    jobs: [],
    messages: []
  };

  const dispatch = (action) => {
    // Handle dispatch
  };

  return (
    <div>
      {/* Your notification UI */}
      <button onClick={() => {
        // Dispatch action to mark as read
        dispatch({ type: 'MARK_ALL_READ' });
      }}>
        Mark as Read
      </button>
    </div>
  );
};

export default {
  AlertsPageExample,
  UpcomingEventsWidgetExample,
  JobRecommendationsPageExample,
  ChatListExample,
  AnnounceCardExample,
  HubPageExample,
  StyledNotificationExample,
  StateManagementExample
};
