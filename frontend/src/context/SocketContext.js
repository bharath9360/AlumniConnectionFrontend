import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { addNotification, fetchNotifications } = useNotifications();

  const socketRef           = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [socket,            setSocket]          = useState(null);
  const [isConnected,       setIsConnected]     = useState(false);
  const [onlineUsers,       setOnlineUsers]     = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // ── Socket setup ─────────────────────────────────────────────
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
      return;
    }

    // ── Production-ready socket config ────────────────────────
    const sock = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],   // fallback for firewalls
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,               // start at 1s
      reconnectionDelayMax: 5000,            // cap at 5s
      timeout: 20000,                        // 20s connection timeout
      autoConnect: true,
      forceNew: false,
      path: '/socket.io/',
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: true,
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

    // ── Disconnect handling ────────────────────────────────────
    sock.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => sock.connect(), 1000);
      }
    });

    // ── Reconnection lifecycle ─────────────────────────────────
    sock.on('reconnect_attempt', (n) => setReconnectAttempts(n));

    sock.on('reconnect', () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      sock.emit('setup', user);
      // Re-sync missed notifications after reconnect
      fetchNotifications();
    });

    sock.on('reconnect_failed', () => setIsConnected(false));

    sock.on('connect_error', (err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Socket connection error:', err.message);
      }
      setIsConnected(false);
    });

    sock.on('error', (error) => console.error('Socket error:', error));

    // ── Real-time notification push → delegated to NotificationContext ──
    sock.on('notification_received', (notif) => {
      addNotification(notif);
    });

    // ── Online presence ───────────────────────────────────────
    sock.on('online_users', (userIds) => {
      setOnlineUsers(Array.isArray(userIds) ? userIds : []);
    });

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

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
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

  const isOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  }, [onlineUsers]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        isOnline,
        reconnectAttempts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
