// src/pages/Home/Messaging.js
import React, { useState } from 'react';
import '../../styles/Dashboard.css';

const DUMMY_CHATS = [
  { id: 1, name: "Bharath K", lastMsg: "Hey, can you refer me to HILIFE AI?", time: "10:30 AM", status: "online", initial: "B" },
  { id: 2, name: "Priya S", lastMsg: "The symposium was great!", time: "Yesterday", status: "offline", initial: "P" },
  { id: 3, name: "Admin MAMCET", lastMsg: "Welcome to the alumni network.", time: "Oct 12", status: "online", initial: "A" }
];

const Messaging = () => {
  const [activeChat, setActiveChat] = useState(DUMMY_CHATS[0]);

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">
        <div className="row g-0 shadow-sm rounded-3 overflow-hidden bg-white border">
          
          {/* LEFT: Chat List */}
          <div className="col-lg-4 border-end">
            <div className="p-3 border-bottom bg-light">
              <h6 className="fw-bold mb-0">Messaging</h6>
            </div>
            <div className="chat-list-scroll" style={{ height: '70vh', overflowY: 'auto' }}>
              {DUMMY_CHATS.map(chat => (
                <div 
                  key={chat.id} 
                  className={`p-3 d-flex align-items-center border-bottom chat-item-hover ${activeChat.id === chat.id ? 'bg-light' : ''}`}
                  onClick={() => setActiveChat(chat)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`avatar-sm me-3 bg-secondary text-white position-relative`}>
                    {chat.initial}
                    <span className={`position-absolute bottom-0 end-0 p-1 border border-white rounded-circle ${chat.status === 'online' ? 'bg-success' : 'bg-warning'}`}></span>
                  </div>
                  <div className="overflow-hidden">
                    <div className="d-flex justify-content-between">
                      <h6 className="small fw-bold mb-0 text-dark">{chat.name}</h6>
                      <span className="extra-small text-muted">{chat.time}</span>
                    </div>
                    <p className="extra-small text-muted mb-0 text-truncate">{chat.lastMsg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Chat Window */}
          <div className="col-lg-8 d-flex flex-column" style={{ height: '75vh' }}>
            {/* Chat Header */}
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-white">
              <div className="d-flex align-items-center">
                <div className="avatar-sm me-2 bg-secondary text-white">{activeChat.initial}</div>
                <div>
                  <h6 className="small fw-bold mb-0">{activeChat.name}</h6>
                  <span className="extra-small text-success">{activeChat.status === 'online' ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <button className="btn btn-sm text-muted"><i className="fas fa-info-circle"></i></button>
            </div>

            {/* Message Area */}
            <div className="flex-grow-1 p-4 bg-light overflow-auto">
              <div className="d-flex flex-column gap-3">
                <div className="align-self-start bg-white p-2 px-3 rounded-3 shadow-sm border small" style={{ maxWidth: '70%' }}>
                  Hello! How can I help you today?
                </div>
                <div className="align-self-end text-white p-2 px-3 rounded-3 shadow-sm small" style={{ maxWidth: '70%', backgroundColor: '#c84022' }}>
                  {activeChat.lastMsg}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 border-top bg-white">
              <div className="input-group">
                <input type="text" className="form-control form-control-sm border-0 bg-light" placeholder="Write a message..." />
                <button className="btn btn-sm btn-mamcet-red px-3"><i className="fas fa-paper-plane"></i></button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Messaging;