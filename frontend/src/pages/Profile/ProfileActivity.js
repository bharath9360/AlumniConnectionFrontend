import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postService, authService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import { ClipLoader } from 'react-spinners';
import { FaArrowLeft, FaThumbsUp, FaCommentAlt } from 'react-icons/fa';

const ProfileActivity = () => {
    const { id } = useParams();
    const [likedPosts, setLikedPosts] = useState([]);
    const [commentedPosts, setCommentedPosts] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('likes');
    
    const [likedHasMore, setLikedHasMore] = useState(true);
    const [commentedHasMore, setCommentedHasMore] = useState(true);
    
    const [profile, setProfile] = useState(null);

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
            const res = await postService.getUserActivity(id); // no limit
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

    const handleDeletePost = async (postId) => {
        try {
            await postService.deletePost(postId);
            const filterFn = p => !((p._id === postId) || (p.id === postId));
            setLikedPosts(prev => prev.filter(filterFn));
            setCommentedPosts(prev => prev.filter(filterFn));
        } catch (err) {}
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const res = await postService.deleteComment(postId, commentId);
            const mapFn = p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p;
            setLikedPosts(prev => prev.map(mapFn));
            setCommentedPosts(prev => prev.map(mapFn));
        } catch (err) {}
    };

    const currentList = tab === 'likes' ? likedPosts : commentedPosts;
    const currentHasMore = tab === 'likes' ? likedHasMore : commentedHasMore;

    return (
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
                    {currentList.map(post => (
                        <FeedItem
                            key={post._id || post.id}
                            post={post}
                            onDelete={handleDeletePost}
                            onDeleteComment={handleDeleteComment}
                            onLike={async (postId) => {
                                try {
                                    const res = await postService.likePost(postId);
                                    const mapFn = p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p;
                                    setLikedPosts(prev => prev.map(mapFn));
                                    setCommentedPosts(prev => prev.map(mapFn));
                                } catch (_) {}
                            }}
                            onComment={async (postId, content) => {
                                try {
                                    const res = await postService.addComment(postId, content);
                                    const mapFn = p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p;
                                    setLikedPosts(prev => prev.map(mapFn));
                                    setCommentedPosts(prev => prev.map(mapFn));
                                } catch (_) {}
                            }}
                            onShare={() => {}}
                        />
                    ))}

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
    );
};

export default ProfileActivity;
