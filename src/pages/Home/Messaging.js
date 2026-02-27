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
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  const location = useLocation();

  useEffect(() => {
    const allChats = storage.getChats();
    setChats(allChats);

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
      setChats(chats.map(c => c.id === activeChat.id ? updatedChat : c));
    }
  };

  const handleDeleteChat = () => {
    if (!activeChat) return;
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      storage.deleteConversation(activeChat.id);
      const remainingChats = chats.filter(c => c.id !== activeChat.id);
      setChats(remainingChats);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0] : null);
      if (remainingChats.length === 0) setMobileView('list');
    }
  };

  const filteredChats = chats.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="dashboard-main-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-danger" role="status"></div>
    </div>
  );

  return (
    <div className="dashboard-main-bg" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="container-fluid h-100 px-0 px-md-3 py-0 py-md-3 d-flex" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          className="row g-0 flex-grow-1 bg-white rounded-0 rounded-md-3 overflow-hidden w-100"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)', border: '1px solid #e0e0e0' }}
        >

          {/* ─── LEFT: Chat Sidebar ─── */}
          <div className={`col-12 col-lg-4 d-flex flex-column h-100 ${mobileView === 'chat' ? 'd-none d-lg-flex' : 'd-flex'}`}>
            <ChatSidebar>
              <ChatSidebar.Header />
              <ChatSidebar.Search value={search} onChange={setSearch} />
              <ChatSidebar.List>
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
    </div>
  );
};

export default Messaging;
