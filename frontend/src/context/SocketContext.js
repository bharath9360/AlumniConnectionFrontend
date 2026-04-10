import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/api';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef              = useRef(null);
  const reconnectTimeoutRef    = useRef(null);
  const [socket,        setSocket]       = useState(null);
  const [isConnected,   setIsConnected]  = useState(false);
  const [onlineUsers,   setOnlineUsers]  = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // ── Shared notification state (single source of truth) ────────
  const [notifications, setNotifications] = useState([]);
  const [notifLoaded,   setNotifLoaded]   = useState(false);

  // ── Fetch notifications from REST ──────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationService.getNotifications();
      if (res.data?.data) {
        setNotifications(res.data.data);
        setNotifLoaded(true);
      }
    } catch { /* silent */ }
  }, [user]);

  // ── Socket setup ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setReconnectAttempts(0);
      }
      setNotifications([]);
      setNotifLoaded(false);
      return;
    }

    // ── Production-ready socket config ─────────────────────────
    const sock = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],   // fallback for firewalls
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,                // start at 1s
      reconnectionDelayMax: 5000,             // cap at 5s
      timeout: 20000,                         // 20s connection timeout
      autoConnect: true,
      forceNew: false,
      path: '/socket.io/',
      withCredentials: true,
      upgrade: true,                          // allow polling → websocket
      rememberUpgrade: true,                  // skip polling on next connect
    });

    socketRef.current = sock;
    setSocket(sock);

    // ── Connection success ────────────────────────────────────
    const doSetup = () => {
      sock.emit('setup', user);
      setIsConnected(true);
      setReconnectAttempts(0);
    };

    sock.on('connect', doSetup);
    sock.on('connected', () => setIsConnected(true));

    // ── Disconnect handling ───────────────────────────────────
    sock.on('disconnect', (reason) => {
      setIsConnected(false);
      // Server forcefully disconnected (deploy restart) — manual reconnect
      if (reason === 'io server disconnect') {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          sock.connect();
        }, 1000);
      }
    });

    // ── Reconnection lifecycle ────────────────────────────────
    sock.on('reconnect_attempt', (attemptNumber) => {
      setReconnectAttempts(attemptNumber);
    });

    sock.on('reconnect', () => {
      // Re-establish identity after reconnect
      setIsConnected(true);
      setReconnectAttempts(0);
      sock.emit('setup', user);
    });

    sock.on('reconnect_failed', () => {
      setIsConnected(false);
    });

    sock.on('connect_error', (err) => {
      // Silently log — no aggressive UI spam
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Socket connection error:', err.message);
      }
      setIsConnected(false);
    });

    sock.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // ── Real-time notification push ───────────────────────────
    sock.on('notification_received', (notif) => {
      setNotifications(prev => {
        // Avoid duplicates (server might emit twice on reconnect)
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    });

    // ── Online status: batch broadcast ────────────────────────
    sock.on('online_users', (userIds) => {
      setOnlineUsers(Array.isArray(userIds) ? userIds : []);
    });

    // ── Online status: instant per-user events ────────────────
    sock.on('user_joined', (userId) => {
      if (!userId) return;
      setOnlineUsers(prev => {
        const uid = userId.toString();
        return prev.includes(uid) ? prev : [...prev, uid];
      });
    });

    sock.on('user_left', (userId) => {
      if (!userId) return;
      setOnlineUsers(prev => prev.filter(id => id !== userId.toString()));
    });

    // Initial REST fetch + 60s polling fallback
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      clearInterval(interval);
      clearTimeout(reconnectTimeoutRef.current);

      sock.off('connect');
      sock.off('connected');
      sock.off('disconnect');
      sock.off('reconnect_attempt');
      sock.off('reconnect');
      sock.off('reconnect_failed');
      sock.off('connect_error');
      sock.off('error');
      sock.off('notification_received');
      sock.off('online_users');
      sock.off('user_joined');
      sock.off('user_left');

      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
      setReconnectAttempts(0);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // ── Shared notification actions ────────────────────────────────
  const markOneRead = useCallback(async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }, []);

  const deleteNotif = useCallback(async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* silent */ }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch { /* silent */ }
  }, []);

  const isOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  // Bell badge: everything except chat notifications (those live in the sidebar)
  const unreadCount = notifications.filter(n => !n.isRead && n.type !== 'message').length;
  // Messaging icon badge: only message notifications
  const unreadMessageCount = notifications.filter(n => !n.isRead && n.type === 'message').length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        isOnline,
        reconnectAttempts,
        // Shared notification state
        notifications,
        unreadCount,
        unreadMessageCount,
        notifLoaded,
        fetchNotifications,
        markOneRead,
        markAllRead,
        deleteNotif,
        clearAll,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
