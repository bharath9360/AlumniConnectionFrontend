import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/api';
import ProfileCard from './components/ProfileCard';
import FeedItem from './components/FeedItem';
import { NewsWidget, EventsWidget } from './components/SidebarWidgets';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [toast, setToast] = useState(null);
  const [posting, setPosting] = useState(false);

  const showToast = (message, type = 'info') => setToast({ message, type });

  // ── Load feed from API ─────────────────────────────────────
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        const res = await postService.getFeed();
        setFeedData(res.data.data || []);
      } catch (err) {
        showToast('Failed to load feed. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadFeed();
  }, []);

  // ── Like ───────────────────────────────────────────────────
  const handleLike = async (postId) => {
    try {
      const res = await postService.likePost(postId);
      setFeedData(prev => prev.map(p => p._id === postId || p.id === postId ? res.data.data : p));
    } catch (err) {
      showToast('Could not update like.', 'error');
    }
  };

  // ── Comment ────────────────────────────────────────────────
  const handleComment = async (postId, commentText) => {
    try {
      const res = await postService.addComment(postId, commentText);
      setFeedData(prev => prev.map(p => p._id === postId || p.id === postId ? res.data.data : p));
      showToast('Comment posted!', 'success');
    } catch (err) {
      showToast('Could not post comment.', 'error');
    }
  };

  const handleShare = () => showToast('Post link copied to clipboard!', 'info');

  // ── Create Post ────────────────────────────────────────────
  const handlePostSubmit = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const res = await postService.createPost({ content: postText });
      setFeedData(prev => [res.data.data, ...prev]);
      setPostText('');
      showToast('Post shared successfully!', 'success');
    } catch (err) {
      showToast('Failed to create post.', 'error');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-main-bg py-5 min-vh-100 d-flex align-items-center justify-content-center">
        <ClipLoader color="#c84022" size={45} />
      </div>
    );
  }

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">
        <div className="row g-4">

          {/* LEFT SIDEBAR */}
          <div className="col-lg-3 d-none d-lg-block">
            <ProfileCard user={user} />
          </div>

          {/* CENTER FEED */}
          <div className="col-lg-6">
            <div className="dashboard-card mb-4 p-3 shadow-sm bg-white rounded-3 border-0">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="avatar-sm bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                  {user?.profilePic ? <img src={user.profilePic} alt="Me" style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name?.[0] || '?')}
                </div>
                <button className="btn btn-light rounded-pill flex-grow-1 text-start px-3 py-2 text-muted fw-bold border" style={{ backgroundColor: '#f3f2ef' }}>
                  Start a post
                </button>
              </div>

              <div className="d-flex justify-content-between">
                <button className="btn btn-link text-decoration-none text-muted small p-2 rounded" onClick={() => navigate('/jobs')}>
                  <i className="fas fa-briefcase text-primary me-2"></i>Jobs
                </button>
                <button className="btn btn-link text-decoration-none text-muted small p-2 rounded" onClick={() => navigate('/events')}>
                  <i className="fas fa-calendar-alt text-warning me-2"></i>Event
                </button>
                <button className="btn btn-link text-decoration-none text-muted small p-2 rounded" onClick={() => navigate('/messaging')}>
                  <i className="fas fa-envelope text-success me-2"></i>Messages
                </button>
              </div>

              <div className="mt-3 pt-3 border-top">
                <textarea
                  className="form-control border-0 bg-light small mb-2"
                  rows="2" placeholder="What do you want to talk about?"
                  value={postText} onChange={(e) => setPostText(e.target.value)}
                  style={{ resize: 'none' }}
                />
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-mamcet-red btn-sm px-4 fw-bold rounded-pill d-flex align-items-center gap-2"
                    onClick={handlePostSubmit}
                    disabled={!postText.trim() || posting}
                  >
                    {posting ? <ClipLoader size={14} color="#fff" /> : null} Post
                  </button>
                </div>
              </div>
            </div>

            {/* Feed */}
            <div className="feed-scroll-area">
              {feedData.length > 0 ? (
                feedData.map(post => (
                  <FeedItem
                    key={post._id || post.id}
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
              { title: "MAMCET Annual Meet '26", date: 'March 15, 2026' },
              { title: 'New AI Lab Opening', date: 'April 02, 2026' }
            ]} />
            <EventsWidget events={[
              { title: "Symposium'25 Highlights" },
              { title: "Mentorship Program'26" }
            ]} />
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AlumniDashboard;