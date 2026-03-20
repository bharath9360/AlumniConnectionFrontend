import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../../services/api';
import { socketService } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import {
  ChatSidebar,
  ChatItem,
  ChatWindow,
  ChatEmptyState
} from '../../components/messaging';

const Messaging = () => {
  const { user } = useAuth();
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
  const location = useLocation();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectChatRef = useRef(null);

  // ── Connect Socket & Setup listeners ──────────────────────────
  useEffect(() => {
    if (!user) return;

    socketRef.current = socketService.connect();
    const socket = socketRef.current;

    socket.emit('setup', user);

    socket.on('message_received', (newMessage) => {
      // Update the active chat messages in real-time if the chat is open
      setActiveChat(prev => {
        if (prev && (prev._id === newMessage.chatId._id || prev._id === newMessage.chatId)) {
          setMessages(prevMsgs => [...prevMsgs, newMessage]);
        }
        return prev;
      });

      // Update the chats list sidebar with the last message preview
      setChats(prevChats =>
        prevChats.map(c => {
          const cid = c._id;
          const msgChatId = newMessage.chatId._id || newMessage.chatId;
          if (cid === msgChatId) {
            return {
              ...c,
              lastMessage: {
                text: newMessage.text,
                senderId: newMessage.senderId._id || newMessage.senderId,
                timestamp: newMessage.createdAt || new Date()
              }
            };
          }
          return c;
        })
      );
    });

    socket.on('typing', () => setIsTyping(true));
    socket.on('stop_typing', () => setIsTyping(false));

    return () => {
      socket.off('message_received');
      socket.off('connected');
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [user]);

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
  }, [user, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive display info from a chat document ──────────────────
  const enrichChat = (chat, currentUserId) => {
    const otherParticipant = chat.participants.find(p => (p._id || p) !== currentUserId);
    return {
      ...chat,
      userName: otherParticipant?.name || 'Unknown User',
      userInitial: (otherParticipant?.name || 'U').charAt(0).toUpperCase(),
      userRole: otherParticipant?.role || '',
      status: 'offline',
    };
  };

  // ── Select a chat and load messages ──────────────────────────
  const selectChat = useCallback(async (chat) => {
    setActiveChat(chat);
    setMobileView('chat');
    setIsComposing(false);
    setMessages([]);
    try {
      const { data } = await chatService.fetchMessages(chat._id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chat._id);
    }
  }, []);

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
      console.error('Failed to send message:', err);
    }
  };

  // ── Typing indicator ──────────────────────────────────────────
  const handleTyping = (value) => {
    setMsgInput(value);
    if (!socketRef.current || !activeChat) return;
    socketRef.current.emit('typing', activeChat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('stop_typing', activeChat._id);
    }, 1500);
  };

  // ── Filter sidebar chats by search ───────────────────────────
  const filteredChats = chats.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="dashboard-main-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-danger" role="status"></div>
    </div>
  );

  return (
    <div className="messaging-viewport w-100" style={{ backgroundColor: '#f3f2ef' }}>
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
                      Search alumni, students, or admins to message
                    </div>
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
                      <p className="text-muted text-center py-5 small">No conversations yet. Click ✏️ to start one!</p>
                    ) : (
                      filteredChats.map(chat => (
                        <ChatItem
                          key={chat._id}
                          chat={chat}
                          currentUserId={user._id}
                          isActive={activeChat?._id === chat._id}
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
                <ChatWindow.Messages messages={messages} currentUserId={user._id} />
                <ChatWindow.Input
                  value={msgInput}
                  onChange={handleTyping}
                  onSend={handleSend}
                />
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
