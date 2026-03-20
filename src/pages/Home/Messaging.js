import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { storage } from '../../utils/storage';
import {
  ChatSidebar,
  ChatItem,
  ChatWindow,
  ChatEmptyState
} from '../../components/messaging';

const Messaging = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState('');
  const [search, setSearch] = useState('');
  const [callingChat, setCallingChat] = useState(null);
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  const [isComposing, setIsComposing] = useState(false);
  const [allAlumni, setAllAlumni] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const allChats = storage.getChats();
    setChats(allChats);

    // Load potential alumni to message (from admin data or users)
    const savedAlumni = JSON.parse(localStorage.getItem('alumniData')) || [];
    // Fallback if alumniData is empty — add some defaults for demo
    const defaultAlumni = [
      { id: 101, name: 'Hari', role: 'UIUX Designer', dept: 'CSE' },
      { id: 102, name: 'Shalini', role: 'Frontend Developer', dept: 'ECE' },
      { id: 103, name: 'Kumar', role: 'Software Engineer', dept: 'IT' },
      { id: 104, name: 'Priya Sharma', role: 'SDE-II at Google', dept: 'CSE' }
    ];
    const alumniList = savedAlumni.length > 0 ? savedAlumni : defaultAlumni;
    // Filter out the current user (Bharath K or alumni_1)
    setAllAlumni(alumniList.filter(a => a.name !== 'Bharath K' && a.id !== 'alumni_1'));

    // Deep link handling
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');

    if (chatId) {
      const targetChat = allChats.find(c => c.id === parseInt(chatId));
      if (targetChat) {
        setActiveChat(targetChat);
        setMobileView('chat');
      } else if (allChats.length > 0) {
        setActiveChat(allChats[0]);
      }
    } else if (allChats.length > 0) {
      setActiveChat(allChats[0]);
    }

    setLoading(false);
  }, [location.search]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    setMobileView('chat');
    setIsComposing(false);
  };

  const handleSelectNewUser = (user) => {
    // Check if chat already exists
    const existingChat = chats.find(c =>
      c.userName.toLowerCase() === user.name.toLowerCase()
    );

    if (existingChat) {
      handleSelectChat(existingChat);
    } else {
      const newChat = {
        id: Date.now(),
        participants: ['alumni_1', user.id.toString()],
        userName: user.name,
        userRole: user.role || user.dept || 'Alumni',
        userInitial: user.name.charAt(0),
        status: 'offline',
        messages: []
      };

      const updatedChats = storage.createChat(newChat);
      setChats(updatedChats);
      setActiveChat(newChat);
      setMobileView('chat');
    }
    setIsComposing(false);
    setSearch('');
  };

  const handleSend = () => {
    if (!msgInput.trim() || !activeChat) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: 'alumni_1',
      text: msgInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChat = { ...activeChat, messages: [...activeChat.messages, newMessage] };
    const updatedChats = chats.map(c => c.id === activeChat.id ? updatedChat : c);

    setChats(updatedChats);
    setActiveChat(updatedChat);
    storage.saveChat(activeChat.id, updatedChat.messages);
    setMsgInput('');
  };

  const handleClearChat = () => {
    if (!activeChat) return;
    if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
      storage.clearConversation(activeChat.id);
      const updatedChat = { ...activeChat, messages: [] };
      setActiveChat(updatedChat);
      setChats(prev => prev.map(c => c.id === activeChat.id ? updatedChat : c));
    }
  };

  const handleDeleteChat = () => {
    if (!activeChat) return;
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      storage.deleteConversation(activeChat.id);
      const remainingChats = chats.filter(c => c.id !== activeChat.id);
      setChats(remainingChats);

      if (remainingChats.length > 0) {
        setActiveChat(remainingChats[0]);
      } else {
        setActiveChat(null);
        setMobileView('list');
      }
    }
  };

  const handleVoiceCall = (chat) => {
    setCallingChat(chat);
  };

  const filteredChats = chats.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAlumni = allAlumni.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
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
                onCompose={() => { setIsComposing(true); setSearch(''); }}
                isComposing={isComposing}
                onCancel={() => setIsComposing(false)}
              />
              <ChatSidebar.Search value={search} onChange={setSearch} />
              <ChatSidebar.List>
                {isComposing ? (
                  <>
                    <div className="px-3 py-2 bg-light border-bottom small text-muted">
                      Select someone to message
                    </div>
                    {filteredAlumni.length === 0 ? (
                      <p className="text-muted text-center py-5 small">No alumni found</p>
                    ) : (
                      filteredAlumni.map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectNewUser(user)}
                          className="d-flex align-items-center gap-3 px-3 py-3 border-bottom"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3f2ef'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{ width: '40px', height: '40px', backgroundColor: '#6c757d', fontSize: '1rem' }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{user.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>{user.role || user.dept}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {filteredChats.length === 0 ? (
                      <p className="text-muted text-center py-5 small">No conversations found</p>
                    ) : (
                      filteredChats.map(chat => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          isActive={activeChat?.id === chat.id}
                          onClick={() => handleSelectChat(chat)}
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
                  onClearChat={handleClearChat}
                  onDeleteChat={handleDeleteChat}
                  onVoiceCall={handleVoiceCall}
                />
                <ChatWindow.Messages messages={activeChat.messages} />
                <ChatWindow.Input
                  value={msgInput}
                  onChange={setMsgInput}
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
