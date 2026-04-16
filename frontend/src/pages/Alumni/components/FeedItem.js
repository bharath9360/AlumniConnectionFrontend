import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    FaEllipsisH, FaPencilAlt, FaTrashAlt,
    FaLink, FaFlag, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ── Media URL resolver ────────────────────────────────────────────────────────
const resolveMediaUrl = (url) => {
    if (!url || !url.trim()) return null;
    if (url.startsWith('https://res.cloudinary.com') || url.startsWith('http://res.cloudinary.com')) {
        if (!url.includes('f_auto') && !url.includes('q_auto')) {
            return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        }
        return url;
    }
    if (url.startsWith('https://') || url.startsWith('http://')) return url;
    const base = process.env.REACT_APP_BACKEND_URL ||
                 (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') ||
                 'http://localhost:5000';
    return `${base}${url}`;
};

// ── Liked-by avatar strip ─────────────────────────────────────────────────────
const LikeAvatars = ({ likedBy = [], totalLikes = 0 }) => {
    if (totalLikes === 0) return null;

    // likedBy may be ObjectId strings or populated user objects
    const previews = likedBy.slice(0, 2).filter(Boolean);
    const extraCount = Math.max(0, totalLikes - previews.length);

    return (
        <div className="d-flex align-items-center gap-1" style={{ minHeight: 20 }}>
            {/* overlapping avatar circles */}
            <div className="d-flex" style={{ marginRight: previews.length ? 4 : 0 }}>
                {previews.map((u, i) => {
                    const pic  = typeof u === 'object' ? (u.profilePic || u.userPic || '') : '';
                    const name = typeof u === 'object' ? (u.name || u.userName || '?')    : '?';
                    const resolved = resolveMediaUrl(pic);
                    return (
                        <div
                            key={i}
                            title={name}
                            style={{
                                width: 18, height: 18, borderRadius: '50%',
                                border: '2px solid #fff',
                                marginLeft: i === 0 ? 0 : -6,
                                background: '#e0e0e0',
                                overflow: 'hidden', flexShrink: 0,
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 9, fontWeight: 700,
                                color: '#555',
                            }}
                        >
                            {resolved
                                ? <img src={resolved} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                                : name[0]?.toUpperCase()
                            }
                        </div>
                    );
                })}
            </div>

            {/* thumbs-up icon + count text */}
            <span style={{ fontSize: 11.5, color: '#555' }}>
                <i className="fas fa-thumbs-up text-mamcet-red me-1" style={{ fontSize: 10 }} />
                {totalLikes === 1
                    ? '1 like'
                    : previews[0] && typeof previews[0] === 'object' && previews[0].name
                        ? `${previews[0].name.split(' ')[0]} and ${extraCount > 0 ? `${extraCount} other${extraCount > 1 ? 's' : ''}` : (previews[1] && typeof previews[1] === 'object' ? previews[1].name.split(' ')[0] : '')}`
                        : `${totalLikes} likes`
                }
            </span>
        </div>
    );
};

// ── Main FeedItem component ────────────────────────────────────────────────────
const FeedItem = ({ post, onLike, onComment, onShare, onEdit, onDelete, onDeleteComment, onReport }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const loggedInUserId = user?._id || user?.id;

    const [showComments, setShowComments] = useState(false);
    const [commentText,  setCommentText]  = useState('');
    const [menuOpen,     setMenuOpen]     = useState(false);
    const menuRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handleOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [menuOpen]);

    const handleCommentSubmit = (e) => {
        if (e.key === 'Enter' && commentText.trim()) {
            onComment(post._id || post.id, commentText);
            setCommentText('');
        }
    };

    // ── Author fields ────────────────────────────────────────────
    const authorId   = post.authorId  || post.userId;
    const authorName = post.userName  || 'Anonymous';
    const authorRole = post.userRole  || '';
    const authorPic  = post.userPic   || '';
    const resolvedAuthorPic = resolveMediaUrl(authorPic);

    const rawMedia = post.media || post.imageURL || post.image;
    const mediaUrl = resolveMediaUrl(rawMedia);
    const postId   = post._id || post.id;

    const isAuthor = !!(loggedInUserId && authorId && String(loggedInUserId) === String(authorId));

    // ── Timestamp ────────────────────────────────────────────────
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)    return `${diff}s ago`;
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    // ── Share / copy link ────────────────────────────────────────
    const handleCopyLink = useCallback(() => {
        const link = `${window.location.origin}/post/${postId}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(link)
                .then(() => toast.success('🔗 Link copied to clipboard!'))
                .catch(() => toast.error('Failed to copy link.'));
        } else {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            toast.success('🔗 Link copied to clipboard!');
        }
        setMenuOpen(false);
    }, [postId]);

    const handleShare = useCallback(() => {
        if (onShare) onShare(postId);
        handleCopyLink();
    }, [onShare, postId, handleCopyLink]);

    const handleReport = useCallback(() => {
        setMenuOpen(false);
        if (onReport) {
            onReport(postId);
        } else {
            toast('🚩 Post reported. Our team will review it.', { icon: '🚩' });
        }
    }, [onReport, postId]);

    return (
        <div className="dashboard-card mb-3 shadow-sm bg-white rounded-3 border-0 position-relative">

            {/* ── 3-Dots Context Menu ── */}
            <div className="position-absolute" style={{ top: 12, right: 12, zIndex: 20 }} ref={menuRef}>
                <button
                    className="btn btn-sm d-flex align-items-center justify-content-center"
                    onClick={() => setMenuOpen(p => !p)}
                    style={{
                        width: 32, height: 32, padding: 0, borderRadius: '50%',
                        background: menuOpen ? '#f5f5f5' : 'transparent',
                        border: 'none', transition: 'background 0.15s',
                    }}
                    title="More options"
                >
                    <FaEllipsisH size={13} color="#666" />
                </button>

                {menuOpen && (
                    <div style={{
                        position: 'absolute', top: 36, right: 0,
                        background: '#fff', border: '1px solid #ececec',
                        borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        minWidth: 180, overflow: 'hidden', zIndex: 30,
                        animation: 'fadeInDown 0.15s ease',
                    }}>
                        {/* Owner-only actions */}
                        {isAuthor && onEdit && (
                            <button
                                className="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                style={{ fontSize: 13 }}
                                onClick={() => { onEdit(post); setMenuOpen(false); }}
                            >
                                <FaPencilAlt size={12} color="#c84022" /> Edit Post
                            </button>
                        )}
                        {isAuthor && onDelete && (
                            <button
                                className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                style={{ fontSize: 13 }}
                                onClick={() => {
                                    setMenuOpen(false);
                                    if (window.confirm('Delete this post? This cannot be undone.')) {
                                        onDelete(postId);
                                    }
                                }}
                            >
                                <FaTrashAlt size={12} /> Delete Post
                            </button>
                        )}

                        {/* Divider if owner has actions above */}
                        {isAuthor && (onEdit || onDelete) && (
                            <div style={{ height: 1, background: '#f0f0f0', margin: '2px 0' }} />
                        )}

                        {/* Available to everyone */}
                        <button
                            className="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                            style={{ fontSize: 13 }}
                            onClick={handleCopyLink}
                        >
                            <FaLink size={12} color="#555" /> Copy Link
                        </button>

                        <button
                            className="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                            style={{ fontSize: 13 }}
                            onClick={() => { navigate(`/post/${postId}`); setMenuOpen(false); }}
                        >
                            <i className="far fa-eye" style={{ fontSize: 12, color: '#555' }} /> View Post
                        </button>

                        {!isAuthor && (
                            <button
                                className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-warning"
                                style={{ fontSize: 13 }}
                                onClick={handleReport}
                            >
                                <FaFlag size={12} /> Report Post
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="p-3">
                {/* ── Post Header ── */}
                <div className="d-flex align-items-center mb-3" style={{ paddingRight: '44px' }}>
                    <Link to={`/profile/${authorId}`} className="text-decoration-none d-flex align-items-center">
                        <div
                            className="me-2 bg-secondary text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden' }}
                        >
                            {authorPic ? (
                                <img
                                    src={resolvedAuthorPic}
                                    alt={authorName}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <span>{authorName?.[0]?.toUpperCase() || '?'}</span>
                            )}
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark small">{authorName}</h6>
                            {authorRole && <p className="extra-small text-muted mb-0">{authorRole}</p>}
                            <p className="extra-small text-muted mb-0">{timeAgo(post.createdAt || post.timestamp)}</p>
                        </div>
                    </Link>
                </div>

                {/* ── Post Content ── */}
                {post.content && <p className="small text-dark mb-3" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>}

                {/* ── Post Image ── */}
                {mediaUrl && (
                    <div className="post-media mb-3 rounded-3 overflow-hidden border">
                        <img
                            src={mediaUrl}
                            alt="Post attachment"
                            loading="lazy"
                            decoding="async"
                            className="w-100"
                            style={{ maxHeight: '400px', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { e.target.closest('.post-media').style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* ── Post Stats: likes preview + comment/share counts ── */}
                <div className="d-flex justify-content-between align-items-center extra-small text-muted border-bottom pb-2 mb-2">
                    <LikeAvatars likedBy={post.likedBy || []} totalLikes={post.likes || 0} />
                    <span>
                        {post.comments?.length > 0 && `${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`}
                        {post.comments?.length > 0 && post.shares > 0 && ' · '}
                        {post.shares > 0 && `${post.shares} share${post.shares !== 1 ? 's' : ''}`}
                    </span>
                </div>

                {/* ── Post Actions ── */}
                <div className="d-flex border-top border-bottom py-1 post-actions-pro">
                    <button
                        className={`btn btn-pro btn-pro-ghost flex-grow-1 gap-2 ${post.liked ? 'text-mamcet-red' : ''}`}
                        onClick={() => onLike(postId)}
                        style={{ transition: 'color 0.2s, transform 0.15s' }}
                    >
                        <i className={`${post.liked ? 'fas' : 'far'} fa-thumbs-up`} />
                        <span>{post.liked ? 'Liked' : 'Like'}</span>
                    </button>
                    <button
                        className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <i className="far fa-comment-alt" />
                        <span>Comment</span>
                    </button>
                    <button
                        className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2"
                        onClick={handleShare}
                    >
                        <i className="far fa-share-square" />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* ── Comments Section ── */}
            {showComments && (
                <div className="p-3 bg-light rounded-bottom-3 border-top">
                    <div className="d-flex gap-2 mb-3">
                        <div
                            className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: '32px', height: '32px', fontSize: '13px' }}
                        >
                            {user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill"
                            placeholder="Add a comment… (press Enter to post)"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={handleCommentSubmit}
                        />
                    </div>

                    <div className="comments-list">
                        {post.comments?.map((comment, idx) => {
                            const commentOwnerId = typeof comment.userId === 'object'
                                ? (comment.userId?._id || comment.userId)
                                : comment.userId;
                            const isCommentAuthor = !!(loggedInUserId && commentOwnerId && String(loggedInUserId) === String(commentOwnerId));
                            return (
                                <div key={comment._id || comment.id || idx} className="d-flex gap-2 mb-2">
                                    <div
                                        className="bg-light border text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: '32px', height: '32px', fontSize: '13px', overflow: 'hidden' }}
                                    >
                                        {comment.userPic ? (
                                            <img src={comment.userPic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            comment.userName?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                    <div className="bg-white p-2 px-3 rounded-3 shadow-sm flex-grow-1 position-relative">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h6 className="extra-small fw-bold mb-0">{comment.userName || 'Anonymous'}</h6>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="extra-small text-muted">{timeAgo(comment.createdAt)}</span>
                                                {isCommentAuthor && onDeleteComment && (
                                                    <FaTrashAlt
                                                        className="text-danger"
                                                        style={{ cursor: 'pointer', fontSize: '11px' }}
                                                        title="Delete comment"
                                                        onClick={() => {
                                                            if (window.confirm('Delete comment?')) onDeleteComment(postId, comment._id);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <p className="extra-small mb-0 text-dark">{comment.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Inline keyframe ── */}
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default React.memo(FeedItem, (prev, next) => {
    return (
        prev.post._id           === next.post._id           &&
        prev.post.likes         === next.post.likes         &&
        prev.post.liked         === next.post.liked         &&
        prev.post.likedBy?.length === next.post.likedBy?.length &&
        prev.post.comments?.length === next.post.comments?.length &&
        prev.onLike             === next.onLike             &&
        prev.onComment          === next.onComment          &&
        prev.onShare            === next.onShare            &&
        prev.onEdit             === next.onEdit             &&
        prev.onDelete           === next.onDelete           &&
        prev.onReport           === next.onReport
    );
});
