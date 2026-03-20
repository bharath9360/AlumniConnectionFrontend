import React, { useRef, useEffect } from 'react';

// ============================================================
// COMPOUND COMPONENTS FOR MESSAGING
// ============================================================

/**
 * ChatSidebar — Left pane: search + chat list
 */
export const ChatSidebar = ({ children }) => (
    <div className="d-flex flex-column h-100 border-end bg-white" style={{ minWidth: 0 }}>
        {children}
    </div>
);

ChatSidebar.Header = function ChatSidebarHeader({ onCompose, isComposing, onCancel }) {
    return (
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
                {isComposing && (
                    <button
                        className="btn btn-link p-0 text-dark me-1"
                        onClick={onCancel}
                        title="Back to chats"
                        style={{ border: 'none', background: 'none' }}
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                )}
                <h5 className="fw-bold mb-0" style={{ color: '#c84022' }}>
                    {isComposing ? 'New Message' : 'Messaging'}
                </h5>
            </div>
            {!isComposing && (
                <button
                    className="btn btn-link p-1 text-muted"
                    title="New message"
                    onClick={onCompose}
                    style={{ border: 'none', background: 'none' }}
                >
                    <i className="fas fa-edit" style={{ fontSize: '1rem' }}></i>
                </button>
            )}
        </div>
    );
};

ChatSidebar.Search = function ChatSidebarSearch({ value, onChange }) {
    return (
        <div className="px-3 py-2 border-bottom">
            <div className="position-relative">
                <i
                    className="fas fa-search position-absolute text-muted"
                    style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', pointerEvents: 'none' }}
                ></i>
                <input
                    type="text"
                    className="form-control rounded-pill ps-4"
                    style={{ fontSize: '0.85rem', backgroundColor: '#f3f2ef', border: '1px solid #e0e0e0', height: '36px' }}
                    placeholder="Search messages"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
};

ChatSidebar.List = function ChatSidebarList({ children }) {
    return (
        <div className="flex-grow-1 overflow-auto">
            {children}
        </div>
    );
};

/**
 * ChatItem — A single conversation row in the sidebar
 */
export const ChatItem = ({ chat, currentUserId, isActive, onClick }) => {
    const lastMsg = chat.lastMessage?.text ? chat.lastMessage : chat.messages?.[chat.messages.length - 1];
    const isMine = lastMsg?.senderId === currentUserId;

    return (
        <div
            onClick={onClick}
            className="d-flex align-items-center gap-3 px-3 py-3 border-bottom"
            style={{
                cursor: 'pointer',
                backgroundColor: isActive ? '#f3f2ef' : 'white',
                borderLeft: isActive ? '3px solid #c84022' : '3px solid transparent',
                transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#fafafa'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'white'; }}
        >
            {/* Avatar */}
            <div className="position-relative flex-shrink-0">
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: '48px', height: '48px', backgroundColor: '#c84022', fontSize: '1rem' }}
                >
                    {chat.userInitial}
                </div>
                {chat.status === 'online' && (
                    <span
                        className="position-absolute border border-white rounded-circle bg-success"
                        style={{ width: '12px', height: '12px', bottom: '1px', right: '1px' }}
                    ></span>
                )}
            </div>

            {/* Name + preview */}
            <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>{chat.userName}</span>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        {lastMsg?.timestamp ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>
                <p className="mb-0 text-muted text-truncate" style={{ fontSize: '0.8rem' }}>
                    {isMine ? 'You: ' : ''}{lastMsg?.text || 'Start chatting...'}
                </p>
            </div>
        </div>
    );
};

/**
 * ChatWindow — Right pane wrapper
 */
export const ChatWindow = ({ children }) => (
    <div className="d-flex flex-column h-100" style={{ backgroundColor: '#f3f2ef' }}>
        {children}
    </div>
);

ChatWindow.Header = function ChatWindowHeader({ chat, onBack, onClearChat, onDeleteChat, onVoiceCall }) {
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="px-4 py-3 bg-white border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
            <div className="d-flex align-items-center gap-3">
                <button
                    className="btn btn-link p-0 d-lg-none text-dark"
                    onClick={onBack}
                    aria-label="Back to list"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                    style={{ width: '40px', height: '40px', backgroundColor: '#c84022', fontSize: '0.9rem' }}
                >
                    {chat.userInitial}
                </div>
                <div>
                    <div className="fw-bold text-dark" style={{ fontSize: '0.95rem', lineHeight: 1.2 }}>{chat.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: chat.status === 'online' ? '#44a04a' : '#888' }}>
                        {chat.status === 'online' ? '● Active now' : '● Offline'}
                    </div>
                </div>
            </div>
            <div className="d-flex gap-3 text-muted position-relative" ref={menuRef}>
                <button
                    className="btn btn-link text-muted p-1"
                    title="Voice call"
                    onClick={() => onVoiceCall && onVoiceCall(chat)}
                >
                    <i className="fas fa-phone-alt"></i>
                </button>
                <button
                    className="btn btn-link text-muted p-1"
                    title="More options"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    <i className="fas fa-ellipsis-h"></i>
                </button>

                {showMenu && (
                    <div
                        className="position-absolute bg-white border rounded shadow-sm py-1"
                        style={{ top: '100%', right: 0, zIndex: 1060, minWidth: '180px' }}
                    >
                        <button
                            className="dropdown-item px-3 py-2 text-dark d-flex align-items-center gap-2 border-0 bg-transparent w-100 text-start menu-item-hover"
                            style={{ fontSize: '0.85rem' }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClearChat(); setShowMenu(false); }}
                        >
                            <i className="fas fa-eraser text-muted" style={{ width: '16px' }}></i>
                            Clear Chat
                        </button>
                        <button
                            className="dropdown-item px-3 py-2 text-danger d-flex align-items-center gap-2 border-0 bg-transparent w-100 text-start menu-item-hover"
                            style={{ fontSize: '0.85rem' }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteChat(); setShowMenu(false); }}
                        >
                            <i className="fas fa-trash-alt" style={{ width: '16px' }}></i>
                            Delete Conversation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

ChatWindow.Messages = function ChatWindowMessages({ messages, currentUserId }) {
    const endRef = useRef(null);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Group messages by date (simple — use timestamp prefix)
    return (
        <div className="flex-grow-1 overflow-auto px-4 py-3 d-flex flex-column gap-2">
            {messages.map(msg => (
                <ChatBubble key={msg._id || msg.id} msg={msg} isMine={msg.senderId?._id === currentUserId || msg.senderId === currentUserId} />
            ))}
            <div ref={endRef} />
        </div>
    );
};

ChatWindow.Input = function ChatWindowInput({ value, onChange, onSend }) {
    const [showEmoji, setShowEmoji] = React.useState(false);
    const fileRef = React.useRef(null);
    const EMOJIS = ['😊', '😂', '❤️', '👍', '🎉', '🙏', '😍', '🔥', '👏', '😢', '😮', '🤔', '💪', '✅', '🚀', '😁', '🙌', '💯', '🤝', '😎'];

    const handleKey = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    };

    const addEmoji = (emoji) => {
        onChange(value + emoji);
        setShowEmoji(false);
    };

    return (
        <div className="px-3 py-2 bg-white border-top flex-shrink-0">
            {/* Emoji picker popup */}
            {showEmoji && (
                <div
                    className="bg-white rounded-3 p-2 mb-2 d-flex flex-wrap gap-1"
                    style={{ border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxWidth: '300px' }}
                >
                    {EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            className="btn p-1"
                            style={{ fontSize: '1.2rem', lineHeight: 1, border: 'none', background: 'none' }}
                            onClick={() => addEmoji(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            <div
                className="d-flex align-items-end gap-2 rounded-3 px-3 py-2"
                style={{ backgroundColor: '#f3f2ef', border: '1px solid #ddd' }}
            >
                {/* Left icons: emoji + attachment */}
                <div className="d-flex gap-2 align-self-end pb-1 flex-shrink-0">
                    {/* Attachment/Paperclip */}
                    <button
                        className="btn p-0 border-0"
                        style={{ color: '#555', background: 'none', lineHeight: 1, width: '26px', fontSize: '1rem' }}
                        title="Attach file"
                        onClick={() => fileRef.current?.click()}
                    >
                        <i className="fa-solid fa-paperclip"></i>
                    </button>
                    <input ref={fileRef} type="file" className="d-none" accept="image/*,.pdf,.doc,.docx" />

                    {/* Emoji / Smiley */}
                    <button
                        className="btn p-0 border-0"
                        style={{ color: showEmoji ? '#c84022' : '#555', background: 'none', lineHeight: 1, width: '26px', fontSize: '1rem' }}
                        title="Emoji"
                        onClick={() => setShowEmoji(prev => !prev)}
                    >
                        <i className="fa-regular fa-face-smile"></i>
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    className="form-control border-0 bg-transparent p-0 flex-grow-1"
                    rows={1}
                    placeholder="Write a message…"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyPress={handleKey}
                    style={{ resize: 'none', minHeight: '26px', maxHeight: '100px', fontSize: '0.9rem', boxShadow: 'none', outline: 'none' }}
                />

                {/* Send button — always red, sends on click */}
                <button
                    onClick={onSend}
                    title="Send"
                    className="btn rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 align-self-end"
                    style={{
                        width: '36px', height: '36px',
                        backgroundColor: '#c84022',
                        color: 'white',
                        border: 'none',
                        opacity: value.trim() ? 1 : 0.45,
                        transition: 'opacity 0.2s',
                        fontSize: '0.85rem',
                        cursor: value.trim() ? 'pointer' : 'default'
                    }}
                >
                    ➤
                </button>
            </div>
        </div>
    );
};

/**
 * ChatBubble — Individual message bubble
 */
export const ChatBubble = ({ msg, isMine }) => {
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.timestamp;
    return (
        <div className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}>
            <div
                className="px-3 py-2 rounded-3"
                style={{
                    maxWidth: '85%',
                    backgroundColor: isMine ? '#c84022' : '#ffffff',
                    color: isMine ? 'white' : '#333',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                    // Bubble shape
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}
            >
                {msg.text}
            </div>
            <span className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>{time}</span>
        </div>
    );
};

/**
 * CallModal — Persistent bottom-right voice call widget
 */
ChatWindow.CallModal = function ChatWindowCallModal({ chat, onEndCall }) {
    const [isMuted, setIsMuted] = React.useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = React.useState(false);

    if (!chat) return null;

    return (
        <div
            className="position-fixed"
            style={{
                zIndex: 2000,
                bottom: '24px',
                right: '24px',
                animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
        >
            <div
                className="bg-white rounded-4 shadow-lg p-3 d-flex flex-column align-items-center gap-3 border"
                style={{ width: '220px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
            >
                {/* Header with name and status */}
                <div className="d-flex align-items-center gap-2 w-100">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                        style={{ width: '32px', height: '32px', backgroundColor: '#c84022', fontSize: '0.8rem' }}
                    >
                        {chat.userInitial}
                    </div>
                    <div className="overflow-hidden">
                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>{chat.userName}</div>
                        <div className="text-mamcet-red extra-small fw-semibold animate-pulse">Calling...</div>
                    </div>
                </div>

                {/* Call Controls */}
                <div className="d-flex gap-3">
                    <button
                        className={`btn rounded-circle d-flex align-items-center justify-content-center border-0 ${isMuted ? 'bg-danger text-white' : 'btn-light text-muted'}`}
                        style={{ width: '40px', height: '40px' }}
                        title={isMuted ? "Unmute" : "Mute"}
                        onClick={() => setIsMuted(!isMuted)}
                    >
                        <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                    </button>
                    <button
                        className={`btn rounded-circle d-flex align-items-center justify-content-center border-0 ${isSpeakerOn ? 'bg-primary text-white' : 'btn-light text-muted'}`}
                        style={{ width: '40px', height: '40px' }}
                        title={isSpeakerOn ? "Speaker Off" : "Speaker On"}
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    >
                        <i className={`fas ${isSpeakerOn ? 'fa-volume-up' : 'fa-volume-down'}`}></i>
                    </button>
                    <button
                        onClick={onEndCall}
                        className="btn btn-danger rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm"
                        style={{ width: '40px', height: '40px', backgroundColor: '#dc3545' }}
                        title="End Call"
                    >
                        <i className="fas fa-phone-slash" style={{ transform: 'rotate(225deg)', fontSize: '0.9rem' }}></i>
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                .animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

/**
 * EmptyState — When no chat is selected
 */
export const ChatEmptyState = () => (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted gap-3">
        <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '72px', height: '72px', backgroundColor: '#e8e8e8' }}
        >
            <i className="fas fa-comments" style={{ fontSize: '1.8rem', color: '#aaa' }}></i>
        </div>
        <div className="text-center">
            <div className="fw-semibold text-dark mb-1">Your Messages</div>
            <div style={{ fontSize: '0.85rem' }}>Select a conversation to start chatting</div>
        </div>
    </div>
);

const Messaging = {
    ChatSidebar,
    ChatItem,
    ChatWindow,
    ChatBubble,
    ChatEmptyState
};

export default Messaging;
