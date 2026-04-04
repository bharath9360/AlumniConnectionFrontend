import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FaEllipsisH, FaPencilAlt, FaTimes, FaTrashAlt } from 'react-icons/fa';

// Unified media URL resolver — handles absolute URLs, relative paths, and missing env vars.
// Also injects f_auto,q_auto CDN params for Cloudinary URLs so the CDN serves
// the optimal format (WebP/AVIF) even for URLs already stored in the database.
const resolveMediaUrl = (url) => {
    if (!url || !url.trim()) return null;
    // Cloudinary URLs: inject CDN optimisation params if not already present
    if (url.startsWith('https://res.cloudinary.com') || url.startsWith('http://res.cloudinary.com')) {
        if (!url.includes('f_auto') && !url.includes('q_auto')) {
            return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        }
        return url;
    }
    // Already absolute non-Cloudinary — use directly
    if (url.startsWith('https://') || url.startsWith('http://')) return url;
    // Fallback for any legacy relative paths still in DB
    const base = process.env.REACT_APP_BACKEND_URL ||
                 (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') ||
                 'http://localhost:5000';
    return `${base}${url}`;
};

const FeedItem = ({ post, onLike, onComment, onShare, onEdit, onDelete, onDeleteComment }) => {
    const { user } = useAuth();
    const loggedInUserId = user?._id || user?.id;

    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    const handleCommentSubmit = (e) => {
        if (e.key === 'Enter' && commentText.trim()) {
            onComment(post._id || post.id, commentText);
            setCommentText('');
        }
    };

    // ── Author data: prefer live-populated fields, fall back to stored values ──
    const authorId   = post.authorId  || post.userId;
    const authorName = post.userName  || 'Anonymous';
    const authorRole = post.userRole  || '';
    const authorPic  = post.userPic   || '';
    const resolvedAuthorPic = resolveMediaUrl(authorPic);

    // ── Build image URL (handles absolute URLs and relative /uploads/... paths) ──
    const rawMedia = post.media || post.imageURL || post.image;
    const mediaUrl = resolveMediaUrl(rawMedia);

    // ── Timestamp ──
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)  return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const isAuthor = !!(loggedInUserId && authorId && String(loggedInUserId) === String(authorId));

    return (
        <div className="dashboard-card mb-3 shadow-sm bg-white rounded-3 border-0 position-relative">
            {/* ── Context Menu (Edit / Delete) ── */}
            {isAuthor && (onEdit || onDelete) && (
                <div className="position-absolute" style={{ top: 12, right: 12, zIndex: 10 }}>
                    <div className="dropdown">
                        <button
                            className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                            data-bs-toggle="dropdown"
                            style={{ width: 30, height: 30, padding: 0 }}
                        >
                            <FaEllipsisH size={12} color="#555" />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" style={{ fontSize: 13 }}>
                            {onEdit && (
                                <li>
                                    <button className="dropdown-item d-flex align-items-center gap-2" onClick={() => onEdit(post)}>
                                        <FaPencilAlt size={11} color="#c84022" /> Edit Post
                                    </button>
                                </li>
                            )}
                            {onDelete && (
                                <li>
                                    <button className="dropdown-item text-danger d-flex align-items-center gap-2" onClick={async () => {
                                        if (window.confirm('Delete this post?')) onDelete(post._id || post.id);
                                    }}>
                                        <FaTimes size={11} /> Delete Post
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            <div className="p-3">
                {/* ── Post Header ── */}
                <div className="d-flex align-items-center mb-3 pr-4" style={{ paddingRight: '40px' }}>
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

                {/* ── Post Stats ── */}
                <div className="d-flex justify-content-between extra-small text-muted border-bottom pb-2 mb-2">
                    <span><i className="fas fa-thumbs-up text-mamcet-red me-1"></i>{post.likes || 0}</span>
                    <span>{post.comments?.length || 0} comments &bull; {post.shares || 0} shares</span>
                </div>

                {/* ── Post Actions ── */}
                <div className="d-flex border-top border-bottom py-1 post-actions-pro">
                    <button
                        className={`btn btn-pro btn-pro-ghost flex-grow-1 gap-2 ${post.liked ? 'text-mamcet-red' : ''}`}
                        onClick={() => onLike(post._id || post.id)}
                    >
                        <i className={`${post.liked ? 'fas' : 'far'} fa-thumbs-up`}></i>
                        <span>Like</span>
                    </button>
                    <button className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2" onClick={() => setShowComments(!showComments)}>
                        <i className="far fa-comment-alt"></i>
                        <span>Comment</span>
                    </button>
                    <button className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2" onClick={() => onShare(post._id || post.id)}>
                        <i className="far fa-share-square"></i>
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
                            ?
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
                            const commentOwnerId = typeof comment.userId === 'object' ? (comment.userId?._id || comment.userId) : comment.userId;
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
                                                            if (window.confirm('Delete comment?')) onDeleteComment(post._id || post.id, comment._id);
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
        </div>
    );
};

// Part 6: React.memo — prevents re-renders when sibling posts
// change (critical for long infinite-scroll feeds).
// Custom equality: only re-render if the post data changes or
// callbacks are swapped (shallow-stable on parent re-mounts).
export default React.memo(FeedItem, (prev, next) => {
    return (
        prev.post._id        === next.post._id        &&
        prev.post.likes      === next.post.likes      &&
        prev.post.liked      === next.post.liked      &&
        prev.post.comments?.length === next.post.comments?.length &&
        prev.onLike          === next.onLike          &&
        prev.onComment       === next.onComment       &&
        prev.onShare         === next.onShare         &&
        prev.onEdit          === next.onEdit          &&
        prev.onDelete        === next.onDelete
    );
});
