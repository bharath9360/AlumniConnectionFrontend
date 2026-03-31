import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef             = useRef(null);
  const [socket,       setSocket]      = useState(null); // state so consumers re-render on connect
  const [isConnected, setIsConnected] = useState(false);
  // Full list of online user IDs — populated by server broadcast
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    // Create socket connection
    const sock = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = sock;
    setSocket(sock); // expose as state so consumers re-render when connected

    const doSetup = () => {
      sock.emit('setup', user);
      setIsConnected(true);
    };

    sock.on('connect', doSetup);
    sock.on('connected', () => setIsConnected(true));

    // Re-register after reconnection so presence stays accurate
    sock.on('reconnect', doSetup);

    // Server broadcasts the full list of online user IDs on every change
    sock.on('online_users', (userIds) => {
      setOnlineUsers(Array.isArray(userIds) ? userIds : []);
    });

    sock.on('disconnect', () => setIsConnected(false));
    sock.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]); // intentional: re-connect only on identity change, not every render

  /**
   * Helper: check if a given userId is currently online.
   * @param {string} userId
   * @returns {boolean}
   */
  const isOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.includes(userId.toString());
  };

  return (
    <SocketContext.Provider
      value={{
        socket,           // state-tracked — consumers re-render when it's ready
        isConnected,
        onlineUsers,
        isOnline,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
