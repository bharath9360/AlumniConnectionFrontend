import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { userService, connectionService, chatService, postService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { ClipLoader } from 'react-spinners';
import {
  FaUserPlus, FaCommentDots, FaCheckCircle, FaClock,
  FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaEnvelope,
  FaArrowLeft, FaCamera, FaPencilAlt, FaPlus,
  FaBuilding, FaIdBadge, FaTimes, FaThumbsUp, FaCommentAlt
} from 'react-icons/fa';

// ─── URL resolver helper ──────────────────────────────────────
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND}${url}`;
};

// ─── Framer Motion variants ───────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
  })
};

// ═══════════════════════════════════════════════════════════════
// ConnectButton — 4-state LinkedIn connection UX
// ═══════════════════════════════════════════════════════════════
const ConnectButton = ({ status, isReceiver, onConnect, onMessage, onAccept, onReject, loading }) => {
  if (status === 'connected') {
    return (
      <motion.button
        className="btn rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
        style={{ fontSize: 14, backgroundColor: '#0a66c2', color: '#fff', border: 'none' }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        onClick={onMessage} disabled={loading}
      >
        {loading ? <ClipLoader size={14} color="#fff" /> : <FaCommentDots size={15} />}
        Message
      </motion.button>
    );
  }

  if (status === 'pending' && isReceiver) {
    return (
      <div className="d-flex gap-2">
        <motion.button
          className="btn rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
          style={{ fontSize: 14, backgroundColor: '#0a66c2', color: '#fff', border: 'none' }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={onAccept} disabled={loading}
        >
          {loading ? <ClipLoader size={14} color="#fff" /> : <FaCheckCircle size={14} />}
          Accept
        </motion.button>
        <motion.button
          className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
          style={{ fontSize: 14 }}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={onReject} disabled={loading}
        >
          Ignore
        </motion.button>
      </div>
    );
  }

  if (status === 'pending' && !isReceiver) {
    return (
      <button
        className="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
        style={{ fontSize: 14, cursor: 'not-allowed', opacity: 0.75 }}
        disabled
      >
        <FaClock size={14} /> Pending
      </button>
    );
  }

  return (
    <motion.button
      className="btn rounded-pill px-4 d-flex align-items-center gap-2 fw-bold"
      style={{ fontSize: 14, backgroundColor: '#0a66c2', color: '#fff', border: 'none' }}
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={onConnect} disabled={loading}
    >
      {loading ? <ClipLoader size={14} color="#fff" /> : <FaUserPlus size={15} />}
      Connect
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════
// Section card wrapper
// ═══════════════════════════════════════════════════════════════
const Section = ({ title, onEdit, onAdd, children, custom = 0 }) => (
  <motion.div
    className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3"
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    custom={custom}
  >
    {(title || onEdit || onAdd) && (
      <div className="d-flex justify-content-between align-items-center mb-4">
        {title && <h5 className="fw-bold mb-0 text-dark">{title}</h5>}
        <div className="d-flex gap-2">
          {onAdd && (
            <button className="btn btn-link p-0 text-decoration-none" onClick={onAdd} title="Add">
              <FaPlus style={{ color: '#c84022', fontSize: 15 }} />
            </button>
          )}
          {onEdit && (
            <button className="btn btn-link p-0 text-decoration-none" onClick={onEdit} title="Edit">
              <FaPencilAlt style={{ color: '#c84022', fontSize: 15 }} />
            </button>
          )}
        </div>
      </div>
    )}
    {children}
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE COMPONENT
// ═══════════════════════════════════════════════════════════════
const Profile = () => {
  const { id }           = useParams();
  const navigate         = useNavigate();
  const { user: me, updateUser } = useAuth();

  // ── Core state ──────────────────────────────────────────────
  const [profile, setProfile]            = useState(null);
  const [loading, setLoading]            = useState(true);
  const [toast, setToast]                = useState(null);

  // ── Upload state ─────────────────────────────────────────────
  const [uploadingPic, setUploadingPic]     = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const profilePicRef = useRef(null);
  const bannerPicRef  = useRef(null);

  // ── Connection state ─────────────────────────────────────────
  const [connStatus, setConnStatus]   = useState('none');
  const [isReceiver, setIsReceiver]   = useState(false);
  const [requestId, setRequestId]       = useState(null);
  const [connLoading, setConnLoading] = useState(false);

  // ── Edit-modal state ─────────────────────────────────────────
  const [editData, setEditData]           = useState({});
  const [isHeaderOpen, setIsHeaderOpen]   = useState(false);
  const [isAboutOpen, setIsAboutOpen]     = useState(false);
  const [isExpOpen, setIsExpOpen]         = useState(false);
  const [isEduOpen, setIsEduOpen]         = useState(false);
  const [isSkillsOpen, setIsSkillsOpen]   = useState(false);
  const [skillsInput, setSkillsInput]     = useState('');
  const [saving, setSaving]               = useState(false);

  // ── User posts state ─────────────────────────────────────────
  const POST_LIMIT = 1;
  const [userPosts,      setUserPosts]      = useState([]);
  const [postsLoading,   setPostsLoading]   = useState(false);
  const [postsHasMore,   setPostsHasMore]   = useState(false);

  // ── Activity (likes + comments) state ───────────────────────
  const [activityTab,        setActivityTab]       = useState('likes');
  const [likedPosts,         setLikedPosts]         = useState([]);
  const [commentedPosts,     setCommentedPosts]     = useState([]);
  const [activityLoading,    setActivityLoading]    = useState(false);
  const [likedHasMore,       setLikedHasMore]       = useState(false);
  const [commentedHasMore,   setCommentedHasMore]   = useState(false);

  // ── Edit post state ─────────────────────────────────────
  const [editingPost,        setEditingPost]        = useState(null);  // post object
  const [editPostContent,    setEditPostContent]    = useState('');
  const [editPostSaving,     setEditPostSaving]     = useState(false);

  const showToast = (message, type = 'info') => setToast({ message, type });

  // ── Derived flags ────────────────────────────────────────────
  const isOwnProfile  = !!(me && (me._id === id || me.id === id));
  const isStudent     = profile?.role === 'student';

  // ── Fetch profile + connection status ─────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await userService.getById(id);
        const data = res.data.data || res.data;
        setProfile(data);
        setEditData(data);

        if (me && !isOwnProfile) {
          try {
            const statusRes = await connectionService.getStatus(id);
            let raw = (statusRes.data.status || 'none').toLowerCase();
            if (raw === 'accepted') raw = 'connected';
            setConnStatus(raw);
            setIsReceiver(statusRes.data.isReceiver || false);
            setRequestId(statusRes.data.requestId || null);
          } catch (_) {
            setConnStatus('none');
            setRequestId(null);
          }
        }
      } catch (err) {
        showToast('Could not load profile. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();

    // Fetch this user's posts (limit=5 preview)
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const res = await postService.getUserPosts(id, POST_LIMIT);
        setUserPosts(res.data.data || []);
        setPostsHasMore(res.data.hasMore || false);
      } catch (_) {}
      finally { setPostsLoading(false); }
    };
    if (id) fetchPosts();

    // Fetch activity (liked + commented posts, limit=5 each)
    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const res = await postService.getUserActivity(id, POST_LIMIT);
        setLikedPosts(res.data.likedPosts || []);
        setCommentedPosts(res.data.commentedPosts || []);
        setLikedHasMore(res.data.likedHasMore || false);
        setCommentedHasMore(res.data.commentedHasMore || false);
      } catch (_) {}
      finally { setActivityLoading(false); }
    };
    if (id) fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me?._id]);

  // ── Upload handlers ──────────────────────────────────────────
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append('profilePic', file);
      const res = await userService.uploadDp(fd);
      const pic = res.data.profilePic;
      setProfile(p => ({ ...p, profilePic: pic }));
      setEditData(p => ({ ...p, profilePic: pic }));
      if (updateUser) updateUser(res.data.user || { profilePic: pic });
      showToast('Profile picture updated! 🎉', 'success');
    } catch {
      showToast('Failed to upload picture. Please try again.', 'error');
    } finally {
      setUploadingPic(false);
      if (profilePicRef.current) profilePicRef.current.value = '';
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append('bannerPic', file);
      const res = await userService.uploadBanner(fd);
      const pic = res.data.bannerPic;
      setProfile(p => ({ ...p, bannerPic: pic }));
      setEditData(p => ({ ...p, bannerPic: pic }));
      if (updateUser) updateUser(res.data.user || { bannerPic: pic });
      showToast('Banner updated! 🎉', 'success');
    } catch {
      showToast('Failed to upload banner. Please try again.', 'error');
    } finally {
      setUploadingBanner(false);
      if (bannerPicRef.current) bannerPicRef.current.value = '';
    }
  };

  // ── Save text/array profile fields ────────────────────────────
  const handleSave = useCallback(async (closeFn) => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(editData);
      const updated = res.data.user || editData;
      setProfile(updated);
      setEditData(updated);
      if (updateUser) updateUser(updated);
      closeFn(false);
      showToast('Profile saved! ✓', 'success');
    } catch {
      showToast('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (arr, idx, field, val) => {
    setEditData(prev => {
      const a = [...(prev[arr] || [])];
      a[idx] = { ...a[idx], [field]: val };
      return { ...prev, [arr]: a };
    });
  };

  const addArrayItem = (arr, defaults) => {
    setEditData(prev => ({
      ...prev,
      [arr]: [...(prev[arr] || []), { ...defaults, id: Date.now() }]
    }));
  };

  const removeArrayItem = (arr, idx) => {
    setEditData(prev => {
      const a = [...(prev[arr] || [])];
      a.splice(idx, 1);
      return { ...prev, [arr]: a };
    });
  };

  // ── Connection actions ────────────────────────────────────────
  const handleConnect = async () => {
    if (!me) { navigate('/login'); return; }
    setConnLoading(true);
    try {
      await connectionService.sendRequest(id);
      setConnStatus('pending');
      showToast(`Connection request sent to ${profile?.name}! 🤝`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send request.';
      showToast(msg, 'error');
    } finally { setConnLoading(false); }
  };

  const handleAccept = async () => {
    if (!requestId) return;
    setConnLoading(true);
    try {
      await connectionService.acceptRequest(requestId);
      setConnStatus('connected');
      setIsReceiver(false);
      showToast('Connection accepted! 🎉', 'success');
    } catch { showToast('Failed to accept.', 'error'); }
    finally { setConnLoading(false); }
  };

  const handleReject = async () => {
    if (!requestId) return;
    setConnLoading(true);
    try {
      await connectionService.rejectRequest(requestId);
      setConnStatus('none');
      setIsReceiver(false);
      showToast('Request ignored.', 'info');
    } catch { showToast('Failed to ignore.', 'error'); }
    finally { setConnLoading(false); }
  };

  const handleMessage = async () => {
    if (!me) { navigate('/login'); return; }
    try {
      const res = await chatService.accessChat(id);
      navigate('/messaging', { state: { openChatId: res.data?.data?._id || res.data?._id } });
    } catch { navigate('/messaging'); }
  };

  // ── Loading / error states ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center dashboard-main-bg">
        <ClipLoader color="#c84022" size={48} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-center p-4 dashboard-main-bg">
        <FaIdBadge size={48} className="text-muted mb-3" />
        <h4 className="fw-bold">Profile Not Found</h4>
        <p className="text-muted">This user doesn't exist or may have deactivated their account.</p>
        <Link to="/" className="btn btn-mamcet-red rounded-pill px-4 mt-2">Back to Home</Link>
      </div>
    );
  }

  // Resolved image URLs
  const resolvedAvatar = resolveUrl(profile.profilePic);
  const resolvedBanner = resolveUrl(profile.bannerPic);
  const connCount      = Array.isArray(profile.connections)
    ? profile.connections.filter(c => c.status === 'Accepted').length
    : 0;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">

        {/* Back button */}
        <button
          className="btn btn-sm btn-light rounded-pill px-3 mb-3 d-flex align-items-center gap-2 fw-semibold"
          onClick={() => navigate(-1)}
          style={{ color: '#555' }}
        >
          <FaArrowLeft size={12} /> Back
        </button>

        <div className="row g-4">
          {/* ░░░░ LEFT / MAIN COLUMN ░░░░ */}
          <div className="col-lg-8">

            {/* ══ HERO CARD ══════════════════════════════════════════ */}
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 mb-3 overflow-hidden"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
            >

              {/* —— Banner —— */}
              <div
                className="position-relative"
                style={{ height: 200, overflow: 'hidden', cursor: isOwnProfile ? 'pointer' : 'default' }}
                onClick={() => isOwnProfile && !uploadingBanner && bannerPicRef.current?.click()}
                title={isOwnProfile ? 'Change banner' : ''}
              >
                {resolvedBanner ? (
                  <img
                    src={resolvedBanner}
                    alt="Banner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(135deg, #c84022 0%, #e85d38 55%, #1a1a2e 100%)'
                    }}
                  />
                )}

                {/* Camera overlay — OWN profile only */}
                {isOwnProfile && (
                  <div
                    className="position-absolute d-flex align-items-center gap-2"
                    style={{
                      bottom: 10, right: 12,
                      background: 'rgba(0,0,0,0.48)',
                      borderRadius: 20, padding: '5px 14px',
                      color: '#fff', fontSize: 12, fontWeight: 600,
                      pointerEvents: 'none'
                    }}
                  >
                    {uploadingBanner
                      ? <div className="spinner-border spinner-border-sm text-white" role="status" />
                      : <><FaCamera className="me-1" />Change Banner</>}
                  </div>
                )}

                {/* Hidden file input */}
                {isOwnProfile && (
                  <input
                    ref={bannerPicRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleBannerUpload}
                  />
                )}
              </div>

              {/* —— Info row below banner —— */}
              <div className="px-4 pb-4 position-relative">

                {/* Avatar */}
                <div
                  className="position-relative"
                  style={{
                    width: 120, height: 120,
                    borderRadius: '50%',
                    border: '4px solid #fff',
                    backgroundColor: '#f8f9fa',
                    overflow: 'hidden',
                    marginTop: -60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.8rem', fontWeight: 800, color: '#c84022',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                    cursor: isOwnProfile ? 'pointer' : 'default',
                    flexShrink: 0
                  }}
                  onClick={() => isOwnProfile && !uploadingPic && profilePicRef.current?.click()}
                  title={isOwnProfile ? 'Change photo' : ''}
                >
                  {resolvedAvatar
                    ? <img src={resolvedAvatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (profile.name?.[0]?.toUpperCase() || '?')
                  }

                  {/* Camera half-circle overlay — OWN profile only */}
                  {isOwnProfile && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: '38%', background: 'rgba(0,0,0,0.48)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '0 0 50% 50%'
                    }}>
                      {uploadingPic
                        ? <div className="spinner-border spinner-border-sm text-white" role="status" />
                        : <FaCamera color="#fff" size={14} />}
                    </div>
                  )}

                  {/* Hidden file input */}
                  {isOwnProfile && (
                    <input
                      ref={profilePicRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProfilePicUpload}
                    />
                  )}
                </div>

                {/* Name / headline / meta */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end mt-2 gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-0">{profile.name}</h3>
                    <p className="text-muted mb-1" style={{ fontSize: 15 }}>
                      {profile.designation
                        ? `${profile.designation}${profile.company ? ` at ${profile.company}` : ''}`
                        : profile.company
                          ? `${profile.role?.charAt(0).toUpperCase()}${profile.role?.slice(1)} at ${profile.company}`
                          : profile.role?.charAt(0).toUpperCase() + (profile.role?.slice(1) || '')}
                    </p>

                    {/* Registration meta badges */}
                    <div className="d-flex flex-wrap gap-2 mt-1" style={{ fontSize: 13 }}>
                      {profile.department && (
                        <span className="badge rounded-pill bg-light text-dark border fw-normal px-3 py-1">
                          {profile.department}
                        </span>
                      )}
                      {profile.batch && (
                        <span className="badge rounded-pill bg-light text-dark border fw-normal px-3 py-1">
                          <FaGraduationCap className="me-1" style={{ color: '#c84022' }} />
                          Batch {profile.batch}
                        </span>
                      )}
                      {profile.degree && (
                        <span className="badge rounded-pill bg-light text-dark border fw-normal px-3 py-1">
                          {profile.degree}
                        </span>
                      )}
                    </div>

                    {/* Location & email row */}
                    <div className="d-flex flex-wrap gap-3 mt-2 text-muted" style={{ fontSize: 13 }}>
                      {(profile.city || profile.state) && (
                        <span>
                          <FaMapMarkerAlt className="me-1" style={{ color: '#c84022' }} />
                          {[profile.city, profile.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {profile.email && isOwnProfile && (
                        <span>
                          <FaEnvelope className="me-1" style={{ color: '#c84022' }} />
                          {profile.email}
                        </span>
                      )}
                    </div>

                    {/* Connected badge */}
                    {connStatus === 'connected' && (
                      <p className="extra-small fw-bold mb-0 mt-1" style={{ color: '#2e7d32' }}>
                        <FaCheckCircle className="me-1" />Connected
                      </p>
                    )}

                    {/* Connection count — own profile */}
                    {isOwnProfile && (
                      <p className="extra-small fw-semibold mt-1 mb-0" style={{ color: '#c84022' }}>
                        {connCount} connection{connCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex gap-2 flex-wrap">
                    {isOwnProfile ? (
                      <button
                        className="btn btn-pro btn-pro-outline rounded-pill px-4 fw-bold"
                        style={{ fontSize: 14 }}
                        onClick={() => setIsHeaderOpen(true)}
                      >
                        <FaPencilAlt className="me-2" size={12} />Edit Profile
                      </button>
                    ) : (
                      <ConnectButton
                        status={connStatus}
                        isReceiver={isReceiver}
                        onConnect={handleConnect}
                        onMessage={handleMessage}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        loading={connLoading}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ══ ABOUT ══════════════════════════════════════════════ */}
            <Section
              title="About"
              onEdit={isOwnProfile ? () => setIsAboutOpen(true) : null}
              custom={1}
            >
              {profile.bio ? (
                <p className="text-muted mb-0" style={{ lineHeight: 1.8 }}>{profile.bio}</p>
              ) : (
                <p className="text-muted mb-0 fst-italic">
                  {isOwnProfile ? 'Add a summary about yourself.' : 'No summary yet.'}
                </p>
              )}
            </Section>

            {/* ══ EXPERIENCE ══════════════════════════════════════════ */}
            <Section
              title={isStudent ? 'Experience / Projects' : 'Experience'}
              onEdit={isOwnProfile ? () => setIsExpOpen(true) : null}
              onAdd={isOwnProfile ? () => { addArrayItem('experience', { title: '', company: '', duration: '', desc: '' }); setIsExpOpen(true); } : null}
              custom={2}
            >
              {(profile.experience || []).length > 0 ? (
                profile.experience.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className={`d-flex gap-3 ${idx < profile.experience.length - 1 ? 'mb-4 pb-4 border-bottom' : ''}`}
                  >
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 52, height: 52 }}
                    >
                      <FaBriefcase style={{ color: '#c84022', fontSize: 20 }} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">{exp.title}</h6>
                      <p className="small text-dark mb-1">{exp.company}</p>
                      <p className="extra-small text-muted mb-1">{exp.duration}</p>
                      {exp.desc && <p className="small text-muted mb-0">{exp.desc}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0 fst-italic">
                  {isOwnProfile ? 'Add your experience.' : 'No experience listed.'}
                </p>
              )}
            </Section>

            {/* ══ EDUCATION ══════════════════════════════════════════ */}
            <Section
              title="Education"
              onEdit={isOwnProfile ? () => setIsEduOpen(true) : null}
              onAdd={isOwnProfile ? () => { addArrayItem('education', { school: '', degree: '', duration: '' }); setIsEduOpen(true); } : null}
              custom={3}
            >
              {(profile.education || []).length > 0 ? (
                profile.education.map((edu, idx) => (
                  <div
                    key={edu.id || idx}
                    className={`d-flex gap-3 ${idx < profile.education.length - 1 ? 'mb-4 pb-4 border-bottom' : ''}`}
                  >
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 52, height: 52 }}
                    >
                      <FaGraduationCap style={{ color: '#c84022', fontSize: 20 }} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">{edu.school}</h6>
                      <p className="small text-dark mb-1">{edu.degree}</p>
                      <p className="extra-small text-muted mb-0">{edu.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0 fst-italic">
                  {isOwnProfile ? 'Add your education.' : 'No education listed.'}
                </p>
              )}
            </Section>

            {/* ══ SKILLS ══════════════════════════════════════════════ */}
            {((profile.skills || []).length > 0 || isOwnProfile) && (
              <Section
                title="Skills"
                onEdit={isOwnProfile ? () => { setSkillsInput((profile.skills || []).join(', ')); setIsSkillsOpen(true); } : null}
                custom={4}
              >
                {(profile.skills || []).length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-normal"
                        style={{ fontSize: 13 }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mb-0 fst-italic">Add your skills.</p>
                )}
              </Section>
            )}

            {/* ══ MY POSTS ════════════════════════════════════════ */}
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3"
              variants={fadeUp} initial="hidden" animate="visible" custom={5}
            >
              {/* Section header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">
                  {isOwnProfile ? 'My Posts' : `Posts by ${profile?.name?.split(' ')[0] || 'User'}`}
                </h5>
                {postsHasMore && (
                  <Link
                    to={`/profile/${id}/posts`}
                    className="btn btn-link p-0 fw-semibold"
                    style={{ fontSize: 13, color: '#c84022', textDecoration: 'none' }}
                  >
                    See all posts →
                  </Link>
                )}
              </div>

              {postsLoading ? (
                <div className="d-flex justify-content-center py-4">
                  <ClipLoader color="#c84022" size={28} />
                </div>
              ) : userPosts.length === 0 ? (
                <p className="text-muted fst-italic mb-0 text-center py-3">
                  {isOwnProfile ? "You haven't posted anything yet." : 'No posts yet.'}
                </p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {userPosts.map(post => (
                    <div key={post._id || post.id} className="position-relative">
                      <FeedItem
                        post={post}
                        onEdit={(p) => { setEditingPost(p); setEditPostContent(p.content || ''); }}
                        onDelete={async (postId) => {
                          try {
                            await postService.deletePost(postId);
                            setUserPosts(prev => prev.filter(p => !((p._id === postId) || (p.id === postId))));
                            showToast('Post deleted.', 'success');
                          } catch (e) { showToast('Failed to delete post.', 'error'); }
                        }}
                        onDeleteComment={async (postId, commentId) => {
                          try {
                            const res = await postService.deleteComment(postId, commentId);
                            setUserPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
                          } catch (e) {}
                        }}
                        onLike={async (postId) => {
                          try {
                            const res = await postService.likePost(postId);
                            setUserPosts(prev => prev.map(p =>
                              (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                            ));
                          } catch (_) {}
                        }}
                        onComment={async (postId, content) => {
                          try {
                            const res = await postService.addComment(postId, content);
                            setUserPosts(prev => prev.map(p =>
                              (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                            ));
                          } catch (_) {}
                        }}
                        onShare={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ══ ACTIVITY ═════════════════════════════════════════ */}
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3"
              variants={fadeUp} initial="hidden" animate="visible" custom={6}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">Activity</h5>
              </div>

              {/* Tab toggle */}
              <div className="d-flex gap-1 mb-4">
                {[{ key: 'likes', label: 'Likes', icon: <FaThumbsUp size={12} className="me-1" /> },
                  { key: 'comments', label: 'Comments', icon: <FaCommentAlt size={12} className="me-1" /> }]
                  .map(({ key, label, icon }) => (
                    <button
                      key={key}
                      className="btn rounded-pill fw-semibold d-flex align-items-center"
                      style={{
                        fontSize: 12.5, height: 32, padding: '0 14px',
                        backgroundColor: activityTab === key ? '#c84022' : '#f5f5f5',
                        color: activityTab === key ? '#fff' : '#555',
                        border: 'none', transition: 'all 0.18s'
                      }}
                      onClick={() => setActivityTab(key)}
                    >
                      {icon}{label}
                    </button>
                  ))
                }
              </div>

              {activityLoading ? (
                <div className="d-flex justify-content-center py-4">
                  <ClipLoader color="#c84022" size={26} />
                </div>
              ) : activityTab === 'likes' ? (
                <>
                  {likedPosts.length === 0 ? (
                    <p className="text-muted fst-italic mb-0 text-center py-2">No liked posts yet.</p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {likedPosts.map(post => (
                        <div key={post._id || post.id}>
                          <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: 11.5, color: '#c84022', fontWeight: 600 }}>
                            <FaThumbsUp size={10} /> {
                              isOwnProfile
                                ? 'You liked this post'
                                : `${profile?.name?.split(' ')[0]} liked this`
                            }
                          </div>
                          <FeedItem
                            post={post}
                            onDelete={async (postId) => {
                              try {
                                await postService.deletePost(postId);
                                setLikedPosts(prev => prev.filter(p => !((p._id === postId) || (p.id === postId))));
                                showToast('Post deleted.', 'success');
                              } catch (e) { showToast('Failed to delete post.', 'error'); }
                            }}
                            onDeleteComment={async (postId, commentId) => {
                              try {
                                const res = await postService.deleteComment(postId, commentId);
                                setLikedPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
                              } catch (e) {}
                            }}
                            onLike={async (postId) => {
                              try {
                                const res = await postService.likePost(postId);
                                setLikedPosts(prev => prev.map(p =>
                                  (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                                ));
                              } catch (_) {}
                            }}
                            onComment={async (postId, content) => {
                              try {
                                const res = await postService.addComment(postId, content);
                                setLikedPosts(prev => prev.map(p =>
                                  (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                                ));
                              } catch (_) {}
                            }}
                            onShare={() => {}}
                          />
                        </div>
                      ))}
                      {likedHasMore && (
                        <Link
                          to={`/profile/${id}/activity`}
                          className="btn btn-outline-secondary btn-sm rounded-pill w-100 mt-1 text-decoration-none"
                          style={{ fontSize: 12 }}
                        >
                          See all liked posts
                        </Link>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {commentedPosts.length === 0 ? (
                    <p className="text-muted fst-italic mb-0 text-center py-2">No commented posts yet.</p>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {commentedPosts.map(post => {
                        return (
                          <div key={post._id || post.id}>
                            <FeedItem
                              post={post}
                              onDelete={async (postId) => {
                                try {
                                  await postService.deletePost(postId);
                                  setCommentedPosts(prev => prev.filter(p => !((p._id === postId) || (p.id === postId))));
                                  showToast('Post deleted.', 'success');
                                } catch (e) { showToast('Failed to delete post.', 'error'); }
                              }}
                              onDeleteComment={async (postId, commentId) => {
                                try {
                                  const res = await postService.deleteComment(postId, commentId);
                                  setCommentedPosts(prev => prev.map(p => (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p));
                                } catch (e) {}
                              }}
                              onLike={async (postId) => {
                                try {
                                  const res = await postService.likePost(postId);
                                  setCommentedPosts(prev => prev.map(p =>
                                    (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                                  ));
                                } catch (_) {}
                              }}
                              onComment={async (postId, content) => {
                                try {
                                  const res = await postService.addComment(postId, content);
                                  setCommentedPosts(prev => prev.map(p =>
                                    (p._id === postId || p.id === postId) ? { ...p, ...res.data.data } : p
                                  ));
                                } catch (_) {}
                              }}
                              onShare={() => {}}
                            />
                          </div>
                        );
                      })}
                      {commentedHasMore && (
                        <Link
                          to={`/profile/${id}/activity`}
                          className="btn btn-outline-secondary btn-sm rounded-pill w-100 mt-1 text-decoration-none"
                          style={{ fontSize: 12 }}
                        >
                          See all commented posts
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>

          </div>{/* /col-lg-8 */}

          {/* ░░░░ RIGHT SIDEBAR ░░░░ */}
          <div className="col-lg-4 d-none d-lg-block">

            {/* Mini info card */}
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              <h6 className="fw-bold mb-3 text-dark">Profile Details</h6>
              <div className="d-flex flex-column gap-2" style={{ fontSize: 13 }}>
                {profile.email && (
                  <span className="text-muted">
                    <FaEnvelope className="me-2" style={{ color: '#c84022' }} />{profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="text-muted">
                    📞 {profile.phone}
                  </span>
                )}
                {profile.department && (
                  <span className="text-muted">
                    <FaBuilding className="me-2" style={{ color: '#c84022' }} />{profile.department}
                  </span>
                )}
                {profile.batch && (
                  <span className="text-muted">
                    <FaGraduationCap className="me-2" style={{ color: '#c84022' }} />Batch {profile.batch}
                  </span>
                )}
                {profile.degree && (
                  <span className="text-muted">
                    🎓 {profile.degree}
                  </span>
                )}
                {profile.company && (
                  <span className="text-muted">
                    <FaBuilding className="me-2" style={{ color: '#c84022' }} />{profile.company}
                  </span>
                )}
                {profile.workLocation && (
                  <span className="text-muted">
                    <FaMapMarkerAlt className="me-2" style={{ color: '#c84022' }} />{profile.workLocation}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Connected — message CTA */}
            <AnimatePresence>
              {connStatus === 'connected' && !isOwnProfile && (
                <motion.div
                  className="bg-white rounded-4 shadow-sm border-0 p-4"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                >
                  <h6 className="fw-bold mb-3 text-dark">
                    <FaCheckCircle className="me-2" style={{ color: '#2e7d32' }} />
                    You're connected
                  </h6>
                  <p className="extra-small text-muted mb-3">
                    You and {profile.name?.split(' ')[0]} are connected. Message each other freely.
                  </p>
                  <button
                    className="btn btn-mamcet-red rounded-pill w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                    onClick={handleMessage}
                    style={{ fontSize: 13 }}
                  >
                    <FaCommentDots size={14} /> Send a Message
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Own profile — quick links */}
            {isOwnProfile && (
              <motion.div
                className="bg-white rounded-4 shadow-sm border-0 p-4"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <h6 className="fw-bold mb-3 text-dark">Quick Actions</h6>
                <div className="d-flex flex-column gap-2">
                  <button
                    className="btn btn-pro btn-pro-outline rounded-pill text-start fw-semibold"
                    style={{ fontSize: 13 }}
                    onClick={() => setIsAboutOpen(true)}
                  >
                    <FaPencilAlt className="me-2" />Edit About
                  </button>
                  <button
                    className="btn btn-pro btn-pro-outline rounded-pill text-start fw-semibold"
                    style={{ fontSize: 13 }}
                    onClick={() => setIsExpOpen(true)}
                  >
                    <FaBriefcase className="me-2" />Edit Experience
                  </button>
                  <button
                    className="btn btn-pro btn-pro-outline rounded-pill text-start fw-semibold"
                    style={{ fontSize: 13 }}
                    onClick={() => setIsEduOpen(true)}
                  >
                    <FaGraduationCap className="me-2" />Edit Education
                  </button>
                </div>
              </motion.div>
            )}

          </div>{/* /col-lg-4 */}
        </div>{/* /row */}
      </div>

      {/* ══════════════════════════════════════════════════════════
          EDIT MODALS — only rendered / interactable for own profile
        ══════════════════════════════════════════════════════════ */}

      {/* ── Edit Intro / Header Modal ── */}
      <Modal
        isOpen={isHeaderOpen}
        onClose={() => setIsHeaderOpen(false)}
        title="Edit Intro"
        footer={
          <button
            className="btn btn-mamcet-red px-4 fw-bold"
            onClick={() => handleSave(setIsHeaderOpen)}
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : 'Save Changes'}
          </button>
        }
      >
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label extra-small fw-bold">Full Name</label>
            <input type="text" className="form-control" name="name"
              value={editData.name || ''} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label extra-small fw-bold">Designation / Role</label>
            <input type="text" className="form-control" name="designation"
              value={editData.designation || ''} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label extra-small fw-bold">Company / Organization</label>
            <input type="text" className="form-control" name="company"
              value={editData.company || ''} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label extra-small fw-bold">City</label>
            <input type="text" className="form-control" name="city"
              value={editData.city || ''} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label extra-small fw-bold">State</label>
            <input type="text" className="form-control" name="state"
              value={editData.state || ''} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label extra-small fw-bold">Work Location</label>
            <input type="text" className="form-control" name="workLocation"
              value={editData.workLocation || ''} onChange={handleChange} />
          </div>
        </div>
      </Modal>

      {/* ── Edit About Modal ── */}
      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title="Edit About"
        footer={
          <button
            className="btn btn-mamcet-red px-4 fw-bold"
            onClick={() => handleSave(setIsAboutOpen)}
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : 'Save Changes'}
          </button>
        }
      >
        <label className="form-label extra-small fw-bold">Summary</label>
        <textarea
          className="form-control"
          name="bio"
          rows={6}
          value={editData.bio || ''}
          onChange={handleChange}
          placeholder="Write a short summary about yourself..."
        />
      </Modal>

      {/* ── Edit Experience Modal ── */}
      <Modal
        isOpen={isExpOpen}
        onClose={() => setIsExpOpen(false)}
        title={isStudent ? 'Edit Experience / Projects' : 'Edit Experience'}
        footer={
          <button
            className="btn btn-mamcet-red px-4 fw-bold"
            onClick={() => handleSave(setIsExpOpen)}
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : 'Save Changes'}
          </button>
        }
      >
        <div className="d-flex flex-column gap-3">
          {(editData.experience || []).map((exp, idx) => (
            <div key={exp.id || idx} className="border rounded p-3 position-relative">
              <button
                className="btn btn-sm text-danger position-absolute top-0 end-0 m-2 p-1"
                onClick={() => removeArrayItem('experience', idx)}
                title="Remove"
              >
                <FaTimes size={13} />
              </button>
              <div className="row g-2 mt-1">
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold">Title / Role</label>
                  <input type="text" className="form-control form-control-sm"
                    value={exp.title || ''} onChange={e => handleArrayChange('experience', idx, 'title', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold">Company</label>
                  <input type="text" className="form-control form-control-sm"
                    value={exp.company || ''} onChange={e => handleArrayChange('experience', idx, 'company', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold">Duration</label>
                  <input type="text" className="form-control form-control-sm"
                    value={exp.duration || ''} onChange={e => handleArrayChange('experience', idx, 'duration', e.target.value)}
                    placeholder="e.g. Jan 2023 – Present" />
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold">Description</label>
                  <textarea className="form-control form-control-sm" rows={2}
                    value={exp.desc || ''} onChange={e => handleArrayChange('experience', idx, 'desc', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn-outline-secondary btn-sm rounded-pill"
            onClick={() => addArrayItem('experience', { title: '', company: '', duration: '', desc: '' })}
          >
            <FaPlus className="me-1" size={11} />Add Role
          </button>
        </div>
      </Modal>

      {/* ── Edit Education Modal ── */}
      <Modal
        isOpen={isEduOpen}
        onClose={() => setIsEduOpen(false)}
        title="Edit Education"
        footer={
          <button
            className="btn btn-mamcet-red px-4 fw-bold"
            onClick={() => handleSave(setIsEduOpen)}
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : 'Save Changes'}
          </button>
        }
      >
        <div className="d-flex flex-column gap-3">
          {(editData.education || []).map((edu, idx) => (
            <div key={edu.id || idx} className="border rounded p-3 position-relative">
              <button
                className="btn btn-sm text-danger position-absolute top-0 end-0 m-2 p-1"
                onClick={() => removeArrayItem('education', idx)}
                title="Remove"
              >
                <FaTimes size={13} />
              </button>
              <div className="row g-2 mt-1">
                <div className="col-12">
                  <label className="form-label extra-small fw-bold">School / University</label>
                  <input type="text" className="form-control form-control-sm"
                    value={edu.school || ''} onChange={e => handleArrayChange('education', idx, 'school', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold">Degree</label>
                  <input type="text" className="form-control form-control-sm"
                    value={edu.degree || ''} onChange={e => handleArrayChange('education', idx, 'degree', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold">Duration</label>
                  <input type="text" className="form-control form-control-sm"
                    value={edu.duration || ''} onChange={e => handleArrayChange('education', idx, 'duration', e.target.value)}
                    placeholder="e.g. 2019 – 2023" />
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn-outline-secondary btn-sm rounded-pill"
            onClick={() => addArrayItem('education', { school: '', degree: '', duration: '' })}
          >
            <FaPlus className="me-1" size={11} />Add School
          </button>
        </div>
      </Modal>

      {/* ── Edit Skills Modal ── */}
      <Modal
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
        title="Edit Skills"
        footer={
          <button
            className="btn btn-mamcet-red px-4 fw-bold"
            onClick={() => {
              const parsed = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
              setEditData(prev => ({ ...prev, skills: parsed }));
              setTimeout(() => handleSave(setIsSkillsOpen), 30);
            }}
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : 'Save Changes'}
          </button>
        }
      >
        <label className="form-label extra-small fw-bold">Skills (comma-separated)</label>
        <input
          type="text"
          className="form-control"
          value={skillsInput}
          onChange={e => setSkillsInput(e.target.value)}
          placeholder="e.g. React, Node.js, Python, SQL"
        />
        <div className="d-flex flex-wrap gap-2 mt-3">
          {skillsInput.split(',').map(s => s.trim()).filter(Boolean).map((skill, idx) => (
            <span key={idx} className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-normal" style={{ fontSize: 13 }}>
              {skill}
            </span>
          ))}
        </div>
      </Modal>

      {/* ── Edit Post Modal ────────────────────────────── */}
      <Modal
        isOpen={!!editingPost}
        onClose={() => { setEditingPost(null); setEditPostContent(''); }}
        title="Edit Post"
        footer={
          <button
            className="btn btn-mamcet-red rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
            disabled={editPostSaving || !editPostContent.trim()}
            onClick={async () => {
              setEditPostSaving(true);
              try {
                const res = await postService.editPost(editingPost._id || editingPost.id, editPostContent);
                const updated = res.data.data;
                setUserPosts(prev => prev.map(p =>
                  (p._id === editingPost._id || p.id === editingPost.id) ? { ...p, ...updated } : p
                ));
                setEditingPost(null);
                setEditPostContent('');
                showToast('Post updated! ✓', 'success');
              } catch { showToast('Failed to update post.', 'error'); }
              finally { setEditPostSaving(false); }
            }}
          >
            {editPostSaving && <ClipLoader size={14} color="#fff" />} Save Changes
          </button>
        }
      >
        <textarea
          className="form-control"
          rows={5}
          value={editPostContent}
          onChange={e => setEditPostContent(e.target.value)}
          placeholder="What do you want to share?"
          style={{ resize: 'vertical', fontSize: 14 }}
        />
        <p className="extra-small text-muted mt-2 mb-0">
          Note: Attached images cannot be changed. Only post text is editable.
        </p>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default Profile;
