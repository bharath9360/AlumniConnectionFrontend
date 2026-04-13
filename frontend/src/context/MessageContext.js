import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { chatService } from '../services/api';

const MessageContext = createContext(null);

export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket() || {};
  
  // STEP 4: UNREAD COUNT LOGIC - Maintain array of unread messages
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const activeChatIdRef = useRef(null);

  // STEP 4: count messages where receiverId === currentUser AND read === false
  // (In our schema: senderId != currentUser._id & not marked read)
  const updateUnreadCount = useCallback((messages) => {
    if (!user) return;
    const count = messages.filter(msg => {
      const senderId = msg.senderId?._id || msg.senderId;
      return senderId !== user._id && !msg.isRead;
    }).length;
    setTotalUnreadCount(count);
  }, [user]);

  // Fetch initial unread messages
  const fetchUnreadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await chatService.getUnreadMessages();
      setUnreadMessages(data.data || []);
      updateUnreadCount(data.data || []);
    } catch (_) { /* silent */ }
  }, [user, updateUnreadCount]);

  useEffect(() => {
    if (user) {
      fetchUnreadMessages();
    } else {
      setUnreadMessages([]);
      setTotalUnreadCount(0);
    }
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const wasDisconnectedRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    if (!isConnected) {
      wasDisconnectedRef.current = true;
      return;
    }
    if (wasDisconnectedRef.current) {
      wasDisconnectedRef.current = false;
      fetchUnreadMessages();
    }
  }, [isConnected, user, fetchUnreadMessages]);

  // STEP 5: ON CHAT OPEN mark messages as read
  const markChatAsRead = useCallback((chatId) => {
    if (!chatId) return;
    const key = chatId.toString();
    setUnreadMessages(prev => {
      const next = prev.filter(msg => {
        const msgChatId = msg.chatId?._id || msg.chatId;
        return msgChatId?.toString() !== key;
      });
      updateUnreadCount(next);
      return next;
    });
    chatService.markChatRead(key).catch(() => {});
  }, [updateUnreadCount]);

  const setActiveChatId = useCallback((chatId) => {
    activeChatIdRef.current = chatId ? chatId.toString() : null;
    if (chatId) {
      markChatAsRead(chatId);
    }
  }, [markChatAsRead]);

  // STEP 3: FRONTEND SOCKET
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      const msgChatId = (msg.chatId?._id || msg.chatId)?.toString();
      if (activeChatIdRef.current && activeChatIdRef.current === msgChatId) {
        // Chat is open, mark as read instantly
        markChatAsRead(msgChatId);
        return;
      }
      setUnreadMessages(prev => {
        const next = [...prev, msg];
        updateUnreadCount(next);
        return next;
      });
    };
    
    // Listen to "newMessage" as requested in STEP 3
    socket.on('newMessage', handleNewMessage);
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, markChatAsRead, updateUnreadCount]);

  // Make unreadMap locally computed for backward compatibility in UI (optional)
  const unreadMap = {};
  unreadMessages.forEach(msg => {
    const cid = (msg.chatId?._id || msg.chatId)?.toString();
    if (cid && (msg.senderId?._id || msg.senderId) !== user?._id && !msg.isRead) {
      unreadMap[cid] = (unreadMap[cid] || 0) + 1;
    }
  });

  return (
    <MessageContext.Provider
      value={{
        unreadMap,
        totalUnreadCount,
        markChatAsRead,
        setActiveChatId,
        fetchUnreadCounts: fetchUnreadMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
