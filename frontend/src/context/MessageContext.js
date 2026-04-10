import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { chatService } from '../services/api';

const MessageContext = createContext(null);

export const useMessage = () => useContext(MessageContext);

// ─────────────────────────────────────────────────────────────────
// MessageProvider — Single source of truth for unread message counts.
//
// KEY DESIGN: Messaging.js reads unreadMap directly from this context
// instead of maintaining its own local unreadCounts state.
// This eliminates the count mismatch between sidebar badge and chat list.
// ─────────────────────────────────────────────────────────────────
export const MessageProvider = ({ children }) => {
  const { user }                           = useAuth();
  const { socket }                         = useSocket() || {};
  const [unreadMap,       setUnreadMap]    = useState({});   // { chatId: count } — per-chat unread
  const [totalUnreadCount, setTotalUnread] = useState(0);
  const activeChatIdRef                    = useRef(null);   // which chat the user has open

  // ── Derive total whenever map changes ────────────────────────
  const recalcTotal = useCallback((map) => {
    const total = Object.values(map).reduce((sum, n) => sum + (n || 0), 0);
    setTotalUnread(total);
  }, []);

  // ── Fetch from REST: GET /api/chat/unread-count ──────────────
  const fetchUnreadCounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await chatService.getUnreadCounts();
      const map = data.data || {};
      setUnreadMap(map);
      recalcTotal(map);
    } catch (_) { /* silent */ }
  }, [user, recalcTotal]);

  // Fetch on login; clear on logout
  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    } else {
      setUnreadMap({});
      setTotalUnread(0);
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark a chat as read ──────────────────────────────────────
  const markChatAsRead = useCallback((chatId) => {
    if (!chatId) return;
    const key = chatId.toString();
    setUnreadMap(prev => {
      if (prev[key] === 0) return prev; // already zero, skip re-render
      const next = { ...prev, [key]: 0 };
      recalcTotal(next);
      return next;
    });
    // Persist on server (fire-and-forget)
    chatService.markChatRead(key).catch(() => {});
  }, [recalcTotal]);

  // ── Increment when a real-time message arrives ───────────────
  const incrementUnread = useCallback((chatId) => {
    if (!chatId) return;
    const key = chatId.toString();
    // If the incoming chat is already open, mark read immediately
    if (activeChatIdRef.current && activeChatIdRef.current === key) {
      markChatAsRead(key);
      return;
    }
    setUnreadMap(prev => {
      const next = { ...prev, [key]: (prev[key] || 0) + 1 };
      recalcTotal(next);
      return next;
    });
  }, [markChatAsRead, recalcTotal]);

  // ── Set/clear which chat is currently open ───────────────────
  const setActiveChatId = useCallback((chatId) => {
    activeChatIdRef.current = chatId ? chatId.toString() : null;
  }, []);

  // ── Global real-time listener for ALL pages ────────────────────
  useEffect(() => {
    if (!socket) return;
    const handleGlobalNewMessage = (newMessage) => {
      const msgChatId = (newMessage.chatId?._id || newMessage.chatId)?.toString();
      if (msgChatId) incrementUnread(msgChatId);
    };
    socket.on('message_received', handleGlobalNewMessage);
    return () => {
      socket.off('message_received', handleGlobalNewMessage);
    };
  }, [socket, incrementUnread]);

  return (
    <MessageContext.Provider
      value={{
        unreadMap,            // { chatId: unreadCount } — use this in ChatItem
        totalUnreadCount,     // scalar for Navbar badge
        markChatAsRead,
        incrementUnread,
        setActiveChatId,
        fetchUnreadCounts,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
