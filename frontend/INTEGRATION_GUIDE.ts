/**
 * INTEGRATION GUIDE FOR NOTIFICATION COMPONENTS
 * 
 * This file shows how to integrate the Notification page and components
 * into your React application with routing and state management
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ============================================================
// METHOD 1: Basic Integration with React Router
// ============================================================

import Notification from './pages/Home/Notification';

export const BasicRoutingExample = () => {
  return (
    <Router>
      <Routes>
        <Route path="/notifications" element={<Notification />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
};

// ============================================================
// METHOD 2: Lazy Load Notification Page (Performance Optimization)
// ============================================================

const NotificationLazy = React.lazy(() => import('./pages/Home/Notification'));

export const LazyLoadingExample = () => {
  return (
    <Router>
      <Routes>
        <Route 
          path="/notifications" 
          element={
            <React.Suspense fallback={<div>Loading...</div>}>
              <NotificationLazy />
            </React.Suspense>
          } 
        />
      </Routes>
    </Router>
  );
};

// ============================================================
// METHOD 3: Integration with Context API (State Management)
// ============================================================

import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationContextProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    events: [],
    jobs: [],
    messages: []
  });

  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = (notificationType, notificationId) => {
    setNotifications(prev => ({
      ...prev,
      [notificationType]: prev[notificationType].map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    }));
  };

  const markAllAsRead = () => {
    setNotifications(prev => ({
      events: prev.events.map(n => ({ ...n, isRead: true })),
      jobs: prev.jobs.map(n => ({ ...n, isRead: true })),
      messages: prev.messages.map(n => ({ ...n, isRead: true }))
    }));
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        setNotifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationContextProvider');
  }
  return context;
};

// ============================================================
// METHOD 4: Full App Setup with Routing and Context
// ============================================================

interface AppConfig {
  apiUrl: string;
  enableNotifications: boolean;
}

const defaultConfig: AppConfig = {
  apiUrl: 'https://api.alumni-connect.com',
  enableNotifications: true
};

export const FullAppSetupExample = ({ config = defaultConfig }) => {
  return (
    <NotificationContextProvider>
      <Router>
        <Routes>
          {config.enableNotifications && (
            <Route path="/notifications" element={<Notification />} />
          )}
          {/* Other routes */}
        </Routes>
      </Router>
    </NotificationContextProvider>
  );
};

// ============================================================
// METHOD 5: Using Individual Components
// ============================================================

import {
  NotificationHeader,
  NotificationPageTitle,
  MarkAsReadButton,
  SearchBar,
  NotificationSection,
  EventCard,
  JobCard,
  MessageCard
} from './components/notifications';

export const CustomNotificationPageExample = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [unreadCount, setUnreadCount] = React.useState(5);

  const sampleEvents = [
    {
      id: '1',
      title: 'Alumni Meetup',
      category: 'College Events',
      description: 'Join us for our monthly alumni meetup',
      date: 'March 20, 2026',
      isRead: false,
      icon: '🎯'
    }
  ];

  return (
    <div className="notification-page-wrapper">
      <NotificationHeader onBack={() => window.history.back()} unreadCount={unreadCount} />
      
      <div className="notification-container">
        <NotificationPageTitle unreadCount={unreadCount} />
        
        <div className="notification-actions-bar">
          <MarkAsReadButton 
            unreadCount={unreadCount}
            onMarkAsRead={() => setUnreadCount(0)}
          />
        </div>
        
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
        
        <div className="notification-content">
          <NotificationSection title="College Events" count={1} icon="📅">
            {sampleEvents.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                onClick={() => console.log('Event clicked', event)}
              />
            ))}
          </NotificationSection>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// METHOD 6: Integration with Redux (if using Redux store)
// ============================================================

/**
 * Redux Integration Example
 * Assuming you have Redux set up with notifications reducer
 */

// Redux action types
export const NOTIFICATION_ACTIONS = {
  FETCH_NOTIFICATIONS: 'FETCH_NOTIFICATIONS',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  SEARCH_NOTIFICATIONS: 'SEARCH_NOTIFICATIONS'
};

// Redux reducer (example structure)
export const notificationReducer = (
  state = {
    events: [],
    jobs: [],
    messages: [],
    loading: false,
    error: null
  },
  action
) => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.FETCH_NOTIFICATIONS:
      return {
        ...state,
        events: action.payload.events,
        jobs: action.payload.jobs,
        messages: action.payload.messages,
        loading: false
      };
    
    case NOTIFICATION_ACTIONS.MARK_ALL_AS_READ:
      return {
        ...state,
        events: state.events.map(e => ({ ...e, isRead: true })),
        jobs: state.jobs.map(j => ({ ...j, isRead: true })),
        messages: state.messages.map(m => ({ ...m, isRead: true }))
      };
    
    default:
      return state;
  }
};

// Redux action creators
export const notificationActions = {
  fetchNotifications: () => ({
    type: NOTIFICATION_ACTIONS.FETCH_NOTIFICATIONS,
    payload: {}
  }),
  
  markAllAsRead: () => ({
    type: NOTIFICATION_ACTIONS.MARK_ALL_AS_READ
  })
};

// Component using Redux (example)
export const NotificationWithReduxExample = () => {
  // const dispatch = useDispatch();
  // const notifications = useSelector(state => state.notifications);
  
  // React.useEffect(() => {
  //   dispatch(notificationActions.fetchNotifications());
  // }, [dispatch]);
  
  // return <Notification {...notifications} />;
};

// ============================================================
// METHOD 7: API Integration Pattern
// ============================================================

export const NotificationService = {
  /**
   * Fetch all notifications from API
   */
  fetchNotifications: async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return await response.json();
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};

// ============================================================
// METHOD 8: Complete App Example with Notifications
// ============================================================

export const CompleteAppExample = () => {
  return (
    <NotificationContextProvider>
      <Router>
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<div>Home</div>} />
          <Route path="/alumni/home" element={<div>Alumni Dashboard</div>} />
          
          {/* Notification Pages */}
          <Route path="/notifications" element={<Notification />} />
          
          {/* Lazy loaded routes */}
          <Route 
            path="/profile" 
            element={
              <React.Suspense fallback={<div>Loading...</div>}>
                <div>User Profile</div>
              </React.Suspense>
            }
          />
          
          {/* 404 Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </NotificationContextProvider>
  );
};

// ============================================================
// METHOD 9: Notification Badge in Navbar
// ============================================================

import { useNavigate } from 'react-router-dom';

export const NotificationNavbarIntegration = () => {
  const navigate = useNavigate();
  // const { unreadCount } = useNotifications(); // If using Context
  const unreadCount = 5; // Placeholder

  return (
    <div className="navbar-notification-section">
      <button 
        className="notification-icon-btn"
        onClick={() => navigate('/notifications')}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
};

// ============================================================
// METHOD 10: Real-time Notifications with WebSocket
// ============================================================

export class NotificationWebSocketManager {
  private ws: WebSocket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect(userId: string, token: string) {
    this.ws = new WebSocket(`wss://api.alumni-connect.com/ws/notifications/${userId}`);

    this.ws.onopen = () => {
      console.log('Connected to notification WebSocket');
      this.send({ action: 'authenticate', token });
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('notification', data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from notification WebSocket');
    };
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  emit(event: string, data: any) {
    this.callbacks.get(event)?.forEach(callback => callback(data));
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage of WebSocket Manager
export const NotificationWithWebSocketExample = () => {
  const wsManager = React.useRef(new NotificationWebSocketManager()).current;

  React.useEffect(() => {
    const userId = 'user123'; // Get from auth context
    const token = 'auth_token'; // Get from auth context

    wsManager.connect(userId, token);

    wsManager.on('notification', (notification) => {
      console.log('New notification received:', notification);
      // Update state with new notification
    });

    wsManager.on('error', (error) => {
      console.error('Notification error:', error);
    });

    return () => {
      wsManager.disconnect();
    };
  }, [wsManager]);

  return <Notification />;
};

export default {
  BasicRoutingExample,
  LazyLoadingExample,
  NotificationContextProvider,
  useNotifications,
  FullAppSetupExample,
  CustomNotificationPageExample,
  NotificationService,
  CompleteAppExample,
  NotificationNavbarIntegration,
  NotificationWebSocketManager,
  NotificationWithWebSocketExample
};
