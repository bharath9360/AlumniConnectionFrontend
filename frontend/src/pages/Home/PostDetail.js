import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post,    setPost]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        postService.getPost(id)
            .then(res => {
                setPost(res.data.data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.status === 404 ? 'Post not found.' : 'Failed to load post.');
                setLoading(false);
            });
    }, [id]);

    const handleLike = useCallback(async (postId) => {
        try {
            const res = await postService.likePost(postId);
            setPost(prev => ({ ...prev, ...res.data.data }));
        } catch (_) {}
    }, []);

    const handleComment = useCallback(async (postId, content) => {
        try {
            const res = await postService.addComment(postId, content);
            setPost(prev => ({ ...prev, ...res.data.data }));
        } catch (_) {}
    }, []);

    const handleDeleteComment = useCallback(async (postId, commentId) => {
        try {
            const res = await postService.deleteComment(postId, commentId);
            setPost(prev => ({ ...prev, ...res.data.data }));
        } catch (_) {}
    }, []);

    const handleDelete = useCallback(async (postId) => {
        try {
            await postService.deletePost(postId);
            toast.success('Post deleted.');
            navigate(-1);
        } catch (_) { toast.error('Failed to delete post.'); }
    }, [navigate]);

    const handleEdit = useCallback((p) => {
        // Navigate to profile for edit — handled via FeedItem modal on profile page
        toast('Edit the post from your profile page.', { icon: 'ℹ️' });
    }, []);

    const handleReport = useCallback(async (postId) => {
        try {
            await postService.reportPost(postId);
            toast.success('🚩 Post reported. Our team will review it.');
        } catch (_) { toast.error('Already reported or failed.'); }
    }, []);

    return (
        <div className="container py-4" style={{ maxWidth: 720 }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4 gap-3">
                <button
                    className="btn btn-light rounded-circle shadow-sm"
                    style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => navigate(-1)}
                >
                    <FaArrowLeft color="#c84022" />
                </button>
                <div>
                    <h5 className="fw-bold mb-0 text-dark">Post</h5>
                    <p className="text-muted mb-0 extra-small">Shared post</p>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <ClipLoader color="#c84022" size={40} />
                </div>
            ) : error ? (
                <div className="text-center py-5">
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: '#fff0ed', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                        <i className="far fa-file-alt" style={{ fontSize: 26, color: '#c84022' }} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{error}</h6>
                    <p className="text-muted small">This post may have been deleted or is unavailable.</p>
                    <button
                        className="btn rounded-pill px-4 fw-bold mt-2"
                        style={{ background: '#c84022', color: '#fff', border: 'none' }}
                        onClick={() => navigate('/')}
                    >
                        Back to Feed
                    </button>
                </div>
            ) : post ? (
                <FeedItem
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onDeleteComment={handleDeleteComment}
                    onReport={handleReport}
                    onShare={() => {}}
                />
            ) : null}
        </div>
    );
};

export default PostDetail;
