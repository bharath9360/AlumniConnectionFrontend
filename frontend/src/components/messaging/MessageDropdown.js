import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { chatService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCommentDots } from 'react-icons/fa';
import { FiMessageSquare, FiChevronRight, FiX, FiSend } from 'react-icons/fi';
import { BsCheckAll } from 'react-icons/bs';

/* ── helpers ──────────────────────────────────────────────── */
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

const truncate = (str, n = 40) =>
  str && str.length > n ? str.slice(0, n) + '…' : str || '';

/* ── Avatar mini ──────────────────────────────────────────── */
const ChatAvatar = ({ chat, currentUserId, size = 42 }) => {
  const other = (chat.participants || []).find(
    (p) => (p._id || p) !== currentUserId
  );
  const isGroup = chat.isGroupChat;
  const name    = isGroup ? chat.chatName : (other?.name || '?');
  const pic     = isGroup ? null : other?.profilePic;
  const initials = name?.[0]?.toUpperCase() || '?';

  return (
    <div style={{
      width: size, height: size,
      borderRadius: isGroup ? 12 : '50%',
      overflow: 'hidden', flexShrink: 0,
      background: isGroup
        ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
        : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800,
      color: isGroup ? '#c84022' : '#3b5bdb',
      border: '2px solid #f3f4f6',
      boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
      position: 'relative',
    }}>
      {pic
        ? <img src={pic} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        : initials}
    </div>
  );
};

/* ── Main Dropdown ────────────────────────────────────────── */
const MessageDropdown = () => {
  const [isOpen,   setIsOpen]   = useState(false);
  const [chats,    setChats]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropRef  = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadMessageCount = 0 } = useNotifications();

  const currentUserId = user?._id || user?.id;

  /* detect mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 992);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* fetch recent chats when dropdown opens */
  const loadChats = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await chatService.fetchChats();
      const data = res.data?.data || res.data || [];
      const sorted = [...data].sort((a, b) =>
        new Date(b.latestMessage?.createdAt || b.updatedAt || 0) -
        new Date(a.latestMessage?.createdAt || a.updatedAt || 0)
      );
      setChats(sorted.slice(0, 6));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => { loadChats(); }, [loadChats]);

  /* outside-click close (desktop only) */
  useEffect(() => {
    if (isMobile) return;
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isMobile]);

  /* lock body scroll on mobile sheet */
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isOpen]);

  const openChat = (chat) => {
    setIsOpen(false);
    navigate('/messaging', { state: { openChatId: chat._id } });
  };

  const goToInbox = () => {
    setIsOpen(false);
    navigate('/messaging');
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName || 'Group';
    const other = (chat.participants || []).find(
      (p) => (p._id || p) !== currentUserId
    );
    return other?.name || 'Unknown';
  };

  const getLastMsg = (chat) => {
    const msg = chat.latestMessage;
    if (!msg) return 'No messages yet';
    const isMine = (msg.sender?._id || msg.sender) === currentUserId;
    const prefix = isMine ? 'You: ' : '';
    return prefix + truncate(msg.content || msg.text || '', 38);
  };

  const isMsgMine = (chat) => {
    const msg = chat.latestMessage;
    if (!msg) return false;
    return (msg.sender?._id || msg.sender) === currentUserId;
  };

  const getUnread = (chat) => chat.unreadCount || 0;

  /* ── Shared chat list content ─────────────────────────── */
  const ChatList = () => (
    <>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid #f3f4f6',
            borderTopColor: '#c84022',
            animation: 'md-spin 0.7s linear infinite',
          }} />
        </div>
      ) : chats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9ca3af' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <FiMessageSquare size={26} color="#c84022" style={{ opacity: 0.7 }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#374151' }}>
            No conversations yet
          </p>
          <p style={{ margin: '4px 0 16px', fontSize: 12, color: '#9ca3af' }}>
            Start a chat to see it here
          </p>
          <button
            onClick={goToInbox}
            style={{
              background: 'linear-gradient(135deg, #c84022, #a5311a)',
              color: '#fff', border: 'none', cursor: 'pointer',
              padding: '8px 20px', borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 8px rgba(200,64,34,0.35)',
            }}
          >
            <FiSend size={13} /> Start Messaging
          </button>
        </div>
      ) : (
        chats.map((chat, idx) => {
          const unread  = getUnread(chat);
          const name    = getChatName(chat);
          const lastMsg = getLastMsg(chat);
          const time    = timeAgo(chat.latestMessage?.createdAt || chat.updatedAt);
          const mine    = isMsgMine(chat);

          return (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => openChat(chat)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f9fafb',
                background: unread > 0 ? 'linear-gradient(90deg, #fffbfb, #fff)' : '#fff',
                transition: 'background 0.15s',
                position: 'relative',
              }}
              whileHover={{ background: '#fef7f7' }}
              whileTap={{ scale: 0.98 }}
            >
              {/* unread left accent */}
              {unread > 0 && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0',
                  background: '#c84022',
                }} />
              )}

              <ChatAvatar chat={chat} currentUserId={currentUserId} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline',
                  justifyContent: 'space-between', gap: 4,
                }}>
                  <span style={{
                    fontWeight: unread > 0 ? 800 : 600,
                    fontSize: 13.5, color: '#111827',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                    {time}
                  </span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
                }}>
                  {mine && <BsCheckAll size={13} color="#c84022" style={{ flexShrink: 0 }} />}
                  <span style={{
                    fontSize: 12,
                    color: unread > 0 ? '#374151' : '#9ca3af',
                    fontWeight: unread > 0 ? 600 : 400,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    flex: 1,
                  }}>
                    {mine ? lastMsg.replace('You: ', '') : lastMsg}
                  </span>
                </div>
              </div>

              {unread > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #c84022, #a5311a)',
                  color: '#fff',
                  fontSize: 10, fontWeight: 800, borderRadius: 20,
                  padding: '2px 7px', flexShrink: 0, minWidth: 20,
                  textAlign: 'center',
                  boxShadow: '0 1px 4px rgba(200,64,34,0.4)',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </motion.div>
          );
        })
      )}
    </>
  );

  /* ── Desktop panel ─────────────────────────────── */
  const DesktopPanel = () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1,    y: 0   }}
          exit={{   opacity: 0, scale: 0.96, y: -10  }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="md-panel-shadow"
          style={{
            position: 'absolute', right: 0, top: 46,
            width: 330, maxHeight: 460,
            zIndex: 1060, borderRadius: 16,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid #f3f4f6',
            background: 'linear-gradient(135deg, #fff 60%, #fef7f6)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #c84022, #a5311a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FaCommentDots size={15} color="#fff" />
              </div>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>
                Messages
                {unreadMessageCount > 0 && (
                  <span style={{
                    display: 'inline-block', marginLeft: 6,
                    background: '#c84022', color: '#fff',
                    fontSize: 10, fontWeight: 800, borderRadius: 20,
                    padding: '1px 6px', verticalAlign: 'middle',
                  }}>
                    {unreadMessageCount}
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={goToInbox}
              style={{
                background: 'rgba(200,64,34,0.08)',
                border: 'none', cursor: 'pointer',
                color: '#c84022', fontSize: 12, fontWeight: 700,
                padding: '5px 10px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,64,34,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,64,34,0.08)'}
            >
              Open inbox <FiChevronRight size={13} />
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <ChatList />
          </div>

          {/* Footer */}
          {chats.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #f3f4f6',
              textAlign: 'center', flexShrink: 0,
              background: '#fafafa',
            }}>
              <button
                onClick={goToInbox}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#c84022', fontSize: 13, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                View all messages <FiChevronRight size={13} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ── Mobile bottom-sheet ──────────────────────── */
  const MobileSheet = () => (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{   opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 1100,
              backdropFilter: 'blur(2px)',
            }}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{   y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              zIndex: 1101,
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{
                width: 40, height: 4, borderRadius: 4,
                background: '#e5e7eb',
              }} />
            </div>

            {/* Sheet header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 16px 12px',
              borderBottom: '1px solid #f3f4f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg, #c84022, #a5311a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FaCommentDots size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', lineHeight: 1.2 }}>
                    Messages
                    {unreadMessageCount > 0 && (
                      <span style={{
                        display: 'inline-block', marginLeft: 6,
                        background: '#c84022', color: '#fff',
                        fontSize: 10, fontWeight: 800, borderRadius: 20,
                        padding: '1px 6px', verticalAlign: 'middle',
                      }}>
                        {unreadMessageCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    Recent conversations
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#f3f4f6', border: 'none', cursor: 'pointer',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280',
                }}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <ChatList />
            </div>

            {/* CTA */}
            <div style={{
              padding: '12px 16px 20px',
              borderTop: '1px solid #f3f4f6',
              background: '#fff',
            }}>
              <button
                onClick={goToInbox}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '13px',
                  background: 'linear-gradient(135deg, #c84022, #a5311a)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  borderRadius: 14, fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(200,64,34,0.35)',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <FiSend size={16} /> Open Full Inbox
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes md-spin { to { transform: rotate(360deg); } }
        @keyframes md-pulse-badge {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,64,34,0.55); }
          50%       { box-shadow: 0 0 0 5px rgba(200,64,34,0); }
        }
        .md-msg-btn:hover { background: rgba(200,64,34,0.09) !important; color: #c84022 !important; }
        .md-msg-btn:hover .md-msg-icon { color: #c84022; }
        .md-panel-shadow { box-shadow: 0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07); }
      `}</style>

      <div className="position-relative" ref={dropRef}>
        {/* ── Trigger button ── */}
        <motion.button
          id="msg-dropdown-trigger"
          className="btn btn-link text-decoration-none p-0 position-relative md-msg-btn"
          style={{
            color: isOpen ? '#c84022' : '#555',
            width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
            background: isOpen ? 'rgba(200,64,34,0.09)' : 'transparent',
            transition: 'background 0.2s, color 0.2s',
          }}
          onClick={() => setIsOpen(s => !s)}
          whileTap={{ scale: 0.88 }}
          aria-label="Messages"
          aria-expanded={isOpen}
        >
          <FaCommentDots className="md-msg-icon" size={20} />
          {unreadMessageCount > 0 && (
            <motion.span
              key={unreadMessageCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{
                fontSize: '0.6rem', padding: '0.25em 0.4em',
                minWidth: 18,
                animation: 'md-pulse-badge 2s ease-in-out infinite',
              }}
            >
              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
            </motion.span>
          )}
        </motion.button>

        {/* Desktop dropdown */}
        {!isMobile && <DesktopPanel />}
      </div>

      {/* Mobile bottom sheet (rendered in place, uses fixed positioning) */}
      {isMobile && <MobileSheet />}
    </>
  );
};

export default MessageDropdown;
