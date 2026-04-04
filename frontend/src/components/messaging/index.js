import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';

// ── Helpers ────────────────────────────────────────────────────
const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs  = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)   return 'now';
  if (diffMins < 60)  return `${diffMins}m`;
  if (diffHrs  < 24)  return `${diffHrs}h`;
  if (diffDays < 7)   return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const formatDateSep = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString())       return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

const isSameDay = (ts1, ts2) => {
  if (!ts1 || !ts2) return false;
  return new Date(ts1).toDateString() === new Date(ts2).toDateString();
};

const getRoleBadge = (role, isGroup) => {
  if (isGroup) return { label: 'Group', className: 'msg-role-badge msg-role-badge--group', icon: 'fa-users' };
  if (role === 'alumni') return { label: 'Alumni', className: 'msg-role-badge msg-role-badge--alumni', icon: 'fa-graduation-cap' };
  if (role === 'student') return { label: 'Student', className: 'msg-role-badge msg-role-badge--student', icon: 'fa-user-graduate' };
  return null;
};

// ── Avatar ──────────────────────────────────────────────────────
export const MsgAvatar = ({ name, profilePic, size = 48, isGroup = false, isOnline = false, className = '' }) => {
  const sizeStyle = { width: size, height: size, fontSize: size * 0.38 };

  return (
    <div className={`msg-avatar ${className}`} style={{ width: size, height: size }}>
      {profilePic ? (
        <img
          src={profilePic}
          alt={name}
          className="msg-avatar__img"
          style={sizeStyle}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'flex'); }}
        />
      ) : null}
      <div
        className={`msg-avatar__initial ${isGroup ? 'msg-avatar__initial--group' : ''}`}
        style={{ ...sizeStyle, display: profilePic ? 'none' : 'flex' }}
      >
        {isGroup ? <i className="fas fa-users" style={{ fontSize: size * 0.3 }} /> : (name || 'U').charAt(0).toUpperCase()}
      </div>
      {isOnline && !isGroup && <span className="msg-avatar__online-dot" />}
    </div>
  );
};

// ============================================================
// CHAT SIDEBAR
// ============================================================
export const ChatSidebar = ({ children }) => (
  <div className="msg-sidebar">
    {children}
  </div>
);

ChatSidebar.Header = function ChatSidebarHeader({ isComposing, onCompose, onCancel }) {
  return (
    <div className="msg-sidebar__header">
      <div className="d-flex align-items-center gap-2">
        {isComposing && (
          <button
            className="msg-icon-btn"
            onClick={onCancel}
            title="Back to chats"
          >
            <i className="fas fa-arrow-left" />
          </button>
        )}
        <h5 className="msg-sidebar__title">
          {isComposing ? 'New Message' : 'Messaging'}
        </h5>
      </div>
      {!isComposing && (
        <button className="msg-compose-btn" title="New message" onClick={onCompose}>
          <i className="fas fa-edit" />
        </button>
      )}
    </div>
  );
};

ChatSidebar.Search = function ChatSidebarSearch({ value, onChange }) {
  return (
    <div className="msg-sidebar__search">
      <div className="msg-search-wrap">
        <i className="fas fa-search msg-search-icon" />
        <input
          type="text"
          placeholder="Search messages"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search conversations"
          id="msg-search-input"
        />
        {value && (
          <button className="msg-search-clear" onClick={() => onChange('')} title="Clear">
            <i className="fas fa-times" />
          </button>
        )}
      </div>
    </div>
  );
};

ChatSidebar.List = function ChatSidebarList({ children }) {
  return (
    <div className="msg-sidebar__list">
      {children}
    </div>
  );
};

// ============================================================
// CHAT ITEM
// ============================================================
export const ChatItem = ({ chat, currentUserId, isActive, onClick, unreadCount = 0 }) => {
  const lastMsg = chat.lastMessage?.text ? chat.lastMessage : chat.messages?.[chat.messages.length - 1];
  const isMine   = lastMsg?.senderId === currentUserId || lastMsg?.senderId?._id === currentUserId;
  const hasUnread = unreadCount > 0 && !isActive;
  const badge     = getRoleBadge(chat.userRole, chat.isGroupChat);

  // Format timestamp relative
  const ts = lastMsg?.timestamp || lastMsg?.createdAt || chat.updatedAt;

  return (
    <div
      onClick={onClick}
      className={`msg-chat-item ${isActive ? 'msg-chat-item--active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <MsgAvatar
        name={chat.userName}
        profilePic={chat.profilePic}
        isGroup={chat.isGroupChat}
        isOnline={chat.status === 'online'}
        size={48}
      />

      <div className="msg-chat-item__body">
        <div className="msg-chat-item__top">
          <span className={`msg-chat-item__name ${hasUnread ? 'msg-chat-item__name--bold' : ''}`}>
            {chat.userName}
          </span>
          <div className="d-flex align-items-center gap-1">
            <span className="msg-chat-item__time">{formatTimestamp(ts)}</span>
            {hasUnread && (
              <span className="msg-unread-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>

        {badge && (
          <div className="msg-chat-item__meta">
            <span className={badge.className}>
              <i className={`fas ${badge.icon}`} style={{ fontSize: '0.55rem' }} />
              {badge.label}
            </span>
          </div>
        )}

        <p className={`msg-chat-item__preview ${hasUnread ? 'msg-chat-item__preview--unread' : ''}`}>
          {isMine ? 'You: ' : ''}{lastMsg?.text || 'Start chatting…'}
        </p>
      </div>
    </div>
  );
};

// ── Compose user result row ────────────────────────────────────
export const UserResultItem = ({ user, onClick }) => {
  const badge = getRoleBadge(user.role, false);
  return (
    <div className="msg-user-result" onClick={onClick} role="button" tabIndex={0}>
      <MsgAvatar name={user.name} profilePic={user.profilePic} size={40} />
      <div className="flex-grow-1 min-width-0">
        <div className="msg-user-result__name">{user.name}</div>
        <div className="d-flex align-items-center gap-2 mt-1">
          {badge && <span className={badge.className}><i className={`fas ${badge.icon}`} style={{ fontSize: '0.55rem' }} />{badge.label}</span>}
          <span className="msg-user-result__sub">{user.designation || user.department || ''}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHAT WINDOW
// ============================================================
export const ChatWindow = ({ children }) => (
  <div className="msg-window">{children}</div>
);

ChatWindow.Header = function ChatWindowHeader({ chat, onBack, onProfileClick, onClearChat, onDeleteChat, onVoiceCall }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const badge = getRoleBadge(chat.userRole, chat.isGroupChat);

  return (
    <div className="msg-window__header">
      <div className="d-flex align-items-center gap-1" style={{ minWidth: 0, flex: 1 }}>
        {/* Back button — visible only on mobile via CSS */}
        <button className="msg-icon-btn msg-back-btn" onClick={onBack} aria-label="Back to list">
          <i className="fas fa-arrow-left" />
        </button>

        {/* Clickable avatar + name area → opens profile panel */}
        <div className="msg-window__header-left" onClick={onProfileClick}>
          <MsgAvatar
            name={chat.userName}
            profilePic={chat.profilePic}
            isGroup={chat.isGroupChat}
            isOnline={chat.status === 'online'}
            size={40}
          />
          <div style={{ minWidth: 0 }}>
            <div className="msg-window-name">{chat.userName}</div>
            <div className={`msg-window-status ${chat.status === 'online' ? 'msg-window-status--online' : ''}`}>
              {chat.isGroupChat
                ? `${chat.participants?.length || 0} members`
                : chat.status === 'online'
                  ? '● Active now'
                  : chat.userRole
                    ? (badge ? badge.label : chat.userRole)
                    : '● Offline'}
              {!chat.isGroupChat && chat.company && ` · ${chat.company}`}
            </div>
          </div>
        </div>
      </div>

      <div className="msg-window__header-right" ref={menuRef} style={{ position: 'relative' }}>
        <button className="msg-icon-btn" title="Voice call" onClick={() => onVoiceCall && onVoiceCall(chat)}>
          <i className="fas fa-phone-alt" />
        </button>
        <button className="msg-icon-btn" title="More options" onClick={(e) => { e.stopPropagation(); setShowMenu(p => !p); }}>
          <i className="fas fa-ellipsis-h" />
        </button>

        {showMenu && (
          <div className="msg-dropdown">
            <button
              className="msg-dropdown__item"
              onClick={() => { onClearChat && onClearChat(); setShowMenu(false); }}
            >
              <i className="fas fa-eraser text-muted" style={{ width: 16 }} />
              Clear Chat
            </button>
            <button
              className="msg-dropdown__item msg-dropdown__item--danger"
              onClick={() => { onDeleteChat && onDeleteChat(); setShowMenu(false); }}
            >
              <i className="fas fa-trash-alt" style={{ width: 16 }} />
              Delete Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Date separator ─────────────────────────────────────────────
const DateSeparator = ({ label }) => (
  <div className="msg-date-sep">
    <div className="msg-date-sep__line" />
    <span className="msg-date-sep__label">{label}</span>
    <div className="msg-date-sep__line" />
  </div>
);

// ── Single bubble ──────────────────────────────────────────────
export const ChatBubble = ({ msg, isMine, isLastInGroup }) => {
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : msg.timestamp
      ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

  const hasImage = !!msg.image;
  const hasText  = !!msg.text;

  return (
    <div className={`msg-bubble-wrap ${isMine ? 'msg-bubble-wrap--mine' : 'msg-bubble-wrap--theirs'} ${isLastInGroup ? 'msg-bubble-wrap--gap-top' : ''}`}>
      <div className={`msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`} style={hasImage ? { padding: 4, maxWidth: 280 } : undefined}>
        {hasImage && (
          <img
            src={msg.image}
            alt="shared"
            loading="lazy"
            onClick={() => window.open(msg.image, '_blank')}
            style={{ width: '100%', borderRadius: hasText ? '12px 12px 4px 4px' : 12, cursor: 'pointer', display: 'block' }}
          />
        )}
        {hasText && <div style={hasImage ? { padding: '6px 8px 2px' } : undefined}>{msg.text}</div>}
        <div className="msg-bubble__meta" style={hasImage && !hasText ? { padding: '2px 8px' } : undefined}>
          <span>{time}</span>
          {isMine && (
            <span className={`msg-bubble__tick ${msg.isRead ? 'msg-bubble__tick--seen' : ''}`}>
              {msg.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Messages panel ─────────────────────────────────────────────
ChatWindow.Messages = function ChatWindowMessages({ messages, currentUserId, onLoadMore, hasMore, isLoadingMore }) {
  const scrollRef = useRef(null);
  const endRef    = useRef(null);
  const prevScrollHeight = useRef(null);

  // Auto-scroll to bottom when new messages arrive (not when loading older ones)
  useEffect(() => {
    if (!isLoadingMore) {
      endRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isLoadingMore]);

  // Restore scroll position after prepending older messages
  useEffect(() => {
    if (!isLoadingMore && prevScrollHeight.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = null;
    }
  }, [messages, isLoadingMore]);

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !isLoadingMore && onLoadMore) {
      prevScrollHeight.current = e.target.scrollHeight;
      onLoadMore();
    }
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="msg-messages">
      {isLoadingMore && (
        <div className="msg-load-more">
          <span className="spinner-border spinner-border-sm text-secondary" role="status" />
        </div>
      )}

      {messages.map((msg, idx) => {
        const prev = messages[idx - 1];
        const isMine = msg.senderId?._id === currentUserId || msg.senderId === currentUserId;
        const showDate = !isSameDay(prev?.createdAt || prev?.timestamp, msg.createdAt || msg.timestamp);
        // New group if: first message, different sender from prev, or big time gap
        const prevSenderId = prev?.senderId?._id || prev?.senderId;
        const curSenderId  = msg.senderId?._id  || msg.senderId;
        const isNewGroup   = !prev || prevSenderId !== curSenderId || showDate;

        return (
          <React.Fragment key={msg._id || msg.id || idx}>
            {showDate && <DateSeparator label={formatDateSep(msg.createdAt || msg.timestamp)} />}
            <ChatBubble msg={msg} isMine={isMine} isLastInGroup={isNewGroup} />
          </React.Fragment>
        );
      })}

      <div ref={endRef} style={{ height: 1 }} />
    </div>
  );
};

// ── Input bar ──────────────────────────────────────────────────
ChatWindow.Input = function ChatWindowInput({ value, onChange, onSend, onImageSend, disabled, blockedMessage, onSendConnectionRequest, isSendingRequest }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const EMOJIS = ['😊','😂','❤️','👍','🎉','🙏','😍','🔥','👏','😢','😮','🤔','💪','✅','🚀','😁','🙌','💯','🤝','😎'];

  // Blocked / not-connected state
  if (disabled && blockedMessage) {
    return (
      <div className="msg-blocked-bar">
        <div className="msg-blocked-alert">
          <i className="fas fa-lock msg-blocked-alert__icon" />
          <span className="msg-blocked-alert__text">{blockedMessage}</span>
          {onSendConnectionRequest && (
            <button
              className="msg-connect-btn"
              onClick={onSendConnectionRequest}
              disabled={isSendingRequest}
            >
              {isSendingRequest ? (
                <><span className="spinner-border spinner-border-sm me-1" role="status" />Sending…</>
              ) : 'Connect'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }
  };

  const addEmoji = (emoji) => {
    onChange(value + emoji);
    setShowEmoji(false);
  };

  const handleChange = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    onChange(el.value);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearImage = () => { setImageFile(null); setImagePreview(null); };

  const handleSendClick = async () => {
    if (imageFile && onImageSend) {
      setUploading(true);
      try { await onImageSend(imageFile, value.trim()); clearImage(); onChange(''); }
      catch(_) {}
      finally { setUploading(false); }
    } else {
      onSend();
    }
  };

  const canSend = value.trim() || imageFile;

  return (
    <div className="msg-input-bar">
      {showEmoji && (
        <div className="msg-emoji-picker">
          {EMOJIS.map(emoji => (
            <button key={emoji} className="msg-emoji-btn" onClick={() => addEmoji(emoji)}>{emoji}</button>
          ))}
        </div>
      )}
      {imagePreview && (
        <div style={{ padding: '8px 12px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={imagePreview} alt="preview" style={{ height: 64, borderRadius: 8, objectFit: 'cover' }} />
          <button onClick={clearImage} style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer' }}>×</button>
          {uploading && <span className="spinner-border spinner-border-sm text-danger" role="status" />}
        </div>
      )}
      <div className="msg-input-inner">
        <div className="msg-input-icons">
          <button
            className="msg-input-icon-btn"
            title="Send image"
            onClick={() => fileRef.current?.click()}
          >
            <i className="fa-solid fa-image" />
          </button>
          <input ref={fileRef} type="file" className="d-none" accept="image/*" onChange={handleFileSelect} />
          <button
            className={`msg-input-icon-btn ${showEmoji ? 'msg-input-icon-btn--active' : ''}`}
            title="Emoji"
            onClick={() => setShowEmoji(p => !p)}
          >
            <i className="fa-regular fa-face-smile" />
          </button>
        </div>

        <textarea
          className="msg-textarea"
          rows={1}
          placeholder="Write a message…"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          id="msg-text-input"
          aria-label="Message input"
        />

        <button
          className={`msg-send-btn ${!canSend ? 'msg-send-btn--dim' : ''}`}
          onClick={handleSendClick}
          title="Send"
          disabled={!canSend || uploading}
          aria-label="Send message"
        >
          {uploading ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="fas fa-paper-plane" />}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// PROFILE PREVIEW PANEL (right column on desktop)
// ============================================================
export const ProfilePreviewPanel = ({ chat, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!chat?.otherUserId || chat.isGroupChat) {
      setLoading(false);
      return;
    }

    userService.getById(chat.otherUserId)
      .then(({ data }) => { if (!cancelled) setProfile(data.data || data); })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [chat?.otherUserId, chat?.isGroupChat]);

  const handleViewProfile = () => {
    if (chat?.otherUserId) navigate(`/profile/${chat.otherUserId}`);
  };

  const badge = getRoleBadge(chat?.userRole, chat?.isGroupChat);

  return (
    <div className="msg-profile-panel">
      <div className="msg-profile-panel__header">
        <h6 className="msg-profile-panel__title">Profile Info</h6>
        <button className="msg-profile-panel__close" onClick={onClose} title="Close panel">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="msg-profile-panel__body">
        {/* Avatar */}
        <div className="msg-profile-panel__avatar">
          {profile?.profilePic
            ? <img src={profile.profilePic} alt={chat?.userName} />
            : <span>{(chat?.userName || 'U').charAt(0).toUpperCase()}</span>
          }
        </div>

        {/* Name */}
        <div className="msg-profile-panel__name">{chat?.userName}</div>

        {/* Role badge */}
        {badge && <span className={badge.className}><i className={`fas ${badge.icon}`} style={{ fontSize: '0.6rem' }} />{badge.label}</span>}

        {loading ? (
          /* Skeleton rows while loading */
          <div className="msg-profile-panel__info" style={{ width: '100%' }}>
            {[80, 65, 55].map((w, i) => (
              <div key={i} style={{ height: 12, background: '#f0f0f0', borderRadius: 6, width: `${w}%`, marginBottom: 6 }} />
            ))}
          </div>
        ) : profile ? (
          <>
            {profile.bio && (
              <p className="msg-profile-panel__bio">{profile.bio}</p>
            )}
            <div className="msg-profile-panel__info">
              {profile.department && (
                <div className="msg-profile-panel__row">
                  <i className="fas fa-building msg-profile-panel__row-icon" />
                  <span className="msg-profile-panel__row-text">{profile.department}</span>
                </div>
              )}
              {profile.batch && (
                <div className="msg-profile-panel__row">
                  <i className="fas fa-calendar-alt msg-profile-panel__row-icon" />
                  <span className="msg-profile-panel__row-text">Batch of {profile.batch}</span>
                </div>
              )}
              {profile.company && (
                <div className="msg-profile-panel__row">
                  <i className="fas fa-briefcase msg-profile-panel__row-icon" />
                  <span className="msg-profile-panel__row-text">{profile.company}</span>
                </div>
              )}
              {profile.designation && (
                <div className="msg-profile-panel__row">
                  <i className="fas fa-user-tie msg-profile-panel__row-icon" />
                  <span className="msg-profile-panel__row-text">{profile.designation}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="msg-profile-panel__bio">No additional profile info available.</p>
        )}

        <div className="msg-profile-panel__actions">
          <button className="msg-view-profile-btn" onClick={handleViewProfile}>
            <i className="fas fa-external-link-alt me-2" style={{ fontSize: '0.8rem' }} />
            View Full Profile
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CALL MODAL
// ============================================================
ChatWindow.CallModal = function ChatWindowCallModal({ chat, onEndCall }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  if (!chat) return null;

  return (
    <div className="msg-call-modal">
      <div className="msg-call-card">
        <div className="d-flex align-items-center gap-2">
          <MsgAvatar name={chat.userName} profilePic={chat.profilePic} size={32} />
          <div className="overflow-hidden">
            <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{chat.userName}</div>
            <div style={{ fontSize: '0.72rem', color: '#c8102e' }} className="animate-pulse">Calling…</div>
          </div>
        </div>
        <div className="d-flex gap-3 justify-content-center">
          <button
            className={`btn rounded-circle d-flex align-items-center justify-content-center border-0 ${isMuted ? 'bg-danger text-white' : 'btn-light text-muted'}`}
            style={{ width: 40, height: 40 }}
            title={isMuted ? 'Unmute' : 'Mute'}
            onClick={() => setIsMuted(p => !p)}
          >
            <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`} />
          </button>
          <button
            className={`btn rounded-circle d-flex align-items-center justify-content-center border-0 ${isSpeakerOn ? 'bg-primary text-white' : 'btn-light text-muted'}`}
            style={{ width: 40, height: 40 }}
            title={isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
            onClick={() => setIsSpeakerOn(p => !p)}
          >
            <i className={`fas ${isSpeakerOn ? 'fa-volume-up' : 'fa-volume-down'}`} />
          </button>
          <button
            className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center border-0"
            style={{ width: 40, height: 40 }}
            title="End Call"
            onClick={onEndCall}
          >
            <i className="fas fa-phone-slash" style={{ transform: 'rotate(225deg)', fontSize: '0.85rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// EMPTY STATE — no chat selected
// ============================================================
export const ChatEmptyState = () => (
  <div className="msg-empty-state">
    <div className="msg-empty-state__icon-wrap">
      <i className="fas fa-comments msg-empty-state__icon" />
    </div>
    <h5 className="msg-empty-state__title">Your Messages</h5>
    <p className="msg-empty-state__desc">
      Select a conversation from the left, or start a new one by clicking the ✏️ icon.
    </p>
  </div>
);

// ── Typing indicator bar ───────────────────────────────────────
export const TypingIndicator = ({ name }) => (
  <div className="msg-typing-bar">
    <div className="msg-typing-dots">
      <span /><span /><span />
    </div>
    <span>{name} is typing…</span>
  </div>
);

// Default export for backward compat
const Messaging = {
  ChatSidebar,
  ChatItem,
  ChatWindow,
  ChatBubble,
  ChatEmptyState,
  ProfilePreviewPanel,
  TypingIndicator,
  UserResultItem,
  MsgAvatar,
};

export default Messaging;
