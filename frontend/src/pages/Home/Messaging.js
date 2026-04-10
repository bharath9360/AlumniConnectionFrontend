import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatService, connectionService, mentorshipService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import {
  ChatSidebar,
  ChatItem,
  ChatWindow,
  ChatEmptyState,
  ProfilePreviewPanel,
  TypingIndicator,
  UserResultItem,
} from '../../components/messaging';
import { ChatListSkeleton, MessagesSkeleton, EmptyState } from '../../components/common/Skeletons';
import toast from 'react-hot-toast';
import '../../styles/Messaging.css';

const Messaging = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // ── Pull shared socket + online users + connection status ──
  const { socket: contextSocket, onlineUsers, isConnected, reconnectAttempts } = useSocket();
  // ── Use MessageContext as single source for unread counts ───────────────────
  const { unreadMap, markChatAsRead, incrementUnread, setActiveChatId } = useMessage();

  const [chats,             setChats]             = useState([]);
  const [activeChat,        setActiveChat]         = useState(null);
  const [messages,          setMessages]           = useState([]);
  const [loading,           setLoading]            = useState(true);
  const [msgInput,          setMsgInput]           = useState('');
  const [search,            setSearch]             = useState('');
  const [callingChat,       setCallingChat]        = useState(null);
  const [mobileView,        setMobileView]         = useState('list'); // 'list' | 'chat'
  const [isComposing,       setIsComposing]        = useState(false);
  const [searchResults,     setSearchResults]      = useState([]);
  const [isTyping,          setIsTyping]           = useState(false);
  const [blockedChats,      setBlockedChats]       = useState({});
  const [showProfilePanel,  setShowProfilePanel]   = useState(false);
  const [isSendingRequest,  setIsSendingRequest]   = useState(false);

  // ── Pagination state ─────────────────────────────────────────
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const location        = useLocation();
  const socketRef       = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectChatRef   = useRef(null);
  // Keep a ref of activeChat._id so socket handlers always see current value
  const activeChatIdRef = useRef(null);

  // ── Enrich chat doc with display info ────────────────────────
  const enrichChat = useCallback((chat, currentUserId, onlineList = []) => {
    if (chat.isGroupChat) {
      return {
        ...chat,
        userName:    chat.chatName || 'Group Chat',
        userInitial: (chat.chatName || 'G').charAt(0).toUpperCase(),
        userRole:    'group',
        otherUserId: chat._id,
        status:      'online',
      };
    }

    // Find the participant who is NOT the current user
    const otherParticipant = chat.participants?.find(p => {
      const pid = p?._id?.toString() || p?.toString();
      return pid !== currentUserId?.toString();
    });
    const otherId = otherParticipant?._id?.toString() || '';
    return {
      ...chat,
      userName:    otherParticipant?.name || 'Unknown User',
      userInitial: (otherParticipant?.name || 'U').charAt(0).toUpperCase(),
      userRole:    otherParticipant?.role || '',
      company:     otherParticipant?.company || '',
      profilePic:  otherParticipant?.profilePic || '',
      otherUserId: otherId,
      status:      onlineList.includes(otherId) ? 'online' : 'offline',
    };
  }, []);

  // ── Fetch all chats on mount ──────────────────────────────────
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await chatService.fetchChats();
        const enriched = data.map(chat => enrichChat(chat, user._id, onlineUsers));
        setChats(enriched);

        // Deep-link: /messages?chatId=xxx or /messages/:chatId
        const params = new URLSearchParams(location.search);
        const chatId = params.get('chatId');
        if (chatId) {
          const target = enriched.find(c => c._id === chatId);
          if (target) selectChat(target);
        }
      } catch (err) {
        console.error('Failed to fetch chats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchChats();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-derive online status INSTANTLY when onlineUsers changes ─
  // No latency: this runs synchronously whenever the socket broadcasts the updated list
  useEffect(() => {
    if (!user || chats.length === 0) return;
    setChats(prev =>
      prev.map(chat => ({
        ...chat,
        status: chat.isGroupChat
          ? 'online'
          : (onlineUsers.includes(chat.otherUserId) ? 'online' : 'offline'),
      }))
    );
    if (activeChat?.otherUserId) {
      setActiveChat(prev =>
        prev ? {
          ...prev,
          status: onlineUsers.includes(prev.otherUserId) ? 'online' : 'offline',
        } : prev
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineUsers]);

  // ── Socket setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !contextSocket) return;

    const socket = contextSocket;
    socketRef.current = socket;

    // ────────────────────────────────────────────────────────────
    // message_received — new real-time message from another user
    // ────────────────────────────────────────────────────────────
    const handleNewMessage = (newMessage) => {
      const msgChatId = (newMessage.chatId?._id || newMessage.chatId)?.toString();
      const currentChatId = activeChatIdRef.current;

      if (currentChatId && currentChatId === msgChatId) {
        // Chat is open → append immediately + mark read
        setMessages(prev => [...prev, newMessage]);
        markChatAsRead(msgChatId);
      } else {
        // MessageContext global listener handles incrementing the read badge
      }

      // Always update sidebar preview + sort to top
      setChats(prev => {
        const updated = prev.map(c => {
          if (c._id === msgChatId) {
            return {
              ...c,
              lastMessage: {
                text:      newMessage.text || (newMessage.image ? '📷 Image' : ''),
                senderId:  newMessage.senderId?._id || newMessage.senderId,
                timestamp: newMessage.createdAt || new Date().toISOString(),
              },
            };
          }
          return c;
        });
        return updated.sort((a, b) => {
          const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0);
          const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0);
          return bTime - aTime;
        });
      });
    };

    // ────────────────────────────────────────────────────────────
    // messages_read — recipient opened our chat → update ticks
    // Emitted by backend after PUT /api/chat/:chatId/read
    // ────────────────────────────────────────────────────────────
    const handleMessagesRead = ({ chatId, readBy }) => {
      // Only update messages that belong to this chat and were sent by the current user
      setMessages(prev =>
        prev.map(msg => {
          const msgChatId = (msg.chatId?._id || msg.chatId)?.toString();
          const isSentByMe = (msg.senderId?._id || msg.senderId)?.toString() === user._id?.toString();
          if (msgChatId === chatId && isSentByMe) {
            // Mark readBy
            const existingReadBy = msg.readBy || [];
            if (existingReadBy.includes(readBy)) return msg;
            return { ...msg, readBy: [...existingReadBy, readBy] };
          }
          return msg;
        })
      );
    };

    // ────────────────────────────────────────────────────────────
    // user_reading — recipient is actively looking at the chat right now
    // (emitted by server on join_chat). Mark their messages as delivered.
    // ────────────────────────────────────────────────────────────
    const handleUserReading = ({ userId }) => {
      if (!userId) return;
      setMessages(prev =>
        prev.map(msg => {
          const isSentByMe = (msg.senderId?._id || msg.senderId)?.toString() === user._id?.toString();
          if (!isSentByMe) return msg;
          const existingReadBy = msg.readBy || [];
          if (existingReadBy.includes(userId.toString())) return msg;
          return { ...msg, readBy: [...existingReadBy, userId.toString()] };
        })
      );
    };

    socket.on('message_received', handleNewMessage);
    socket.on('messages_read',    handleMessagesRead);
    socket.on('user_reading',     handleUserReading);
    socket.on('typing',           () => setIsTyping(true));
    socket.on('stop_typing',      () => setIsTyping(false));

    return () => {
      socket.off('message_received', handleNewMessage);
      socket.off('messages_read',    handleMessagesRead);
      socket.off('user_reading',     handleUserReading);
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [user, contextSocket, markChatAsRead, incrementUnread]); // stable deps only

  // ── Select a chat and load messages ──────────────────────────
  const selectChat = useCallback(async (chat) => {
    // Leave previous chat
    setActiveChat(prev => {
      if (prev?._id && prev._id !== chat._id && socketRef.current) {
        socketRef.current.emit('leave_chat', prev._id);
      }
      return chat;
    });
    activeChatIdRef.current = chat._id;          // sync ref for socket handlers
    setActiveChatId(chat._id);                   // tell MessageContext
    setMobileView('chat');
    setIsComposing(false);
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setShowProfilePanel(false);

    try {
      const { data } = await chatService.fetchMessages(chat._id, 1, 30);
      const rawMessages = data.data || data;
      setMessages(rawMessages);
      setHasMore(data.hasMore || false);
      setPage(1);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    if (socketRef.current) {
      socketRef.current.emit('join_chat', chat._id);
    }
    // Mark read — updates global badge + calls API which emits 'messages_read' to sender
    markChatAsRead(chat._id);
  }, [markChatAsRead, setActiveChatId]);

  // Clear active chat in context on unmount
  useEffect(() => {
    return () => {
      setActiveChatId(null);
      activeChatIdRef.current = null;
    };
  }, [setActiveChatId]);

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !activeChat) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await chatService.fetchMessages(activeChat._id, nextPage, 30);
      setMessages(prev => [...(data.data || data), ...prev]);
      setHasMore(data.hasMore || false);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  selectChatRef.current = selectChat;

  // ── Start new chat from user search ──────────────────────────
  const handleSelectNewUser = async (selectedUser) => {
    try {
      const { data: chat } = await chatService.accessChat(selectedUser._id);
      const enriched = enrichChat(chat, user._id, onlineUsers);
      setChats(prev => {
        const exists = prev.find(c => c._id === enriched._id);
        if (!exists) return [enriched, ...prev];
        return prev;
      });
      await selectChat(enriched);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.code === 'NOT_CONNECTED') {
        const fakeChatId = 'fake_' + Date.now();
        setBlockedChats(prev => ({ ...prev, [fakeChatId]: true }));
        return;
      }
      console.error('Failed to open chat:', err);
    }
    setIsComposing(false);
    setSearch('');
    setSearchResults([]);
  };

  // ── Search connections ────────────────────────────────────────
  useEffect(() => {
    if (!isComposing || search.trim().length < 1) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await chatService.searchUsers(search);
        setSearchResults(data);
      } catch { setSearchResults([]); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, isComposing]);

  // ── Send message ──────────────────────────────────────────────
  const handleSend = async () => {
    if (!msgInput.trim() || !activeChat) return;
    const text = msgInput.trim();
    setMsgInput('');
    if (socketRef.current) socketRef.current.emit('stop_typing', activeChat._id);

    try {
      const { data: newMessage } = await chatService.sendMessage(activeChat._id, text);
      // Optimistic update — append message (readBy = [] initially → shows single tick)
      setMessages(prev => [...prev, { ...newMessage, readBy: newMessage.readBy || [] }]);
      setChats(prev => prev.map(c =>
        c._id === activeChat._id
          ? { ...c, lastMessage: { text, senderId: user._id, timestamp: new Date() } }
          : c
      ));
      // Emit to server so recipient gets real-time delivery
      if (socketRef.current) {
        socketRef.current.emit('new_message', {
          ...newMessage,
          chatId: { _id: activeChat._id, participants: activeChat.participants },
        });
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.code === 'NOT_CONNECTED') {
        setBlockedChats(prev => ({ ...prev, [activeChat._id]: true }));
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    }
  };

  // ── Send image ────────────────────────────────────────────────
  const handleImageSend = async (file, caption) => {
    if (!activeChat || !file) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (caption) fd.append('caption', caption);
      const { data } = await mentorshipService.uploadChatImage(activeChat._id, fd);
      setMessages(prev => [...prev, { ...data.data, readBy: data.data?.readBy || [] }]);
      setChats(prev => prev.map(c =>
        c._id === activeChat._id
          ? { ...c, lastMessage: { text: '📷 Image', senderId: user._id, timestamp: new Date() } }
          : c
      ));
    } catch {
      toast.error('Failed to send image. Please try again.');
    }
  };

  // ── Typing indicator ──────────────────────────────────────────
  const handleTyping = (value) => {
    setMsgInput(value);
    if (!socketRef.current || !activeChat) return;
    socketRef.current.emit('typing', activeChat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', activeChat._id);
    }, 1500);
  };

  useEffect(() => {
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  }, []);

  // ── Connection request from blocked banner ───────────────────
  const handleSendConnectionRequest = async () => {
    if (!activeChat?.otherUserId) return;
    setIsSendingRequest(true);
    try {
      await connectionService.sendRequest(activeChat.otherUserId);
    } catch { /* silent */ }
    finally { setIsSendingRequest(false); }
  };

  // ── Filtered chat list ────────────────────────────────────────
  const filteredChats = useMemo(() =>
    chats.filter(c => c.userName.toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="msg-viewport">
        <div className="msg-shell">
          <div className="msg-sidebar">
            <div className="msg-sidebar__header">
              <div style={{ width: 90, height: 20, background: '#f0f0f0', borderRadius: 6 }} />
              <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: '50%' }} />
            </div>
            <div className="msg-sidebar__search">
              <div style={{ height: 38, background: '#f0f0f0', borderRadius: 20 }} />
            </div>
            <ChatListSkeleton rows={7} />
          </div>
          <div className="msg-window">
            <ChatEmptyState />
          </div>
        </div>
      </div>
    );
  }

  const isBlockedLocally = activeChat ? blockedChats[activeChat._id] : false;

  return (
    <div className="msg-viewport">
      {/* ── Connection status banner (WhatsApp-style) ── */}
      {!isConnected && (
        <div className="connection-status-banner">
          <i className="fas fa-exclamation-triangle" />
          {reconnectAttempts > 0
            ? `Reconnecting... (${reconnectAttempts}/10)`
            : 'Connecting to chat server...'}
        </div>
      )}
      <div className="msg-shell">

        {/* ─── LEFT: Chat Sidebar ─── */}
        <div className={`msg-sidebar ${mobileView === 'chat' ? 'msg-sidebar--hidden' : ''}`}>
          <ChatSidebar>
            {/* Sidebar header */}
            <div className="msg-sidebar__header">
              <div className="d-flex align-items-center gap-2">
                {isComposing ? (
                  <button
                    className="msg-icon-btn"
                    onClick={() => { setIsComposing(false); setSearch(''); setSearchResults([]); }}
                    title="Back to chats"
                  >
                    <i className="fas fa-arrow-left" />
                  </button>
                ) : (
                  <button
                    className="msg-icon-btn"
                    onClick={() => {
                      const role = user?.role?.toLowerCase() || 'alumni';
                      const uid  = user?._id || user?.id;
                      if (role === 'student')       navigate(`/student/home/${uid}`);
                      else if (role === 'admin')    navigate(`/admin/home/${uid}`);
                      else                          navigate(`/alumni/home/${uid}`);
                    }}
                    title="Back to home"
                    aria-label="Go back to dashboard"
                  >
                    <i className="fas fa-arrow-left" />
                  </button>
                )}
                <h5 className="msg-sidebar__title">
                  {isComposing ? 'New Message' : 'Messaging'}
                </h5>
              </div>
              {!isComposing && (
                <button
                  className="msg-compose-btn"
                  title="New message"
                  onClick={() => { setIsComposing(true); setSearch(''); setSearchResults([]); }}
                >
                  <i className="fas fa-edit" />
                </button>
              )}
            </div>
            <ChatSidebar.Search value={search} onChange={setSearch} />
            <ChatSidebar.List>
              {isComposing ? (
                <>
                  <div className="msg-compose-hint">Search your connections to start a message</div>
                  {searchResults.length === 0 && search.trim().length > 0 ? (
                    <EmptyState icon="fa-search" title="No users found" description="Try a different name" />
                  ) : searchResults.length === 0 ? (
                    <EmptyState icon="fa-user-friends" title="Search connections" description="Type a name to find someone" />
                  ) : (
                    searchResults.map(u => (
                      <UserResultItem key={u._id} user={u} onClick={() => handleSelectNewUser(u)} />
                    ))
                  )}
                </>
              ) : (
                <>
                  {filteredChats.length === 0 ? (
                    <EmptyState
                      icon={search ? 'fa-search' : 'fa-comment-slash'}
                      title={search ? 'No results found' : 'No conversations yet'}
                      description={search ? 'Try a different name' : 'Click ✏️ to start messaging'}
                    />
                  ) : (
                    filteredChats.map(chat => (
                      <ChatItem
                        key={chat._id}
                        chat={chat}
                        currentUserId={user._id}
                        isActive={activeChat?._id === chat._id}
                        unreadCount={unreadMap[chat._id] || 0}   // ← reads from MessageContext
                        onClick={() => selectChat(chat)}
                      />
                    ))
                  )}
                </>
              )}
            </ChatSidebar.List>
          </ChatSidebar>
        </div>

        {/* ─── CENTER: Chat Window ─── */}
        <div className={`msg-window ${mobileView === 'list' ? 'msg-window--hidden' : ''}`}>
          {activeChat ? (
            <>
              <ChatWindow.Header
                chat={activeChat}
                onBack={() => { setMobileView('list'); setShowProfilePanel(false); }}
                onProfileClick={() => {
                  if (activeChat.isGroupChat) return;
                  const isMobile = window.innerWidth < 992;
                  if (isMobile) { navigate(`/profile/${activeChat.otherUserId}`); }
                  else          { setShowProfilePanel(p => !p); }
                }}
                onClearChat={() => {}}
                onDeleteChat={() => {}}
                onVoiceCall={setCallingChat}
              />

              {messages.length === 0 && !isLoadingMore ? (
                <div className="msg-messages">
                  <MessagesSkeleton rows={6} />
                </div>
              ) : (
                <ChatWindow.Messages
                  messages={messages}
                  currentUserId={user._id}
                  otherUserId={activeChat?.otherUserId}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMoreMessages}
                />
              )}

              {isTyping && <TypingIndicator name={activeChat.userName} />}

              <ChatWindow.Input
                value={msgInput}
                onChange={handleTyping}
                onSend={handleSend}
                onImageSend={handleImageSend}
                disabled={isBlockedLocally}
                blockedMessage={isBlockedLocally ? 'You must be connected to start messaging.' : undefined}
                onSendConnectionRequest={isBlockedLocally ? handleSendConnectionRequest : undefined}
                isSendingRequest={isSendingRequest}
              />
            </>
          ) : (
            <ChatEmptyState />
          )}
        </div>

        {/* ─── RIGHT: Profile Preview Panel (desktop only) ─── */}
        {showProfilePanel && activeChat && !activeChat.isGroupChat && (
          <ProfilePreviewPanel
            chat={activeChat}
            onClose={() => setShowProfilePanel(false)}
          />
        )}

      </div>

      {/* ─── Voice Call Modal ─── */}
      {callingChat && (
        <ChatWindow.CallModal
          chat={callingChat}
          onEndCall={() => setCallingChat(null)}
        />
      )}
    </div>
  );
};

export default Messaging;
