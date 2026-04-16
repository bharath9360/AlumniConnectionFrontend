import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService, authService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProfilePosts = () => {
    const { id } = useParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true); // From limit=5
    const [profile, setProfile] = useState(null);
    const [editingPost,     setEditingPost]     = useState(null);
    const [editPostContent, setEditPostContent] = useState('');
    const [editPostSaving,  setEditPostSaving]  = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        // Fetch profile basic info for header
        authService.getUserById(id).then(res => setProfile(res.data.data)).catch(() => {});
        
        // Fetch first 5 posts
        postService.getUserPosts(id, 5)
            .then(res => {
                setPosts(res.data.data || []);
                setHasMore(res.data.hasMore);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const handleLoadMore = async () => {
        setLoading(true);
        try {
            const res = await postService.getUserPosts(id); // no limit == all posts
            setPosts(res.data.data || []);
            setHasMore(false);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId);
            setPosts(prev => prev.filter(p => !((p._id === postId) || (p.id === postId))));
            toast.success('Post deleted.');
        } catch (err) {
            toast.error('Failed to delete post.');
        }
    };

    const handleEditPost = async () => {
        if (!editingPost || !editPostContent.trim()) return;
        setEditPostSaving(true);
        try {
            const res = await postService.editPost(editingPost._id || editingPost.id, editPostContent);
            const updated = res.data.data;
            setPosts(prev => prev.map(p =>
                (p._id === editingPost._id || p.id === editingPost.id) ? { ...p, ...updated } : p
            ));
            setEditingPost(null);
            setEditPostContent('');
            toast.success('Post updated! ✓');
        } catch {
            toast.error('Failed to update post.');
        } finally {
            setEditPostSaving(false);
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await postService.deleteComment(postId, commentId);
            setPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
        } catch (err) {
            alert('Failed to delete comment.');
        }
    };

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
                        {profile ? `${profile.name}'s Posts` : 'Posts'}
                    </h4>
                    <p className="text-muted mb-0 extra-small">View all posts created by this user</p>
                </div>
            </div>

            {loading && posts.length === 0 ? (
                <div className="d-flex justify-content-center py-5">
                    <ClipLoader color="#c84022" size={40} />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-5 text-muted bg-white rounded-3 shadow-sm">
                    No posts found.
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {posts.map(post => (
                        <FeedItem
                            key={post._id || post.id}
                            post={post}
                            onEdit={(p) => { setEditingPost(p); setEditPostContent(p.content || ''); }}
                            onDelete={handleDeletePost}
                            onDeleteComment={handleDeleteComment}
                            onLike={async (postId) => {
                                try {
                                    const res = await postService.likePost(postId);
                                    setPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
                                } catch (_) {}
                            }}
                            onComment={async (postId, content) => {
                                try {
                                    const res = await postService.addComment(postId, content);
                                    setPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
                                } catch (_) {}
                            }}
                            onShare={() => {}}
                        />
                    ))}

                    {hasMore && (
                        <button 
                            className="btn btn-outline-secondary w-100 rounded-pill py-2 my-2 fw-bold"
                            onClick={handleLoadMore}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={14} /> : 'Load More Posts'}
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
                onClick={(e) => { if (e.target === e.currentTarget) { setEditingPost(null); setEditPostContent(''); } }}
            >
                <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: '100%', maxWidth: 520, margin: '0 16px' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold mb-0">Edit Post</h6>
                        <button className="btn btn-link p-0 text-muted" onClick={() => { setEditingPost(null); setEditPostContent(''); }}>
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
                        <button
                            className="btn btn-light rounded-pill px-4"
                            onClick={() => { setEditingPost(null); setEditPostContent(''); }}
                        >
                            Cancel
                        </button>
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

export default ProfilePosts;
