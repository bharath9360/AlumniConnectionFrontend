import React, { useState, useEffect } from 'react';

import { storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import ProfileCard from '../Alumni/components/ProfileCard';
import FeedItem from '../Alumni/components/FeedItem';
import { NewsWidget, EventsWidget } from '../Alumni/components/SidebarWidgets';
import Toast from '../../components/common/Toast';

const UnifiedDashboard = () => {

    const { user: authUser, userRole } = useAuth();
    const [userData, setUserData] = useState(null);
    const [feedData, setFeedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postText, setPostText] = useState("");
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const initDashboard = () => {
            let user = storage.getCurrentUser();

            if (!user && authUser) {
                user = authUser;
            }

            if (!user) {
                console.warn('No user session found. Loading with dummy guest data.');
                const users = storage.getUsers();
                user = users.find(u => u.id === 'alumni_1') || { name: 'Guest', profilePic: '' };
            }

            setUserData(user);
            setFeedData(storage.getFeed());
            setLoading(false);
        };
        initDashboard();
    }, [authUser]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
    };

    const handleLike = (postId) => {
        const updatedFeed = feedData.map(post => {
            if (post.id === postId) {
                const isLiked = !post.liked;
                return { ...post, liked: isLiked, likes: isLiked ? post.likes + 1 : post.likes - 1 };
            }
            return post;
        });
        setFeedData(updatedFeed);
        storage.saveFeed(updatedFeed);
    };

    const handleComment = (postId, commentText) => {
        const updatedFeed = feedData.map(post => {
            if (post.id === postId) {
                const newComment = {
                    id: Date.now(),
                    userName: userData.name,
                    content: commentText,
                    timestamp: "Just now"
                };
                return { ...post, comments: [...(post.comments || []), newComment] };
            }
            return post;
        });
        setFeedData(updatedFeed);
        storage.saveFeed(updatedFeed);
        showToast("Comment posted!", "success");
    };

    const handleShare = (postId) => {
        showToast("Post link copied to clipboard!", "info");
    };

    const handlePostSubmit = () => {
        if (!postText.trim()) return;
        const newPost = {
            id: Date.now(),
            userId: userData.id,
            userName: userData.name,
            userRole: userData.role,
            userPic: userData.profilePic,
            timestamp: "Just now",
            content: postText,
            likes: 0,
            liked: false,
            shares: 0,
            comments: []
        };
        const updatedFeed = storage.addPost(newPost);
        setFeedData(updatedFeed);
        setPostText("");
        showToast("Post shared successfully!", "success");
    };

    if (loading || !userData) {
        return (
            <div className="dashboard-main-bg py-5 min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-mamcet-red" role="status">
                    <span className="visually-hidden">Loading Dashboard...</span>
                </div>
            </div>
        );
    }

    // --- ALUMNI / STUDENT / ADMIN VIEW ---
    return (
        <div className="dashboard-main-bg py-4 min-vh-100">
            <div className="container">
                <div className="row g-4">

                    {/* LEFT SIDEBAR - Hidden on Mobile */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <ProfileCard user={userData} />
                    </div>

                    {/* CENTER FEED */}
                    <div className="col-lg-6">
                        {/* Start a Post box */}
                        <div className="dashboard-card mb-4 p-3 shadow-sm bg-white rounded-3 border-0">
                            <div className="d-flex align-items-center gap-2 mb-3">
                                <div className="avatar-sm bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                                    {userData.profilePic ? <img src={userData.profilePic} alt="Me" style={{ borderRadius: '50%' }} /> : (userData.name?.[0] || "?")}
                                </div>
                                <button
                                    className="btn btn-light rounded-pill flex-grow-1 text-start px-3 py-2 text-muted fw-bold border"
                                    onClick={() => {/* Open Modal for Posting */ }}
                                    style={{ backgroundColor: '#f3f2ef' }}
                                >
                                    Start a post
                                </button>
                            </div>

                            <div className="d-flex justify-content-between">
                                <button className="btn btn-link text-decoration-none text-muted small hover-bg-light p-2 rounded">
                                    <i className="fas fa-image text-primary me-2"></i>Media
                                </button>
                                <button className="btn btn-link text-decoration-none text-muted small hover-bg-light p-2 rounded">
                                    <i className="fas fa-calendar-alt text-warning me-2"></i>Event
                                </button>
                                <button className="btn btn-link text-decoration-none text-muted small hover-bg-light p-2 rounded">
                                    <i className="fas fa-newspaper text-success me-2"></i>Write article
                                </button>
                            </div>

                            {/* Simple inline post input */}
                            <div className="mt-3 pt-3 border-top">
                                <textarea
                                    className="form-control border-0 bg-light small mb-2"
                                    rows="2"
                                    placeholder="What do you want to talk about?"
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    style={{ resize: 'none' }}
                                ></textarea>
                                <div className="d-flex justify-content-end">
                                    <button
                                        className="btn btn-mamcet-red btn-sm px-4 fw-bold rounded-pill"
                                        onClick={handlePostSubmit}
                                        disabled={!postText.trim()}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Feed items */}
                        <div className="feed-scroll-area">
                            {feedData.length > 0 ? (
                                feedData.map(post => (
                                    <FeedItem
                                        key={post.id}
                                        post={post}
                                        onLike={handleLike}
                                        onComment={handleComment}
                                        onShare={handleShare}
                                    />
                                ))
                            ) : (
                                <div className="text-center p-5 bg-white rounded-3 shadow-sm border-0">
                                    <p className="text-muted">No posts yet. Be the first to share something!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <NewsWidget news={[
                            { title: "MAMCET Annual Meet '26", date: "March 15, 2026" },
                            { title: "New AI Lab Opening", date: "April 02, 2026" }
                        ]} />
                        <EventsWidget events={[
                            { title: "Symposium'25 Highlights" },
                            { title: "Mentorship Program'26" }
                        ]} />
                    </div>

                </div>
            </div>

            {/* TOAST NOTIFICATION */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default UnifiedDashboard;
