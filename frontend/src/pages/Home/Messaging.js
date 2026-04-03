import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  ChatSidebar,
  ChatItem,
  ChatWindow,
  ChatEmptyState
} from '../../components/messaging';
import { ChatListSkeleton, MessagesSkeleton, EmptyState } from '../../components/common/Skeletons';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const Messaging = () => {
  const { user } = useAuth();
  // FIX 3: Pull onlineUsers array directly from context so the online-status
  // effect reacts to reference changes — avoids stale isOnline closures.
  const { socket: contextSocket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const [search, setSearch] = useState('');
  const [callingChat, setCallingChat] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [isComposing, setIsComposing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [blockedChats, setBlockedChats] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({}); // { [chatId]: number }
  const location = useLocation();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectChatRef = useRef(null);

  // ── Connect Socket & Setup listeners ──────────────────────────
  useEffect(() => {
    if (!user || !contextSocket) return;

    // FIX: Use the shared SocketContext socket — eliminates duplicate connections
    const socket = contextSocket;
    socketRef.current = socket;

    // FIX 1 & 2: Properly update messages in real-time using named handler so
    // we can cleanly remove only our listener on cleanup (avoids duplicates).
    const handleNewMessage = (newMessage) => {
      const msgChatId = newMessage.chatId?._id || newMessage.chatId;

      // Update messages only if the active chat matches.
      // setMessages is called inside the setActiveChat updater so we always
      // read the current activeChat value, never a stale closure snapshot.
      setActiveChat(prev => {
        if (prev && (prev._id === msgChatId)) {
          setMessages(prevMsgs => [...prevMsgs, newMessage]);
          // Mark as read immediately since user is watching
          chatService.markChatRead(msgChatId).catch(() => {});
          setUnreadCounts(prev2 => ({ ...prev2, [msgChatId]: 0 }));
        } else {
          // Bump unread count for chats not currently open
          setUnreadCounts(prev2 => ({
            ...prev2,
            [msgChatId]: (prev2[msgChatId] || 0) + 1
          }));
        }
        return prev;
      });

      // FIX 4: Update last-message preview AND re-sort by timestamp
      setChats(prev => {
        const updated = prev.map(c => {
          if (c._id === msgChatId) {
            return {
              ...c,
              lastMessage: {
                text: newMessage.text,
                senderId: newMessage.senderId?._id || newMessage.senderId,
                timestamp: newMessage.createdAt || new Date().toISOString()
              }
            };
          }
          return c;
        });

        // Re-sort so latest conversation bubbles to the top (LinkedIn behavior)
        return updated.sort((a, b) => {
          const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || 0);
          const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || 0);
          return bTime - aTime;
        });
      });

      if (process.env.NODE_ENV === 'development') {
        console.debug('[Socket] message_received', newMessage);
      }
    };

    socket.on('message_received', handleNewMessage);
    // FIX 5: named handlers so off() is precise
    socket.on('typing',      () => setIsTyping(true));
    socket.on('stop_typing', () => setIsTyping(false));

    return () => {
      socket.off('message_received', handleNewMessage);
      socket.off('typing');
      socket.off('stop_typing');
    };
  // activeChat._id is a dep because we check it inside the handler
  }, [user, contextSocket, activeChat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive display info from a chat document ──────────────────
  // Declared here (before the fetchChats effect) to avoid TDZ error
  const enrichChat = useCallback((chat, currentUserId, onlineList = []) => {
    if (chat.isGroupChat) {
      return {
        ...chat,
        userName: chat.chatName || 'Group Chat',
        userInitial: (chat.chatName || 'G').charAt(0).toUpperCase(),
        userRole: 'group',
        otherUserId: chat._id, // use chat ID for groups
        status: 'online', // inherently active
      };
    }

    const otherParticipant = chat.participants?.find(p => (p._id || p) !== currentUserId);
    const otherId = otherParticipant?._id?.toString() || '';
    return {
      ...chat,
      userName: otherParticipant?.name || 'Unknown User',
      userInitial: (otherParticipant?.name || 'U').charAt(0).toUpperCase(),
      userRole: otherParticipant?.role || '',
      otherUserId: otherId,
      status: onlineList.includes(otherId) ? 'online' : 'offline',
    };
  }, []);

  // ── Fetch all chats on mount ──────────────────────────────────
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await chatService.fetchChats();
        // Augment each chat with a `userName` and `userInitial` for the UI
        const enriched = data.map(chat => enrichChat(chat, user._id));
        setChats(enriched);

        // Deep link handling (e.g., /messaging?chatId=...)
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
  }, [user, location.search, enrichChat]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch unread counts once chats are loaded ──────────────
  useEffect(() => {
    if (!user) return;
    chatService.getUnreadCounts()
      .then(({ data }) => setUnreadCounts(data.data || {}))
      .catch(() => {});
  }, [user, chats.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── FIX 3: Re-derive online status whenever onlineUsers array changes ─────
  // Subscribes to the `onlineUsers` array reference from SocketContext directly
  // instead of the `isOnline` helper — prevents stale-closure bugs.
  useEffect(() => {
    if (!user || chats.length === 0) return;
    setChats(prev =>
      prev.map(chat => ({
        ...chat,
        status: onlineUsers.includes(chat.otherUserId) ? 'online' : 'offline',
      }))
    );
    // Also refresh activeChat header status
    if (activeChat?.otherUserId) {
      setActiveChat(prev =>
        prev ? { ...prev, status: onlineUsers.includes(prev.otherUserId) ? 'online' : 'offline' } : prev
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineUsers]); // onlineUsers is a new array reference on every backend broadcast




  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ── Select a chat and load messages ──────────────────────────
  const selectChat = useCallback(async (chat) => {
    // Leave the previous chat room before joining the new one
    setActiveChat(prev => {
      if (prev?._id && prev._id !== chat._id && socketRef.current) {
        socketRef.current.emit('leave_chat', prev._id);
      }
      return chat;
    });

    setMobileView('chat');
    setIsComposing(false);
    setMessages([]);
    setPage(1);
    setHasMore(false);

    try {
      const { data } = await chatService.fetchMessages(chat._id, 1, 30);
      setMessages(data.data || data);
      setHasMore(data.hasMore || false);
      setPage(1);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }

    if (socketRef.current) {
      socketRef.current.emit('join_chat', chat._id);
    }

    // Mark all messages in this chat as read + clear local badge
    chatService.markChatRead(chat._id).catch(() => {});
    setUnreadCounts(prev => ({ ...prev, [chat._id]: 0 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const enriched = enrichChat(chat, user._id);
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

  // ── Search all users ──────────────────────────────────────────
  useEffect(() => {
    if (!isComposing || search.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await chatService.searchUsers(search);
        setSearchResults(data);
      } catch (err) {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, isComposing]);

  // ── Send a message via REST + Socket.io ──────────────────────
  const handleSend = async () => {
    if (!msgInput.trim() || !activeChat) return;
    const text = msgInput.trim();
    setMsgInput('');

    if (socketRef.current) {
      socketRef.current.emit('stop_typing', activeChat._id);
    }

    try {
      const { data: newMessage } = await chatService.sendMessage(activeChat._id, text);
      // Add to local state immediately (optimistic)
      setMessages(prev => [...prev, newMessage]);
      // Update sidebar preview
      setChats(prev => prev.map(c => c._id === activeChat._id
        ? { ...c, lastMessage: { text, senderId: user._id, timestamp: new Date() } }
        : c
      ));
      // Broadcast via Socket.io so the other user's UI updates instantly
      if (socketRef.current) {
        socketRef.current.emit('new_message', {
          ...newMessage,
          chatId: { _id: activeChat._id, participants: activeChat.participants }
        });
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.data?.code === 'NOT_CONNECTED') {
        setBlockedChats(prev => ({ ...prev, [activeChat._id]: true }));
      }
      console.error('Failed to send message:', err);
    }
  };

  // ── FIX 7: Typing indicator with explicit UI state cleanup ──────
  const handleTyping = (value) => {
    setMsgInput(value);
    if (!socketRef.current || !activeChat) return;

    socketRef.current.emit('typing', activeChat._id);

    // Clear any pending timeout so it resets on every keystroke
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', activeChat._id);
      // FIX 5: Explicitly reset the local UI state to avoid stuck indicator
      setIsTyping(false);
    }, 1500);
  };

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // ── Filter sidebar chats by search (memoized) ────────────────
  const filteredChats = useMemo(() =>
    chats.filter(c => c.userName.toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  if (loading) return (
    <div className="messaging-viewport w-100 d-flex" style={{ backgroundColor: '#f3f2ef', height: 'calc(100dvh - 66px)' }}>
      {/* Sidebar skeleton */}
      <div className="border-end bg-white" style={{ width: 320, flexShrink: 0 }}>
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <div style={{ width: 100, height: 20, backgroundColor: '#f0f0f0', borderRadius: 6 }} />
          <div style={{ width: 24, height: 24, backgroundColor: '#f0f0f0', borderRadius: 6 }} />
        </div>
        <ChatListSkeleton rows={7} />
      </div>
      {/* Chat area skeleton */}
      <div className="flex-grow-1 d-none d-lg-flex flex-column">
        <div className="px-4 py-3 border-bottom bg-white" style={{ height: 65 }} />
        <MessagesSkeleton rows={8} />
      </div>
    </div>
  );

  return (
    <div className="messaging-viewport w-100" style={{ backgroundColor: '#f3f2ef', height: 'calc(100dvh - 66px)', position: 'relative' }}>
      <div className="container-fluid h-100 px-0 px-md-3 py-0 py-md-2 d-flex flex-column" style={{ maxWidth: '1400px', margin: '0 auto', minHeight: 0 }}>
        <div
          className="row g-0 flex-grow-1 bg-white rounded-0 rounded-md-3 overflow-hidden w-100 m-0"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)', border: '1px solid #e0e0e0', minHeight: 0 }}
        >

          {/* ─── LEFT: Chat Sidebar ─── */}
          <div className={`col-12 col-lg-4 d-flex flex-column h-100 ${mobileView === 'chat' ? 'd-none d-lg-flex' : 'd-flex'}`}>
            <ChatSidebar>
              <ChatSidebar.Header
                onCompose={() => { setIsComposing(true); setSearch(''); setSearchResults([]); }}
                isComposing={isComposing}
                onCancel={() => { setIsComposing(false); setSearch(''); setSearchResults([]); }}
              />
              <ChatSidebar.Search value={search} onChange={setSearch} />
              <ChatSidebar.List>
                {isComposing ? (
                  <>
                    <div className="px-3 py-2 bg-light border-bottom small text-muted">
                      Search your connections to message
                    </div>

                    {/* Task 3: Not-connected warning banner handled inline if they try to send, or if we want we can show an error toast */}

                    {searchResults.length === 0 && search.trim().length > 0 ? (
                      <p className="text-muted text-center py-5 small">No users found</p>
                    ) : searchResults.length === 0 ? (
                      <p className="text-muted text-center py-5 small">Type a name to search...</p>
                    ) : (
                      searchResults.map(u => (
                        <div
                          key={u._id}
                          onClick={() => handleSelectNewUser(u)}
                          className="d-flex align-items-center gap-3 px-3 py-3 border-bottom"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f2ef'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{ width: '40px', height: '40px', backgroundColor: '#c84022', fontSize: '1rem' }}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{u.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                              <span className="badge rounded-pill me-1"
                                style={{ fontSize: '0.65rem', backgroundColor: u.role === 'admin' ? '#0d6efd' : u.role === 'alumni' ? '#c84022' : '#198754', color: 'white' }}>
                                {u.role?.toUpperCase()}
                              </span>
                              {u.designation || u.department || ''}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {filteredChats.length === 0 ? (
                      <EmptyState
                        icon="fa-comment-slash"
                        title={search ? 'No results found' : 'No conversations yet'}
                        description={search ? 'Try a different name' : 'Click ✏️ to start a new message'}
                      />
                    ) : (
                      filteredChats.map(chat => (
                        <ChatItem
                          key={chat._id}
                          chat={chat}
                          currentUserId={user._id}
                          isActive={activeChat?._id === chat._id}
                          unreadCount={unreadCounts[chat._id] || 0}
                          onClick={() => selectChat(chat)}
                        />
                      ))
                    )}
                  </>
                )}
              </ChatSidebar.List>
            </ChatSidebar>
          </div>

          {/* ─── RIGHT: Chat Window ─── */}
          <div className={`col-12 col-lg-8 d-flex flex-column h-100 ${mobileView === 'list' ? 'd-none d-lg-flex' : 'd-flex'}`}>
            {activeChat ? (
              <ChatWindow>
                <ChatWindow.Header
                  chat={activeChat}
                  onBack={() => setMobileView('list')}
                  onClearChat={() => {}}
                  onDeleteChat={() => {}}
                  onVoiceCall={setCallingChat}
                />
                {isTyping && (
                  <div className="px-4 pt-1 pb-0" style={{ fontSize: '0.75rem', color: '#888' }}>
                    {activeChat.userName} is typing...
                  </div>
                )}
                {messages.length === 0 && !isLoadingMore ? (
                  <MessagesSkeleton rows={6} />
                ) : (
                <ChatWindow.Messages 
                  messages={messages} 
                  currentUserId={user._id} 
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMoreMessages}
                />
                )}
                {(() => {
                  const isBlockedLocally = blockedChats[activeChat._id];
                  
                  return (
                    <ChatWindow.Input
                      value={msgInput}
                      onChange={handleTyping}
                      onSend={handleSend}
                      disabled={isBlockedLocally}
                      blockedMessage={isBlockedLocally
                        ? 'Messaging disabled. You must be connected or in the same group.'
                        : undefined
                      }
                    />
                  );
                })()}

              </ChatWindow>
            ) : (
              <ChatWindow>
                <ChatEmptyState />
              </ChatWindow>
            )}
          </div>

        </div>
      </div>

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
