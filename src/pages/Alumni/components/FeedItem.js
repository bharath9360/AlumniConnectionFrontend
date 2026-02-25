import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const FeedItem = ({ post, onLike, onComment, onShare }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const handleCommentSubmit = (e) => {
        if (e.key === 'Enter' && commentText.trim()) {
            onComment(post.id, commentText);
            setCommentText("");
        }
    };

    return (
        <div className="dashboard-card mb-3 shadow-sm bg-white rounded-3 border-0">
            <div className="p-3">
                {/* Post Header */}
                <div className="d-flex align-items-center mb-3">
                    <Link to={`/alumni/profile/${post.userId}`} className="text-decoration-none d-flex align-items-center">
                        <div className="avatar-sm me-2 bg-secondary text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
                            {post.userPic ? <img src={post.userPic} alt={post.userName || post.user} style={{ borderRadius: '50%' }} /> : (post.userName?.[0] || post.user?.[0] || "?")}
                        </div>
                        <div>
                            <h6 className="fw-bold mb-0 text-dark small">{post.userName || post.user || "Anonymous"}</h6>
                            <p className="extra-small text-muted mb-0">{post.userRole}</p>
                            <p className="extra-small text-muted mb-0">{post.timestamp}</p>
                        </div>
                    </Link>
                </div>

                {/* Post Content */}
                <p className="small text-dark mb-3">{post.content}</p>

                {post.media && (
                    <div className="post-media mb-3">
                        <img src={post.media} alt="Post Attachment" className="w-100 rounded border" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                    </div>
                )}

                {/* Post Stats */}
                <div className="d-flex justify-content-between extra-small text-muted border-bottom pb-2 mb-2">
                    <span><i className="fas fa-thumbs-up text-mamcet-red me-1"></i>{post.likes}</span>
                    <span>{post.comments?.length || 0} comments &bull; {post.shares || 0} shares</span>
                </div>

                {/* Post Actions */}
                <div className="d-flex border-top border-bottom py-1 post-actions-pro">
                    <button className={`btn btn-pro btn-pro-ghost flex-grow-1 gap-2 ${post.liked ? 'text-mamcet-red' : ''}`} onClick={() => onLike(post.id)}>
                        <i className={`${post.liked ? 'fas' : 'far'} fa-thumbs-up`}></i>
                        <span>Like</span>
                    </button>
                    <button className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2" onClick={() => setShowComments(!showComments)}>
                        <i className="far fa-comment-alt"></i>
                        <span>Comment</span>
                    </button>
                    <button className="btn btn-pro btn-pro-ghost flex-grow-1 gap-2" onClick={() => onShare(post.id)}>
                        <i className="far fa-share-square"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* Nested Comments Section */}
            {showComments && (
                <div className="p-3 bg-light rounded-bottom-3 border-top">
                    <div className="d-flex gap-2 mb-3">
                        <div className="avatar-xs bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', minWidth: '32px' }}>M</div>
                        <input
                            type="text"
                            className="form-control form-control-sm rounded-pill"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={handleCommentSubmit}
                        />
                    </div>

                    <div className="comments-list">
                        {post.comments?.map((comment) => (
                            <div key={comment.id} className="d-flex gap-2 mb-2">
                                <div className="avatar-xs bg-light border text-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', minWidth: '32px' }}>{comment.userName?.[0] || comment.user?.[0] || "?"}</div>
                                <div className="bg-white p-2 px-3 rounded-3 shadow-sm flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <h6 className="extra-small fw-bold mb-0">{comment.userName || comment.user || "Anonymous"}</h6>
                                        <span className="extra-small text-muted">{comment.timestamp}</span>
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
