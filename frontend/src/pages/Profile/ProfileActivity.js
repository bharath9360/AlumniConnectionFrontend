import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService, authService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaThumbsUp, FaCommentAlt, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProfileActivity = () => {
    const { id } = useParams();
    const [likedPosts,     setLikedPosts]     = useState([]);
    const [commentedPosts, setCommentedPosts] = useState([]);
    const [loading,        setLoading]        = useState(true);
    const [tab,            setTab]            = useState('likes');
    const [likedHasMore,     setLikedHasMore]     = useState(true);
    const [commentedHasMore, setCommentedHasMore] = useState(true);
    const [profile,        setProfile]        = useState(null);

    // ── Edit post state ──────────────────────────────────────────
    const [editingPost,     setEditingPost]     = useState(null);
    const [editPostContent, setEditPostContent] = useState('');
    const [editPostSaving,  setEditPostSaving]  = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        authService.getUserById(id).then(res => setProfile(res.data.data)).catch(() => {});

        postService.getUserActivity(id, 5)
            .then(res => {
                setLikedPosts(res.data.likedPosts || []);
                setLikedHasMore(res.data.likedHasMore);
                setCommentedPosts(res.data.commentedPosts || []);
                setCommentedHasMore(res.data.commentedHasMore);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleLoadMore = async () => {
        setLoading(true);
        try {
            const res = await postService.getUserActivity(id);
            if (tab === 'likes') {
                setLikedPosts(res.data.likedPosts || []);
                setLikedHasMore(false);
            } else {
                setCommentedPosts(res.data.commentedPosts || []);
                setCommentedHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Delete post ──────────────────────────────────────────────
    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId);
            const filterFn = p => !((p._id === postId) || (p.id === postId));
            setLikedPosts(prev => prev.filter(filterFn));
            setCommentedPosts(prev => prev.filter(filterFn));
            toast.success('Post deleted.');
        } catch (err) {
            toast.error('Failed to delete post.');
        }
    };

    // ── Delete comment ───────────────────────────────────────────
    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await postService.deleteComment(postId, commentId);
            const mapFn = p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p;
            setLikedPosts(prev => prev.map(mapFn));
            setCommentedPosts(prev => prev.map(mapFn));
        } catch (err) {}
    };

    // ── Edit post ────────────────────────────────────────────────
    const handleEditPost = async () => {
        if (!editingPost || !editPostContent.trim()) return;
        setEditPostSaving(true);
        try {
            const res = await postService.editPost(editingPost._id || editingPost.id, editPostContent);
            const updated = res.data.data;
            const patchFn = prev => prev.map(p =>
                (p._id === editingPost._id || p.id === editingPost.id) ? { ...p, ...updated } : p
            );
            setLikedPosts(patchFn);
            setCommentedPosts(patchFn);
            setEditingPost(null);
            setEditPostContent('');
            toast.success('Post updated! ✓');
        } catch {
            toast.error('Failed to update post.');
        } finally {
            setEditPostSaving(false);
        }
    };

    const openEdit = (p) => { setEditingPost(p); setEditPostContent(p.content || ''); };
    const closeEdit = () => { setEditingPost(null); setEditPostContent(''); };

    const currentList    = tab === 'likes' ? likedPosts : commentedPosts;
    const currentHasMore = tab === 'likes' ? likedHasMore : commentedHasMore;

    // ── Shared FeedItem props factory ────────────────────────────
    const makeFeedProps = (setList) => ({
        onEdit: openEdit,
        onDelete: handleDeletePost,
        onDeleteComment: handleDeleteComment,
        onLike: async (postId) => {
            try {
                const res = await postService.likePost(postId);
                setList(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
            } catch (_) {}
        },
        onComment: async (postId, content) => {
            try {
                const res = await postService.addComment(postId, content);
                setList(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
            } catch (_) {}
        },
        onShare: () => {},
    });

    const likedFeedProps     = makeFeedProps(setLikedPosts);
    const commentedFeedProps = makeFeedProps(setCommentedPosts);

    return (
        <>
        <div className="container py-4" style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4 gap-3">
                <Link to={`/profile/${id}`} className="btn btn-light rounded-circle shadow-sm" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaArrowLeft color="#c84022" />
                </Link>
                <div>
                    <h4 className="fw-bold mb-0 text-dark">
                        {profile ? `${profile.name}'s Activity` : 'Activity'}
                    </h4>
                    <p className="text-muted mb-0 extra-small">View likes and comments history</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="d-flex gap-2 mb-4">
                <button
                    className="btn rounded-pill fw-semibold d-flex align-items-center"
                    style={{
                        padding: '8px 20px',
                        backgroundColor: tab === 'likes' ? '#c84022' : '#fff',
                        color: tab === 'likes' ? '#fff' : '#555',
                        border: tab === 'likes' ? 'none' : '1px solid #ddd',
                        boxShadow: tab === 'likes' ? '0 4px 10px rgba(200,64,34,0.2)' : 'none'
                    }}
                    onClick={() => setTab('likes')}
                >
                    <FaThumbsUp className="me-2" /> Likes
                </button>
                <button
                    className="btn rounded-pill fw-semibold d-flex align-items-center"
                    style={{
                        padding: '8px 20px',
                        backgroundColor: tab === 'comments' ? '#c84022' : '#fff',
                        color: tab === 'comments' ? '#fff' : '#555',
                        border: tab === 'comments' ? 'none' : '1px solid #ddd',
                        boxShadow: tab === 'comments' ? '0 4px 10px rgba(200,64,34,0.2)' : 'none'
                    }}
                    onClick={() => setTab('comments')}
                >
                    <FaCommentAlt className="me-2" /> Comments
                </button>
            </div>

            {loading && currentList.length === 0 ? (
                <div className="d-flex justify-content-center py-5">
                    <ClipLoader color="#c84022" size={40} />
                </div>
            ) : currentList.length === 0 ? (
                <div className="text-center py-5 text-muted bg-white rounded-3 shadow-sm">
                    No {tab} found.
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {tab === 'likes'
                        ? likedPosts.map(post => (
                            <FeedItem
                                key={post._id || post.id}
                                post={post}
                                {...likedFeedProps}
                            />
                        ))
                        : commentedPosts.map(post => (
                            <FeedItem
                                key={post._id || post.id}
                                post={post}
                                {...commentedFeedProps}
                            />
                        ))
                    }

                    {currentHasMore && (
                        <button
                            className="btn btn-outline-secondary w-100 rounded-pill py-2 my-2 fw-bold"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={14} /> : 'Load More'}
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* ── Edit Post Modal ── */}
        {editingPost && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1055 }}
                onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
            >
                <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: '100%', maxWidth: 520, margin: '0 16px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Edit Post</h6>
                        <button className="btn btn-link p-0 text-muted" onClick={closeEdit}>
                            <FaTimes />
                        </button>
                    </div>
                    <textarea
                        className="form-control mb-2"
                        rows={5}
                        value={editPostContent}
                        onChange={e => setEditPostContent(e.target.value)}
                        placeholder="What do you want to share?"
                        style={{ resize: 'vertical', fontSize: 14 }}
                        autoFocus
                    />
                    <p className="extra-small text-muted mb-3">Note: Attached images cannot be changed.</p>
                    <div className="d-flex justify-content-end gap-2">
                        <button className="btn btn-light rounded-pill px-4" onClick={closeEdit}>Cancel</button>
                        <button
                            className="btn rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                            style={{ background: '#c84022', border: 'none', color: '#fff' }}
                            disabled={editPostSaving || !editPostContent.trim()}
                            onClick={handleEditPost}
                        >
                            {editPostSaving && <ClipLoader size={13} color="#fff" />} Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default ProfileActivity;
