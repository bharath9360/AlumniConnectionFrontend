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
  const [socket,        setSocket]       = useState(null);
  const [isConnected,   setIsConnected]  = useState(false);
  const [onlineUsers,   setOnlineUsers]  = useState([]);

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
        setIsConnected(false);
        setOnlineUsers([]);
      }
      setNotifications([]);
      setNotifLoaded(false);
      return;
    }

    const sock = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = sock;
    setSocket(sock);

    const doSetup = () => {
      sock.emit('setup', user);
      setIsConnected(true);
    };

    sock.on('connect', doSetup);
    sock.on('connected', () => setIsConnected(true));
    sock.on('reconnect', doSetup);

    // Real-time notification push — prepend to shared list
    sock.on('notification_received', (notif) => {
      setNotifications(prev => {
        // Avoid duplicates (server might emit twice on reconnect)
        if (prev.some(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    });

    sock.on('online_users', (userIds) => {
      setOnlineUsers(Array.isArray(userIds) ? userIds : []);
    });

    sock.on('disconnect', () => setIsConnected(false));
    sock.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
    });

    // Initial REST fetch + 60s polling fallback
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);

    return () => {
      clearInterval(interval);
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
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
