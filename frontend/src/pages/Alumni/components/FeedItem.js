import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Resolve the base backend URL from any env var that might be set
const BACKEND_URL = (() => {
    const api = process.env.REACT_APP_API_URL;
    if (api) return api.replace(/\/api\/?$/, '');
    if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
    return 'http://localhost:5000';
})();

const FeedItem = ({ post, onLike, onComment, onShare }) => {
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

    // ── Build image URL (handles absolute URLs and relative /uploads/... paths) ──
    const rawMedia = post.media || post.imageURL || post.image;
    const mediaUrl = rawMedia && rawMedia.trim()
        ? rawMedia.startsWith('http') ? rawMedia : `${BACKEND_URL}${rawMedia}`
        : null;

    // ── Timestamp ──
    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)  return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="dashboard-card mb-3 shadow-sm bg-white rounded-3 border-0">
            <div className="p-3">
                {/* ── Post Header ── */}
                <div className="d-flex align-items-center mb-3">
                    <Link to={`/profile/${authorId}`} className="text-decoration-none d-flex align-items-center">
                        <div
                            className="me-2 bg-secondary text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden' }}
                        >
                            {authorPic ? (
                                <img
                                    src={authorPic}
                                    alt={authorName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        {post.comments?.map((comment, idx) => (
                            <div key={comment._id || comment.id || idx} className="d-flex gap-2 mb-2">
                                <div
                                    className="bg-light border text-dark rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{ width: '32px', height: '32px', fontSize: '13px' }}
                                >
                                    {comment.userPic ? (
                                        <img src={comment.userPic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        comment.userName?.[0]?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="bg-white p-2 px-3 rounded-3 shadow-sm flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="extra-small fw-bold mb-0">{comment.userName || 'Anonymous'}</h6>
                                        <span className="extra-small text-muted">{timeAgo(comment.createdAt)}</span>
                                    </div>
                                    <p className="extra-small mb-0 text-dark">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedItem;
