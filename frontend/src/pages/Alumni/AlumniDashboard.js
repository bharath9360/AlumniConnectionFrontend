import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/api';
import ProfileCard from './components/ProfileCard';
import FeedItem from './components/FeedItem';
import { NewsWidget, EventsWidget, AdminStatsWidget } from './components/SidebarWidgets';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRegImage, FaSmile, FaTimes, FaVideo, FaNewspaper } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';


// ──────────────────────────────────────────────────────────────
//  CREATE POST BOX  (LinkedIn-style)
// ──────────────────────────────────────────────────────────────
const CreatePostBox = ({ user, onPostCreated, showToast }) => {
  const [expanded, setExpanded]       = useState(false);
  const [postText, setPostText]       = useState('');
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [posting, setPosting]         = useState(false);

  const fileInputRef  = useRef(null);
  const emojiRef      = useRef(null);
  const textareaRef   = useRef(null);

  /* Close emoji picker on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Pick, compress & preview image */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }
    try {
      showToast('Compressing image…', 'info');
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressed = await imageCompression(file, options);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
      setExpanded(true);
    } catch (err) {
      // If compression fails, fall back to original file
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setExpanded(true);
    }
  };


  /* Insert emoji into textarea caret position */
  const handleEmojiClick = useCallback((emojiData) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setPostText(prev => prev + emojiData.emoji);
      return;
    }
    const start  = textarea.selectionStart;
    const end    = textarea.selectionEnd;
    const before = postText.slice(0, start);
    const after  = postText.slice(end);
    const newText = before + emojiData.emoji + after;
    setPostText(newText);
    // Restore cursor after emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 10);
    setShowEmoji(false);
  }, [postText]);

  /* Remove selected image */
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* Submit post */
  const handleSubmit = async () => {
    if (!postText.trim() && !imageFile) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('content', postText);
      if (imageFile) formData.append('image', imageFile, imageFile.name || 'image.jpg');

      const res = await postService.createPost(formData);

      // ── FIX: Use the backend's fully-populated response directly.
      // The backend already populates userId (name, profilePic, designation)
      // and returns the correct `media` URL from Multer — do NOT overwrite
      // these fields with stale AuthContext values or the image will be lost.
      const newPost = res.data.data;

      onPostCreated(newPost);
      setPostText('');
      removeImage();
      setExpanded(false);
      showToast('Post shared successfully! 🎉', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create post.', 'error');
    } finally {
      setPosting(false);
    }
  };

  const canPost = (postText.trim().length > 0 || imageFile) && !posting;

  return (
    <motion.div
      className="dashboard-card bg-white shadow-sm rounded-4 border-0 mb-4 overflow-hidden"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── TOP ROW: Avatar + trigger button ── */}
      <div className="d-flex align-items-center gap-3 p-3 pb-2">
        <div
          className="rounded-circle overflow-hidden border flex-shrink-0"
          style={{ width: 48, height: 48, backgroundColor: '#eee' }}
        >
          {user?.profilePic
            ? <img src={user.profilePic} alt="me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-secondary" style={{ fontSize: 18 }}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
          }
        </div>

        <button
          className="btn border rounded-pill flex-grow-1 text-start text-muted fw-semibold px-4 py-2"
          style={{ backgroundColor: '#f3f2ef', fontSize: 14 }}
          onClick={() => setExpanded(true)}
        >
          What's on your mind, {user?.name?.split(' ')[0] || 'you'}?
        </button>
      </div>

      {/* ── EXPANDED EDITOR ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 pb-0"
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="form-control border-0 bg-transparent p-0 mt-1"
              rows={4}
              placeholder={`Share something with your network, ${user?.name?.split(' ')[0] || 'alumnus'}...`}
              value={postText}
              onChange={e => setPostText(e.target.value)}
              style={{ resize: 'none', fontSize: 15, outline: 'none', boxShadow: 'none' }}
              autoFocus
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="position-relative mt-3 rounded-3 overflow-hidden border" style={{ maxHeight: 320 }}>
                <img src={imagePreview} alt="Preview" className="w-100 object-fit-cover" style={{ maxHeight: 320 }} />
                <button
                  onClick={removeImage}
                  className="position-absolute top-0 end-0 m-2 border-0 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 30, height: 30, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer' }}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}

            {/* Character count */}
            {postText.length > 0 && (
              <div className="text-end mt-1">
                <span className="extra-small text-muted">{postText.length} / 1000</span>
              </div>
            )}

            {/* Emoji Picker  */}
            <div className="position-relative" ref={emojiRef}>
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="position-absolute bottom-100 start-0 mb-2 z-3"
                    style={{ zIndex: 1000 }}
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      skinTonesDisabled
                      height={380}
                      width={320}
                      searchDisabled={false}
                      previewConfig={{ showPreview: false }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Action toolbar ── */}
            <div className="d-flex align-items-center justify-content-between border-top mt-2 pt-2 pb-2">
              <div className="d-flex gap-1">
                {/* Image upload */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="d-none"
                />
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#f3f2ef' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm rounded-3 d-flex align-items-center gap-2 text-muted fw-semibold px-3 py-2"
                  style={{ fontSize: 13, border: 'none' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Add Image"
                >
                  <FaRegImage size={18} style={{ color: '#378fe9' }} />
                  <span className="d-none d-sm-inline">Photo</span>
                </motion.button>

                {/* Emoji picker */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#f3f2ef' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm rounded-3 d-flex align-items-center gap-2 text-muted fw-semibold px-3 py-2"
                  style={{ fontSize: 13, border: 'none' }}
                  onClick={() => setShowEmoji(s => !s)}
                  title="Add Emoji"
                >
                  <FaSmile size={18} style={{ color: '#f5c518' }} />
                  <span className="d-none d-sm-inline">Emoji</span>
                </motion.button>

                {/* Video placeholder */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#f3f2ef' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm rounded-3 d-flex align-items-center gap-2 text-muted fw-semibold px-3 py-2"
                  style={{ fontSize: 13, border: 'none' }}
                  title="Add Video (Coming Soon)"
                  onClick={() => showToast('Video uploads coming soon!', 'info')}
                >
                  <FaVideo size={18} style={{ color: '#5f9b41' }} />
                  <span className="d-none d-sm-inline">Video</span>
                </motion.button>

                {/* Article placeholder */}
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: '#f3f2ef' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-sm rounded-3 d-flex align-items-center gap-2 text-muted fw-semibold px-3 py-2"
                  style={{ fontSize: 13, border: 'none' }}
                  title="Write Article (Coming Soon)"
                  onClick={() => showToast('Article writing coming soon!', 'info')}
                >
                  <FaNewspaper size={18} style={{ color: '#c84022' }} />
                  <span className="d-none d-sm-inline">Article</span>
                </motion.button>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm text-muted fw-semibold px-3"
                  style={{ border: 'none', fontSize: 13 }}
                  onClick={() => { setExpanded(false); setPostText(''); removeImage(); setShowEmoji(false); }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={canPost ? { scale: 1.04 } : {}}
                  whileTap={canPost ? { scale: 0.96 } : {}}
                  className="btn btn-mamcet-red btn-sm px-4 fw-bold rounded-pill d-flex align-items-center gap-2"
                  onClick={handleSubmit}
                  disabled={!canPost}
                  style={{ fontSize: 13, opacity: canPost ? 1 : 0.5 }}
                >
                  {posting ? <ClipLoader size={13} color="#fff" /> : null}
                  Post
                </motion.button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COLLAPSED quick-action row (shown when not expanded) ── */}
      {!expanded && (
        <div className="d-flex justify-content-around border-top px-2 py-1">
          <button
            className="btn btn-sm text-muted d-flex align-items-center gap-2 fw-semibold py-2"
            style={{ fontSize: 13, border: 'none' }}
            onClick={() => { setExpanded(true); setTimeout(() => fileInputRef.current?.click(), 100); }}
          >
            <FaRegImage size={18} style={{ color: '#378fe9' }} />
            <span className="d-none d-sm-inline">Photo</span>
          </button>
          <button
            className="btn btn-sm text-muted d-flex align-items-center gap-2 fw-semibold py-2"
            style={{ fontSize: 13, border: 'none' }}
            onClick={() => setExpanded(true)}
          >
            <FaVideo size={18} style={{ color: '#5f9b41' }} />
            <span className="d-none d-sm-inline">Video</span>
          </button>
          <button
            className="btn btn-sm text-muted d-flex align-items-center gap-2 fw-semibold py-2"
            style={{ fontSize: 13, border: 'none' }}
            onClick={() => setExpanded(true)}
          >
            <FaNewspaper size={18} style={{ color: '#c84022' }} />
            <span className="d-none d-sm-inline">Write Article</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ──────────────────────────────────────────────────────────────
//  ALUMNI DASHBOARD  (Parent)
// ──────────────────────────────────────────────────────────────
const AlumniDashboard = () => {
  const { user } = useAuth();

  const [feedData,    setFeedData]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [toast,       setToast]       = useState(null);

  // IntersectionObserver sentinel — fires when user scrolls near bottom
  const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

  const showToast = (message, type = 'info') => setToast({ message, type });

  /* Load feed — page 1 on mount, with sessionStorage instant-paint cache */
  useEffect(() => {
    const loadFeed = async () => {
      const cacheKey = `alumni_feed_${user?._id || 'guest'}`;
      try {
        // ── Try sessionStorage cache first for instant paint ——
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try {
            const { data, pagination } = JSON.parse(cached);
            setFeedData(data);
            setHasMore(pagination?.hasMore ?? false);
            setLoading(false);
            // Background revalidation: silently refresh without blocking UI
            const fresh = await postService.getFeed(1, 20);
            const freshData = fresh.data.data || [];
            setFeedData(freshData);
            setHasMore(fresh.data.pagination?.hasMore ?? false);
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: freshData, pagination: fresh.data.pagination }));
            return;
          } catch (_) {
            // Corrupt cache — fall through to fresh fetch
            sessionStorage.removeItem(cacheKey);
          }
        }

        // ── Cold fetch (no cache yet) ——
        setLoading(true);
        const res = await postService.getFeed(1, 20);
        const freshData = res.data.data || [];
        setFeedData(freshData);
        setHasMore(res.data.pagination?.hasMore ?? false);
        setPage(1);
        // Persist first page to session cache
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: freshData, pagination: res.data.pagination }));
        } catch (_) { /* sessionStorage quota exceeded — no-op */ }
      } catch {
        showToast('Failed to load feed. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Callbacks */
  const handlePostCreated = (newPost) => {
    setFeedData(prev => [newPost, ...prev]);
    // Bust session cache so next navigation re-fetches fresh data
    try { sessionStorage.removeItem(`alumni_feed_${user?._id || 'guest'}`); } catch (_) {}
  };

  const handleLike = async (postId) => {
    try {
      const res = await postService.likePost(postId);
      setFeedData(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data.data : p));
    } catch {
      showToast('Could not update like.', 'error');
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      const res = await postService.addComment(postId, commentText);
      setFeedData(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data.data : p));
      showToast('Comment posted!', 'success');
    } catch {
      showToast('Could not post comment.', 'error');
    }
  };

  const handleShare = () => showToast('Post link copied to clipboard!', 'info');

  /* Infinite scroll — auto-fetch next page when sentinel is in view */
  useEffect(() => {
    if (inView && hasMore && !loadingMore && !loading) {
      const loadMore = async () => {
        const nextPage = page + 1;
        try {
          setLoadingMore(true);
          const res = await postService.getFeed(nextPage, 20);
          const newPosts = res.data.data || [];
          setFeedData(prev => [...prev, ...newPosts]);
          setHasMore(res.data.pagination?.hasMore ?? false);
          setPage(nextPage);
        } catch {
          showToast('Failed to load more posts.', 'error');
        } finally {
          setLoadingMore(false);
        }
      };
      loadMore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  /* Loading screen */
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
            <CreatePostBox
              user={user}
              onPostCreated={handlePostCreated}
              showToast={showToast}
            />

            <div className="feed-scroll-area">
              {feedData.length > 0 ? (
                <>
                  {feedData.map(post => (
                    <FeedItem
                      key={post._id || post.id}
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                    />
                  ))}

                  {/* ── Infinite Scroll Sentinel ── */}
                  <div ref={sentinelRef} className="text-center py-3" style={{ minHeight: 48 }}>
                    {loadingMore && (
                      <div className="d-inline-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                        <ClipLoader size={16} color="#c84022" />
                        <span>Loading more posts…</span>
                      </div>
                    )}
                    {!hasMore && feedData.length > 0 && (
                      <div className="d-flex align-items-center justify-content-center gap-2" style={{ color: '#aaa', fontSize: 12 }}>
                        <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
                        <span>You're all caught up</span>
                        <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center p-5 bg-white rounded-4 shadow-sm border-0">
                  <i className="fas fa-stream fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No posts yet. Be the first to share something!</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="col-lg-3 d-none d-lg-block">
            {(user?.role === 'admin' || user?.role === 'administrator') && (
              <AdminStatsWidget />
            )}
            <NewsWidget news={[
              { title: "MAMCET Annual Meet '26", date: 'March 15, 2026' },
              { title: 'New AI Lab Opening',     date: 'April 02, 2026' }
            ]} />
            <EventsWidget events={[
              { title: "Symposium'25 Highlights" },
              { title: "Mentorship Program'26"   }
            ]} />
          </div>

        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AlumniDashboard;