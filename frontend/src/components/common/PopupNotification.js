import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

// ─── Resolve media URL (same helper used across the app) ─────────────────────
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${url}`;
};

// ─── Icon map for notification types ────────────────────────────────────────
const TYPE_ICON = {
  connection:  '🤝',
  post:        '📰',
  comment:     '💬',
  like:        '👍',
  job:         '💼',
  event:       '📅',
  mentorship:  '🎓',
  message:     '💬',
  default:     '🔔',
};

const TYPE_COLOR = {
  connection: '#0a66c2',
  post:       '#c84022',
  comment:    '#8e44ad',
  like:       '#e74c3c',
  job:        '#27ae60',
  event:      '#e67e22',
  mentorship: '#2980b9',
  message:    '#c84022',
  default:    '#555',
};

// ─── Single popup card ────────────────────────────────────────────────────────
const PopupCard = ({ popup, onDismiss, onClick, index }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Slide in
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(popup.id), 320);
  }, [popup.id, onDismiss]);

  // Auto-dismiss after 5 s
  useEffect(() => {
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [dismiss]);

  const icon = TYPE_ICON[popup.type] || TYPE_ICON.default;
  const accentColor = TYPE_COLOR[popup.type] || TYPE_COLOR.default;
  const pic = resolveUrl(popup.pic);

  const bottomOffset = 20 + index * 92; // stack upward

  return (
    <div
      onClick={() => { onClick(popup); dismiss(); }}
      style={{
        position:     'fixed',
        bottom:       bottomOffset,
        right:        20,
        width:        340,
        maxWidth:     'calc(100vw - 32px)',
        background:   '#fff',
        borderRadius: 16,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.18)',
        border:       `1px solid #f0f0f0`,
        borderLeft:   `4px solid ${accentColor}`,
        padding:      '12px 14px',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        cursor:       'pointer',
        zIndex:       9999,
        userSelect:   'none',
        transform:    visible && !leaving ? 'translateX(0)' : 'translateX(110%)',
        opacity:      visible && !leaving ? 1 : 0,
        transition:   'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.32s ease',
      }}
    >
      {/* Avatar / icon */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: pic ? 'transparent' : `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', fontSize: 22,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        {pic
          ? <img src={pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          : <span>{icon}</span>
        }
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 13.5, color: '#1a1a1a',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2,
        }}>
          {popup.title}
        </div>
        <div style={{
          fontSize: 12.5, color: '#555', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {popup.body}
        </div>
      </div>

      {/* Close × */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#aaa', fontSize: 16, padding: '0 2px', lineHeight: 1,
          flexShrink: 0, alignSelf: 'flex-start',
        }}
        title="Dismiss"
      >
        ×
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 4, right: 4, height: 3,
        borderRadius: '0 0 12px 12px', overflow: 'hidden',
        background: '#f0f0f0',
      }}>
        <div style={{
          height: '100%', background: accentColor,
          animation: 'popupProgress 5s linear forwards',
          borderRadius: 'inherit',
        }} />
      </div>
    </div>
  );
};

// ─── Popup System — mount once inside providers ───────────────────────────────
let _pushPopup = null; // module-level ref so NotificationContext can call it

export const pushPopup = (popup) => {
  if (_pushPopup) _pushPopup(popup);
};

const MAX_POPUPS = 3;

const PopupNotificationSystem = () => {
  const { socket } = useSocket() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [popups, setPopups] = useState([]);
  const idRef = useRef(0);

  const addPopup = useCallback((popup) => {
    const id = ++idRef.current;
    setPopups(prev => {
      const next = [{ ...popup, id }, ...prev];
      return next.slice(0, MAX_POPUPS); // cap at 3
    });
  }, []);

  // Register module-level handle
  useEffect(() => {
    _pushPopup = addPopup;
    return () => { _pushPopup = null; };
  }, [addPopup]);

  const dismiss = useCallback((id) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const locationRef = useRef(location.pathname);
  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // ── Socket: new chat message ──
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      // Don't pop if already on messages page
      if (locationRef.current.startsWith('/messages')) return;

      const senderId   = msg.senderId?._id || msg.senderId;
      const senderName = msg.senderName || msg.userName || 'Someone';
      const chatId     = msg.chatId?._id || msg.chatId;
      const text       = msg.text || (msg.image ? '📷 Image' : '');
      const senderPic  = msg.senderPic || msg.userPic || '';

      // Don't pop for own messages
      if (senderId?.toString() === user._id?.toString()) return;

      addPopup({
        type:    'message',
        title:   senderName,
        body:    text || 'Sent you a message',
        pic:     senderPic,
        chatId,
      });
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, user, addPopup]); // stable — uses locationRef

  // ── Click: navigate to chat or notifications ──────────────────
  const handleClick = useCallback(async (popup) => {
    if (popup.type === 'message' && popup.chatId) {
      try {
        // Access the chat to get its _id (in case we only have a partial ref)
        navigate('/messages', { state: { openChatId: popup.chatId } });
      } catch {
        navigate('/messages');
      }
    } else {
      navigate('/notifications');
    }
  }, [navigate]);

  if (!user || popups.length === 0) return null;

  return (
    <>
      {/* Keyframe for progress bar */}
      <style>{`
        @keyframes popupProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {popups.map((popup, index) => (
        <PopupCard
          key={popup.id}
          popup={popup}
          index={index}
          onDismiss={dismiss}
          onClick={handleClick}
        />
      ))}
    </>
  );
};

export default PopupNotificationSystem;
