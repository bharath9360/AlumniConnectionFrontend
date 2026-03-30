import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { authService, connectionService, chatService } from '../../services/api';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';
import {
  FaUserPlus, FaCommentDots, FaCheckCircle, FaClock,
  FaBriefcase, FaGraduationCap, FaMapMarkerAlt, FaEnvelope,
  FaArrowLeft
} from 'react-icons/fa';

// ── Connection button states ─────────────────────────────────
const CONNECTION_STATES = {
  none:      { label: 'Connect',  icon: FaUserPlus,    variant: 'btn-mamcet-red',    disabled: false },
  pending:   { label: 'Pending',  icon: FaClock,       variant: 'btn-outline-secondary', disabled: true  },
  connected: { label: 'Message', icon: FaCommentDots, variant: 'btn-pro-outline',    disabled: false }
};

const ConnectButton = ({ status, onConnect, onMessage, loading }) => {
  let normalized = status?.toLowerCase() || 'none';
  if (normalized === 'accepted') normalized = 'connected';
  const cfg = CONNECTION_STATES[normalized] || CONNECTION_STATES.none;
  const IconComp = cfg.icon;

  const handleClick = () => {
    if (status === 'connected') onMessage();
    else if (status === 'none')  onConnect();
  };

  return (
    <motion.button
      className={`btn ${cfg.variant} rounded-pill px-4 d-flex align-items-center gap-2 fw-bold`}
      style={{ fontSize: 14 }}
      whileHover={!cfg.disabled ? { scale: 1.04 } : {}}
      whileTap={!cfg.disabled  ? { scale: 0.97 } : {}}
      disabled={cfg.disabled || loading}
      onClick={handleClick}
    >
      {loading
        ? <ClipLoader size={14} color="#fff" />
        : <IconComp size={15} />
      }
      {cfg.label}
    </motion.button>
  );
};

// ── Section wrapper ──────────────────────────────────────────
const ProfileSection = ({ title, children, className = '' }) => (
  <motion.div
    className={`bg-white rounded-4 shadow-sm border-0 p-4 mb-3 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
  >
    {title && <h5 className="fw-bold text-dark mb-4">{title}</h5>}
    {children}
  </motion.div>
);

// ── Main Component ───────────────────────────────────────────
const PublicProfile = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile]           = useState(null);
  const [connStatus, setConnStatus]     = useState('none');   // none | pending | connected
  const [isReceiver, setIsReceiver]     = useState(false);
  const [loading,   setLoading]         = useState(true);
  const [connLoading, setConnLoading]   = useState(false);
  const [toast,     setToast]           = useState(null);

  const showToast = (message, type = 'info') => setToast({ message, type });

  const isOwnProfile = me?._id === id || me?.id === id;

  // ── Fetch user + connection status ────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const userRes = await authService.getUserById(id);
        setProfile(userRes.data.data || userRes.data);

        if (me && !isOwnProfile) {
          const statusRes = await connectionService.getStatus(id);
          let rawStatus = statusRes.data.status?.toLowerCase() || 'none';
          if (rawStatus === 'accepted') rawStatus = 'connected';
          setConnStatus(rawStatus);
          setIsReceiver(statusRes.data.isReceiver || false);
        }
      } catch (err) {
        showToast('Could not load profile. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id, me, isOwnProfile]);

  // ── Connection action ─────────────────────────────────────
  const handleConnect = async () => {
    if (!me) { navigate('/login'); return; }
    setConnLoading(true);
    try {
      // The Axios interceptor inside api.js automatically attaches the Authorization header.
      await connectionService.sendRequest(id);
      setConnStatus('pending');
      showToast(`Connection request sent to ${profile?.name}! 🤝`, 'success');
    } catch (err) {
      console.log('🔥 Connection Error Details:', err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send request.';
      const statusCode = err.response?.status ? ` (Status: ${err.response.status})` : '';
      showToast(`${errorMsg}${statusCode}`, 'error');
    } finally {
      setConnLoading(false);
    }
  };

  const handleAccept = async () => {
    setConnLoading(true);
    try {
      await connectionService.acceptRequest(id);
      setConnStatus('connected');
      setIsReceiver(false);
      showToast('Connection accepted! 🎉', 'success');
    } catch (err) {
      showToast('Failed to accept connection.', 'error');
    } finally { setConnLoading(false); }
  };

  const handleReject = async () => {
    setConnLoading(true);
    try {
      await connectionService.removeConnection(id);
      setConnStatus('none');
      setIsReceiver(false);
      showToast('Connection request removed.', 'info');
    } catch (err) {
      showToast('Failed to reject connection.', 'error');
    } finally { setConnLoading(false); }
  };

  // ── Message action (navigate to messaging) ────────────────
  const handleMessage = async () => {
    if (!me) { navigate('/login'); return; }
    try {
      const res = await chatService.accessChat(id);
      navigate('/messaging', { state: { openChatId: res.data?.data?._id || res.data?._id } });
    } catch {
      navigate('/messaging');
    }
  };

  // ── Loading ───────────────────────────────────────────────
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
        <i className="fas fa-user-slash fa-3x text-muted mb-3"></i>
        <h4 className="fw-bold">Profile Not Found</h4>
        <p className="text-muted">This user might not exist or may have removed their account.</p>
        <Link to="/" className="btn btn-mamcet-red rounded-pill px-4 mt-2">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-main-bg py-4 min-vh-100">
      <div className="container">

        {/* Back arrow */}
        <button
          className="btn btn-sm btn-light rounded-pill px-3 mb-3 d-flex align-items-center gap-2 fw-semibold"
          onClick={() => navigate(-1)}
          style={{ color: '#555' }}
        >
          <FaArrowLeft size={12} /> Back
        </button>

        <div className="row g-4 justify-content-center">
          <div className="col-lg-8">

            {/* ── HERO CARD ─────────────────────────────── */}
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 mb-3 overflow-hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Cover photo */}
              <div style={{ height: 180, overflow: 'hidden', backgroundColor: '#c84022', position: 'relative' }}>
                {profile.coverPic
                  ? <img src={profile.coverPic} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (
                    <div
                      style={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #c84022 0%, #8b1a0e 100%)'
                      }}
                    />
                  )
                }
              </div>

              {/* Profile info */}
              <div className="px-4 pb-4 position-relative">
                {/* Avatar */}
                <div
                  className="rounded-circle border border-4 border-white shadow overflow-hidden"
                  style={{
                    width: 120, height: 120, marginTop: -60,
                    backgroundColor: '#f8f9fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.8rem', fontWeight: 800, color: '#c84022'
                  }}
                >
                  {profile.profilePic
                    ? <img src={profile.profilePic} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : profile.name?.[0]?.toUpperCase() || '?'
                  }
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mt-2 gap-3">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">{profile.name}</h3>
                    <p className="text-muted mb-1" style={{ fontSize: 15 }}>
                      {profile.headline || `${profile.role || ''} ${profile.company ? `at ${profile.company}` : ''}`}
                    </p>
                    <div className="d-flex flex-wrap gap-3 extra-small text-muted">
                      {profile.location && (
                        <span><FaMapMarkerAlt className="me-1" style={{ color: '#c84022' }} />{profile.location}</span>
                      )}
                      {profile.batch && (
                        <span><FaGraduationCap className="me-1" style={{ color: '#c84022' }} />Batch {profile.batch}</span>
                      )}
                      {profile.email && !isOwnProfile && (
                        <span><FaEnvelope className="me-1" style={{ color: '#c84022' }} />{profile.email}</span>
                      )}
                    </div>

                    {/* Connection count */}
                    {connStatus === 'connected' && (
                      <p className="extra-small fw-bold mb-0 mt-1" style={{ color: '#c84022' }}>
                        ✓ Connected
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="d-flex gap-2 flex-wrap">
                    {isOwnProfile ? (
                      <Link to={`/alumni/profile/${me?._id || me?.id}`} className="btn btn-pro-outline rounded-pill px-4 fw-bold" style={{ fontSize: 14 }}>
                        Edit Profile
                      </Link>
                    ) : (
                      <>
                        {connStatus.toLowerCase() === 'pending' && isReceiver ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-success rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                              style={{ fontSize: 14 }}
                              onClick={handleAccept}
                              disabled={connLoading}
                            >
                              <FaCheckCircle size={14} /> Accept
                            </button>
                            <button
                              className="btn btn-outline-danger rounded-pill px-4 fw-bold"
                              style={{ fontSize: 14 }}
                              onClick={handleReject}
                              disabled={connLoading}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <ConnectButton
                            status={connStatus.toLowerCase()}
                            onConnect={handleConnect}
                            onMessage={handleMessage}
                            loading={connLoading}
                          />
                        )}
                        
                        {connStatus.toLowerCase() !== 'connected' && (
                          <button
                            className="btn btn-outline-secondary rounded-pill px-4 fw-bold d-flex align-items-center gap-2"
                            style={{ fontSize: 14 }}
                            onClick={handleMessage}
                          >
                            <FaCommentDots size={14} /> Message
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── ABOUT ─────────────────────────────────── */}
            {profile.bio && (
              <ProfileSection title="About">
                <p className="text-muted mb-0" style={{ lineHeight: 1.8 }}>{profile.bio}</p>
              </ProfileSection>
            )}

            {/* ── EXPERIENCE ────────────────────────────── */}
            {profile.experience?.length > 0 && (
              <ProfileSection title="Experience">
                {profile.experience.map((exp, idx) => (
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
                ))}
              </ProfileSection>
            )}

            {/* ── EDUCATION ─────────────────────────────── */}
            {profile.education?.length > 0 && (
              <ProfileSection title="Education">
                {profile.education.map((edu, idx) => (
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
                ))}
              </ProfileSection>
            )}

            {/* ── SKILLS ────────────────────────────────── */}
            {profile.skills?.length > 0 && (
              <ProfileSection title="Skills">
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
              </ProfileSection>
            )}

            {/* Empty state */}
            {!profile.bio && !profile.experience?.length && !profile.education?.length && !profile.skills?.length && (
              <ProfileSection>
                <div className="text-center py-3">
                  <i className="fas fa-user fa-2x text-muted mb-2"></i>
                  <p className="text-muted mb-0">This user hasn't filled out their profile yet.</p>
                </div>
              </ProfileSection>
            )}

          </div>

          {/* ── RIGHT: Mini card ─────────────────────── */}
          <div className="col-lg-4 d-none d-lg-block">
            <motion.div
              className="bg-white rounded-4 shadow-sm border-0 p-4 mb-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <h6 className="fw-bold mb-3 text-dark">People also viewed</h6>
              <p className="extra-small text-muted">More profiles coming soon.</p>
            </motion.div>

            {connStatus === 'connected' && (
              <motion.div
                className="bg-white rounded-4 shadow-sm border-0 p-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <h6 className="fw-bold mb-3 text-dark">
                  <FaCheckCircle className="me-2" style={{ color: '#2e7d32' }} />
                  You're connected
                </h6>
                <p className="extra-small text-muted mb-3">
                  You and {profile.name?.split(' ')[0]} are connected. You can message each other freely.
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
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default PublicProfile;
