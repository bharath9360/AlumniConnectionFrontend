import React, { useState, useEffect } from 'react';
import { storage } from '../../utils/storage';
import Toast from '../../components/common/Toast';
const Messaging = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgInput, setMsgInput] = useState("");
  const [toast, setToast] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'

  useEffect(() => {
    const initMessaging = () => {
      const allChats = storage.getChats();
      setChats(allChats);
      if (allChats.length > 0) setActiveChat(allChats[0]);
      setLoading(false);
    };
    initMessaging();
  }, []);

  const handleSendMessage = () => {
    if (!msgInput.trim() || !activeChat) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: 'alumni_1', // Assuming current user is alumni_1
      text: msgInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedActiveChat = {
      ...activeChat,
      messages: [...activeChat.messages, newMessage]
    };

    const updatedChats = chats.map(c => c.id === activeChat.id ? updatedActiveChat : c);

    setChats(updatedChats);
    setActiveChat(updatedActiveChat);
    storage.saveChat(activeChat.id, updatedActiveChat.messages);
    setMsgInput("");
  };

  if (loading) return <div className="p-5 text-center">Loading Messages...</div>;

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">
        <div className="row g-0 rounded-3 shadow-sm bg-white overflow-hidden border" style={{ height: '80vh' }}>

          {/* CHAT LIST PANAL (Left) */}
          <div className={`col-lg-4 border-end flex-column h-100 ${mobileView === 'chat' ? 'd-none d-lg-flex' : 'd-flex'}`}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
              <h6 className="fw-bold mb-0">Messaging</h6>
              <button className="btn btn-link text-muted"><i className="fas fa-ellipsis-h"></i></button>
            </div>
            <div className="p-3">
              <div className="input-group input-group-sm bg-light rounded-pill px-2">
                <span className="input-group-text bg-transparent border-0"><i className="fas fa-search text-muted"></i></span>
                <input type="text" className="form-control bg-transparent border-0" placeholder="Search messages" />
              </div>
            </div>
            <div className="flex-grow-1 overflow-auto">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`p-3 d-flex gap-3 align-items-center border-bottom cursor-pointer hover-bg-light ${activeChat?.id === chat.id ? 'border-start border-4 border-mamcet-red bg-light' : ''}`}
                  onClick={() => {
                    setActiveChat(chat);
                    setMobileView('chat');
                  }}
                >
                  <div className="avatar-md bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center position-relative" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                    {chat.userInitial}
                    {chat.status === 'online' && <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"></span>}
                  </div>
                  <div className="overflow-hidden flex-grow-1">
                    <div className="d-flex justify-content-between mb-1">
                      <h6 className="small fw-bold mb-0 text-dark">{chat.userName}</h6>
                      <span className="extra-small text-muted">{chat.messages[chat.messages.length - 1]?.timestamp}</span>
                    </div>
                    <p className="extra-small text-muted mb-0 text-truncate">
                      {chat.messages[chat.messages.length - 1]?.senderId === 'alumni_1' ? 'You: ' : ''}
                      {chat.messages[chat.messages.length - 1]?.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONVERSATION WINDOW (Right) */}
          <div className={`col-lg-8 flex-column h-100 ${mobileView === 'list' ? 'd-none d-lg-flex' : 'd-flex'}`}>
            {activeChat ? (
              <>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-link p-0 d-lg-none text-dark me-2" onClick={() => setMobileView('list')}>
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <h6 className="fw-bold mb-0">{activeChat.userName}</h6>
                    <span className={`extra-small ${activeChat.status === 'online' ? 'text-success' : 'text-muted'}`}>
                      {activeChat.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="d-flex gap-3 text-muted">
                    <i className="fas fa-video cursor-pointer"></i>
                    <i className="fas fa-star cursor-pointer"></i>
                  </div>
                </div>

                <div className="flex-grow-1 p-4 overflow-auto bg-light d-flex flex-column gap-3">
                  {activeChat.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`max-w-75 rounded-3 p-2 px-3 shadow-sm border ${msg.senderId === 'alumni_1' ? 'align-self-end text-white bg-mamcet-red' : 'align-self-start bg-white text-dark'}`}
                      style={{ maxWidth: '70%' }}
                    >
                      <p className="small mb-1">{msg.text}</p>
                      <div className={`extra-small text-end ${msg.senderId === 'alumni_1' ? 'text-white-50' : 'text-muted'}`}>{msg.timestamp}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white border-top">
                  <div className="bg-light rounded-3 p-2">
                    <textarea
                      className="form-control border-0 bg-transparent"
                      rows="2"
                      placeholder="Write a message..."
                      value={msgInput}
                      onChange={(e) => setMsgInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    ></textarea>
                    <div className="d-flex justify-content-between align-items-center mt-2 px-2">
                      <div className="d-flex gap-3 text-muted fs-6">
                        <i className="fas fa-image cursor-pointer"></i>
                        <i className="fas fa-paperclip cursor-pointer"></i>
                        <i className="fas fa-smile cursor-pointer"></i>
                      </div>
                      <button className="btn btn-mamcet-red btn-sm px-4 fw-bold rounded-pill" onClick={handleSendMessage}>Send</button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light text-muted">
                Select a conversation to start messaging
              </div>
            )}
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Messaging;
