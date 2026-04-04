import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mentorshipService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaGraduationCap, FaHandsHelping, FaStar, FaCheck, FaTimes,
  FaUserTie, FaChalkboardTeacher, FaSearch, FaFilter,
  FaBriefcase, FaRegStar, FaCheckCircle, FaTimesCircle,
  FaBook, FaEdit, FaSave, FaPlus
} from 'react-icons/fa';

// ─── Constants ────────────────────────────────────────────────
const DOMAINS = [
  'all', 'Web Dev', 'Mobile Dev', 'AI/ML', 'Data Science',
  'Cloud/DevOps', 'Embedded Systems', 'Finance', 'Core Engineering',
  'Research', 'Product Management', 'HR/Operations'
];
const DEPARTMENTS = [
  'all', 'Computer Science & Engineering', 'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Information Technology', 'Artificial Intelligence & Data Science', 'MBA', 'MCA'
];
const MAMCET_RED   = '#c84022';
const MENTOR_GREEN = '#1a6b4a';

// ─── Helpers ──────────────────────────────────────────────────
const Stars = ({ rating, size = 14 }) => (
  <div className="d-flex align-items-center gap-1">
    {[1,2,3,4,5].map(n => (
      n <= Math.round(rating)
        ? <FaStar key={n} size={size} color="#f5a623" />
        : <FaRegStar key={n} size={size} color="#f5a623" />
    ))}
  </div>
);

const RoleBadge = ({ role }) => (
  <span className="badge rounded-pill px-2 fw-semibold" style={{
    fontSize: 10,
    background: role === 'alumni' ? '#cce5ff' : '#d4edda',
    color: role === 'alumni' ? '#004085' : '#155724'
  }}>
    {role === 'alumni' ? <><FaUserTie className="me-1" />Alumni</> : <><FaChalkboardTeacher className="me-1" />Staff</>}
  </span>
);

const Avatar = ({ user, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', overflow: 'hidden',
    flexShrink: 0, background: '#f0f0f0', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    border: '2px solid #fff', boxShadow: '0 1px 6px rgba(0,0,0,.1)'
  }}>
    {user?.profilePic
      ? <img src={user.profilePic} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span style={{ fontWeight: 700, fontSize: size * 0.38, color: MAMCET_RED }}>{user?.name?.[0]?.toUpperCase() || '?'}</span>
    }
  </div>
);

// ─── Mentor Card ──────────────────────────────────────────────
const MentorCard = ({ mentor, myRequests, onRequest, isStudent }) => {
  const mp = mentor.mentorProfile || {};
  const existingReq = myRequests.find(r => r.mentorId?._id?.toString() === mentor._id?.toString());

  return (
    <motion.div
      className="bg-white rounded-4 shadow-sm p-3"
      style={{ border: '1px solid #f0f0f0' }}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,.10)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {/* Header */}
      <div className="d-flex gap-3 align-items-start mb-3">
        <Avatar user={mentor} size={52} />
        <div className="flex-grow-1 min-width-0">
          <div className="fw-bold" style={{ fontSize: 15, lineHeight: 1.2 }}>{mentor.name}</div>
          <div className="text-muted d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: 12, marginTop: 3 }}>
            <RoleBadge role={mentor.role} />
            {mentor.company && <span><FaBriefcase size={10} className="me-1" />{mentor.company}</span>}
            {mentor.designation && <span>{mentor.designation}</span>}
          </div>
          {mp.avgRating > 0 && (
            <div className="d-flex align-items-center gap-1 mt-1">
              <Stars rating={mp.avgRating} size={11} />
              <span style={{ fontSize: 11, color: '#888' }}>{mp.avgRating} ({mp.totalRatings})</span>
            </div>
          )}
        </div>
        {mp.isAvailable !== false && (
          <span className="badge rounded-pill" style={{ background: '#d4edda', color: '#155724', fontSize: 10 }}>
            Available
          </span>
        )}
      </div>

      {/* Domain tags */}
      {mp.domain?.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-2">
          {mp.domain.map(d => (
            <span key={d} className="badge" style={{ background: '#fff5f3', color: MAMCET_RED, border: `1px solid #f1c4b8`, fontSize: 10.5 }}>{d}</span>
          ))}
        </div>
      )}

      {/* Skills */}
      {mp.skills?.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-3">
          {mp.skills.slice(0, 5).map(s => (
            <span key={s} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{s}</span>
          ))}
          {mp.skills.length > 5 && <span className="badge bg-light text-muted border" style={{ fontSize: 10 }}>+{mp.skills.length - 5}</span>}
        </div>
      )}

      {/* Bio */}
      {mp.bio && <p className="text-muted mb-3" style={{ fontSize: 12, lineHeight: 1.5 }}>{mp.bio}</p>}

      {/* Stats */}
      {mp.totalSessions > 0 && (
        <div className="text-muted mb-3" style={{ fontSize: 11 }}>
          <FaCheckCircle style={{ color: MENTOR_GREEN }} className="me-1" />
          {mp.totalSessions} session{mp.totalSessions !== 1 ? 's' : ''} completed
        </div>
      )}

      {/* Action */}
      {isStudent && (
        existingReq ? (
          <div className="text-center py-2">
            <span className="badge rounded-pill px-3" style={{
              background: existingReq.status === 'accepted' ? '#d4edda' : existingReq.status === 'rejected' ? '#f8d7da' : '#fff3cd',
              color: existingReq.status === 'accepted' ? '#155724' : existingReq.status === 'rejected' ? '#721c24' : '#856404',
              fontSize: 12
            }}>
              {existingReq.status === 'accepted' ? '✓ Accepted' : existingReq.status === 'rejected' ? '✕ Declined' : '⏳ Request Sent'}
            </span>
          </div>
        ) : (
          <button
            className="btn w-100 rounded-pill fw-bold"
            style={{ background: MAMCET_RED, color: '#fff', fontSize: 13, height: 36 }}
            onClick={() => onRequest(mentor)}
            disabled={mp.isAvailable === false}
          >
            <FaHandsHelping className="me-2" />
            {mp.isAvailable === false ? 'Unavailable' : 'Request Mentorship'}
          </button>
        )
      )}
    </motion.div>
  );
};

// ─── Request Modal ────────────────────────────────────────────
const RequestModal = ({ mentor, onClose, onSubmit, loading }) => {
  const [topic, setTopic]     = useState('');
  const [message, setMessage] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div
        style={{ background: '#fff', borderRadius: 18, padding: '28px 28px', width: '100%', maxWidth: 460 }}
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Request Mentorship</h5>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
          <Avatar user={mentor} size={44} />
          <div>
            <div className="fw-bold">{mentor.name}</div>
            <div className="text-muted" style={{ fontSize: 12 }}>{mentor.company || mentor.department}</div>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold small">What do you need help with?</label>
          <input type="text" className="form-control" placeholder="e.g. Web Dev career, Interview prep, AI projects..."
            value={topic} onChange={e => setTopic(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold small">Message to mentor <span className="text-muted fw-normal">(optional)</span></label>
          <textarea className="form-control" rows={3} placeholder="Briefly introduce yourself and what you hope to learn..."
            value={message} onChange={e => setMessage(e.target.value)} maxLength={500} />
          <div className="text-end text-muted" style={{ fontSize: 11 }}>{message.length}/500</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={onClose}>Cancel</button>
          <button
            className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            style={{ background: MAMCET_RED, color: '#fff' }}
            onClick={() => onSubmit({ topic, message })}
            disabled={loading || !topic.trim()}
          >
            {loading ? <ClipLoader size={14} color="#fff" /> : <><FaHandsHelping />Send Request</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Become Mentor Panel ──────────────────────────────────────
const BecomeMentorPanel = ({ profile, onSaved }) => {
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({
    skills: profile?.skills?.join(', ') || '',
    domain: profile?.domain || [],
    experience: profile?.experience || '',
    bio: profile?.bio || '',
    isAvailable: profile?.isAvailable !== false
  });

  const toggleDomain = (d) => {
    setForm(f => ({
      ...f,
      domain: f.domain.includes(d) ? f.domain.filter(x => x !== d) : [...f.domain, d]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await mentorshipService.registerMentor(form);
      toast.success(profile ? 'Mentor profile updated!' : 'You are now a mentor! 🎉');
      onSaved(res.data.data);
      setOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  if (!open) {
    return (
      <motion.div
        className="bg-white rounded-4 shadow-sm p-4 mb-4"
        style={{ border: `2px solid ${profile ? MENTOR_GREEN + '40' : MAMCET_RED + '30'}` }}
        whileHover={{ boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}
      >
        <div className="d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: profile ? `${MENTOR_GREEN}18` : `${MAMCET_RED}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaHandsHelping style={{ color: profile ? MENTOR_GREEN : MAMCET_RED, fontSize: 20 }} />
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: 15 }}>
                {profile ? 'Your Mentor Profile' : 'Become a Mentor'}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {profile
                  ? `${profile.domain?.join(', ') || 'No domains set'} • ${profile.isAvailable ? 'Available' : 'Unavailable'}`
                  : 'Share your expertise and guide students in their career journey'}
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1"
            style={{ background: profile ? `${MENTOR_GREEN}18` : `${MAMCET_RED}12`, color: profile ? MENTOR_GREEN : MAMCET_RED, border: 'none' }}
            onClick={() => setOpen(true)}
          >
            {profile ? <><FaEdit size={12} />Edit</> : <><FaPlus size={12} />Set Up</>}
          </button>
        </div>
        {profile && (
          <div className="d-flex flex-wrap gap-1 mt-3">
            {profile.skills?.slice(0, 6).map(s => (
              <span key={s} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{s}</span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-4 shadow-sm p-4 mb-4"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ border: `2px solid ${MENTOR_GREEN}40` }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h6 className="fw-bold mb-0" style={{ color: MENTOR_GREEN }}>
          <FaHandsHelping className="me-2" />{profile ? 'Edit Mentor Profile' : 'Become a Mentor'}
        </h6>
        <button className="btn btn-sm btn-link text-muted p-0" onClick={() => setOpen(false)}><FaTimes /></button>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <label className="form-label small fw-semibold">Skills <span className="text-muted fw-normal">(comma-separated)</span></label>
          <input type="text" className="form-control form-control-sm" placeholder="React, Node.js, Python, SQL..."
            value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">Domain / Expertise</label>
          <div className="d-flex flex-wrap gap-2">
            {DOMAINS.filter(d => d !== 'all').map(d => (
              <button key={d} type="button"
                onClick={() => toggleDomain(d)}
                className="btn btn-sm rounded-pill"
                style={{
                  fontSize: 12,
                  background: form.domain.includes(d) ? MAMCET_RED : '#f0f0f0',
                  color: form.domain.includes(d) ? '#fff' : '#555',
                  border: 'none'
                }}
              >{d}</button>
            ))}
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Experience</label>
          <input type="text" className="form-control form-control-sm" placeholder="e.g. 4 years at Infosys"
            value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
        </div>
        <div className="col-md-6">
          <label className="form-label small fw-semibold">Availability</label>
          <div className="form-check form-switch mt-1">
            <input type="checkbox" className="form-check-input" role="switch"
              checked={form.isAvailable}
              onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} />
            <label className="form-check-label small">{form.isAvailable ? 'Available for requests' : 'Not accepting requests'}</label>
          </div>
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">Bio <span className="text-muted fw-normal">(max 500 chars)</span></label>
          <textarea className="form-control form-control-sm" rows={3} placeholder="What can you help students with? Any specialties?"
            value={form.bio} maxLength={500}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        </div>
      </div>

      <div className="d-flex gap-2 mt-4">
        <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setOpen(false)}>Cancel</button>
        <button
          className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-2"
          style={{ background: MENTOR_GREEN, color: '#fff' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <ClipLoader size={13} color="#fff" /> : <><FaSave size={12} />Save Profile</>}
        </button>
      </div>
    </motion.div>
  );
};

// ─── Session Card ─────────────────────────────────────────────
const SessionCard = ({ session, currentUserId, onComplete, onFeedback, onNotesEdit }) => {
  const isMentor  = session.mentorId?._id === currentUserId || session.mentorId?._id?.toString() === currentUserId;
  const other     = isMentor ? session.menteeId : session.mentorId;
  const isActive  = session.status === 'active';

  return (
    <div className="bg-white rounded-4 shadow-sm p-3 mb-3" style={{ border: '1px solid #f0f0f0' }}>
      <div className="d-flex align-items-start gap-3">
        <Avatar user={other} size={42} />
        <div className="flex-grow-1">
          <div className="fw-bold" style={{ fontSize: 14 }}>{other?.name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>
            {isMentor ? 'Your mentee' : 'Your mentor'} •{' '}
            {other?.department || other?.company || '—'}
          </div>
          {session.topic && (
            <div className="mt-1 d-flex align-items-center gap-1 text-muted" style={{ fontSize: 12 }}>
              <FaBook size={10} /> Topic: <strong>{session.topic}</strong>
            </div>
          )}
          <div className="mt-2">
            <span className="badge rounded-pill" style={{
              fontSize: 11,
              background: isActive ? '#cce5ff' : '#d4edda',
              color: isActive ? '#004085' : '#155724'
            }}>
              {isActive ? '● Active' : '✓ Completed'}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="mt-3 p-2 rounded-3" style={{ background: '#f8f9fa', fontSize: 12 }}>
          <strong className="text-muted">Notes:</strong> {session.notes}
        </div>
      )}

      {/* Feedback */}
      {session.feedback?.rating && (
        <div className="mt-2 d-flex align-items-center gap-2">
          <Stars rating={session.feedback.rating} size={12} />
          {session.feedback.comment && <span className="text-muted" style={{ fontSize: 11 }}>"{session.feedback.comment}"</span>}
        </div>
      )}

      {/* Actions */}
      <div className="d-flex flex-wrap gap-2 mt-3">
        {isMentor && isActive && (
          <>
            <button className="btn btn-sm rounded-pill" style={{ background: MENTOR_GREEN, color: '#fff', fontSize: 12 }}
              onClick={() => onComplete(session)}>
              <FaCheckCircle className="me-1" />Mark Complete
            </button>
            <button className="btn btn-sm btn-outline-secondary rounded-pill" style={{ fontSize: 12 }}
              onClick={() => onNotesEdit(session)}>
              <FaEdit className="me-1" />Add Notes
            </button>
          </>
        )}
        {!isMentor && !isActive && !session.feedback?.rating && (
          <button className="btn btn-sm rounded-pill fw-semibold" style={{ background: '#f5a623', color: '#fff', fontSize: 12 }}
            onClick={() => onFeedback(session)}>
            <FaStar className="me-1" />Leave Feedback
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Feedback Modal ───────────────────────────────────────────
const FeedbackModal = ({ session, onClose, onSubmit, loading }) => {
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [comment, setComment] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div style={{ background: '#fff', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 400 }}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">Rate Your Experience</h5>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="text-center mb-4">
          <div className="fw-semibold mb-2">How helpful was {session?.mentorId?.name}?</div>
          <div className="d-flex justify-content-center gap-2">
            {[1,2,3,4,5].map(n => (
              <span key={n} style={{ cursor: 'pointer', fontSize: 28 }}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}>
                {n <= (hover || rating) ? '⭐' : '☆'}
              </span>
            ))}
          </div>
          {rating > 0 && <p className="text-muted mt-2 small">{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}</p>}
        </div>
        <div className="mb-4">
          <label className="form-label small fw-semibold">Comment <span className="text-muted fw-normal">(optional)</span></label>
          <textarea className="form-control" rows={3} maxLength={500}
            placeholder="What did you learn? Would you recommend this mentor?"
            value={comment} onChange={e => setComment(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={onClose}>Cancel</button>
          <button
            className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            style={{ background: '#f5a623', color: '#fff' }}
            onClick={() => onSubmit({ rating, comment })}
            disabled={loading || rating === 0}
          >
            {loading ? <ClipLoader size={14} color="#fff" /> : <><FaStar />Submit</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Mentorship = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const isStudent = role === 'student';
  const isMentor  = role === 'alumni' || role === 'staff';

  // ── Tab ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('discover');

  // ── Discover ─────────────────────────────────────────────────
  const [mentors,       setMentors]       = useState([]);
  const [loadingMentors,setLoadingMentors]= useState(true);
  const [domainFilter,  setDomainFilter]  = useState('all');
  const [deptFilter,    setDeptFilter]    = useState('all');
  const [search,        setSearch]        = useState('');
  const [showFilters,   setShowFilters]   = useState(false);

  // ── My Requests / Sessions ────────────────────────────────────
  const [myRequests,     setMyRequests]     = useState([]);
  const [incomingReqs,   setIncomingReqs]   = useState([]);
  const [sessions,       setSessions]       = useState([]);
  const [loadingData,    setLoadingData]    = useState(true);

  // ── Mentor profile ────────────────────────────────────────────
  const [myMentorProfile, setMyMentorProfile] = useState(null);

  // ── Modals ────────────────────────────────────────────────────
  const [requestTarget,  setRequestTarget]  = useState(null);
  const [reqLoading,     setReqLoading]     = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackLoading,setFeedbackLoading]= useState(false);
  const [notesTarget,    setNotesTarget]    = useState(null);
  const [notesText,      setNotesText]      = useState('');
  const [notesSaving,    setNotesSaving]    = useState(false);

  // ── Fetch Mentors ─────────────────────────────────────────────
  const fetchMentors = useCallback(() => {
    setLoadingMentors(true);
    const params = { available: 'true' };
    if (domainFilter !== 'all') params.domain = domainFilter;
    if (deptFilter !== 'all')   params.department = deptFilter;
    if (search.trim())          params.search = search.trim();
    mentorshipService.getMentors(params)
      .then(res => setMentors(res.data.data || []))
      .catch(() => toast.error('Failed to load mentors.'))
      .finally(() => setLoadingMentors(false));
  }, [domainFilter, deptFilter, search]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  // ── Fetch user-specific data ──────────────────────────────────
  const fetchPersonalData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [sessRes, reqRes, inRes, mpRes] = await Promise.allSettled([
        mentorshipService.getMySessions(),
        isStudent ? mentorshipService.getMyRequests() : Promise.resolve({ data: { data: [] } }),
        isMentor  ? mentorshipService.getIncomingRequests() : Promise.resolve({ data: { data: [] } }),
        isMentor  ? mentorshipService.getMyMentorProfile()  : Promise.resolve({ data: { data: null } }),
      ]);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data.data || []);
      if (reqRes.status === 'fulfilled')  setMyRequests(reqRes.value.data.data || []);
      if (inRes.status === 'fulfilled')   setIncomingReqs(inRes.value.data.data || []);
      if (mpRes.status === 'fulfilled')   setMyMentorProfile(mpRes.value.data.data);
    } catch (_) {}
    finally { setLoadingData(false); }
  }, [isStudent, isMentor]);

  useEffect(() => { fetchPersonalData(); }, [fetchPersonalData]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleSendRequest = async ({ topic, message }) => {
    setReqLoading(true);
    try {
      await mentorshipService.sendRequest({ mentorId: requestTarget._id, topic, message });
      toast.success('Mentorship request sent! 🙌');
      setRequestTarget(null);
      fetchPersonalData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request.');
    } finally { setReqLoading(false); }
  };

  const handleAcceptRequest = async (req) => {
    try {
      await mentorshipService.acceptRequest(req._id);
      toast.success('Request accepted! Session started.');
      fetchPersonalData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept.');
    }
  };

  const handleRejectRequest = async (req) => {
    try {
      await mentorshipService.rejectRequest(req._id);
      toast.success('Request declined.');
      fetchPersonalData();
    } catch (err) {
      toast.error('Failed to reject.');
    }
  };

  const handleCompleteSession = async (session) => {
    try {
      await mentorshipService.completeSession(session._id, { notes: session.notes });
      toast.success('Session marked as completed! ✅');
      fetchPersonalData();
    } catch (err) {
      toast.error('Failed to mark complete.');
    }
  };

  const handleFeedback = async ({ rating, comment }) => {
    setFeedbackLoading(true);
    try {
      await mentorshipService.submitFeedback(feedbackTarget._id, { rating, comment });
      toast.success('Feedback submitted! Thank you 🌟');
      setFeedbackTarget(null);
      fetchPersonalData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    } finally { setFeedbackLoading(false); }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    try {
      await mentorshipService.updateNotes(notesTarget._id, { notes: notesText });
      toast.success('Notes saved.');
      setNotesTarget(null);
      fetchPersonalData();
    } catch (err) { toast.error('Failed to save notes.'); }
    finally { setNotesSaving(false); }
  };

  const TABS = [
    { key: 'discover', label: 'Discover Mentors', icon: <FaSearch className="me-1" size={12} /> },
    { key: 'sessions', label: 'My Mentors', icon: <FaHandsHelping className="me-1" size={12} /> },
    { key: 'requests', label: isStudent ? 'My Requests' : 'Incoming Requests', icon: <FaGraduationCap className="me-1" size={12} /> },
  ];

  const activeSessionCount   = sessions.filter(s => s.status === 'active').length;
  const pendingIncomingCount = incomingReqs.length;

  return (
    <div className="dashboard-main-bg min-vh-100 py-4">
      <Toaster position="top-center" />
      <div className="container-fluid px-3 px-lg-4" style={{ maxWidth: 1200 }}>

        {/* ── Header ── */}
        <motion.div
          className="rounded-4 mb-4 px-4 py-3 d-flex align-items-center gap-3 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff' }}
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        >
          <FaHandsHelping size={32} style={{ color: '#f5a623' }} />
          <div>
            <div className="fw-bold" style={{ fontSize: 19 }}>Mentorship Hub</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {isStudent
                ? 'Connect with experienced alumni and staff for guidance on your career journey'
                : 'Guide students, share expertise, and shape the next generation of professionals'}
            </div>
          </div>
        </motion.div>

        <div className="row g-4">
          {/* ── LEFT: Main Content ── */}
          <div className="col-lg-8">

            {/* Mentor profile panel — for alumni/staff */}
            {isMentor && (
              <BecomeMentorPanel
                profile={myMentorProfile}
                onSaved={(p) => setMyMentorProfile(p)}
              />
            )}

            {/* Tab Bar */}
            <div className="bg-white rounded-4 p-1 shadow-sm mb-4 d-inline-flex gap-1 w-100">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="btn rounded-3 flex-grow-1 d-flex align-items-center justify-content-center fw-semibold"
                  style={{
                    fontSize: 13, height: 38,
                    background: activeTab === t.key ? MAMCET_RED : 'transparent',
                    color: activeTab === t.key ? '#fff' : '#666',
                    position: 'relative'
                  }}
                >
                  {t.icon}{t.label}
                  {t.key === 'requests' && (pendingIncomingCount > 0 || myRequests.some(r => r.status === 'pending')) && (
                    <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: 10 }}>
                      {isStudent ? myRequests.filter(r => r.status === 'pending').length : pendingIncomingCount}
                    </span>
                  )}
                  {t.key === 'sessions' && activeSessionCount > 0 && (
                    <span className="badge rounded-pill bg-success ms-1" style={{ fontSize: 10 }}>{activeSessionCount}</span>
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* ══ DISCOVER TAB ══ */}
              {activeTab === 'discover' && (
                <motion.div key="discover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>

                  {/* Search + Filter */}
                  <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
                    <div className="d-flex gap-2 flex-wrap">
                      <div className="position-relative flex-grow-1">
                        <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 13 }} />
                        <input type="text" className="form-control ps-4" placeholder="Search by name, company, domain..."
                          value={search} onChange={e => setSearch(e.target.value)}
                          style={{ borderRadius: 20, fontSize: 13 }} />
                      </div>
                      <button
                        className={`btn btn-sm rounded-pill d-flex align-items-center gap-1 ${showFilters ? 'btn-danger' : 'btn-outline-secondary'}`}
                        onClick={() => setShowFilters(f => !f)} style={{ fontSize: 12 }}
                      >
                        <FaFilter size={11} /> Filters
                      </button>
                    </div>
                    {showFilters && (
                      <div className="row g-2 mt-2">
                        <div className="col-md-6">
                          <select className="form-select form-select-sm" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
                            {DOMAINS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Domains' : d}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <select className="form-select form-select-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingMentors ? (
                    <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={36} /></div>
                  ) : mentors.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FaHandsHelping size={40} className="mb-3 opacity-25" />
                      <p>No mentors found. Try different filters.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {mentors.map(m => (
                        <div key={m._id} className="col-md-6">
                          <MentorCard
                            mentor={m}
                            myRequests={myRequests}
                            onRequest={setRequestTarget}
                            isStudent={isStudent}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══ SESSIONS TAB ══ */}
              {activeTab === 'sessions' && (
                <motion.div key="sessions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                  {loadingData ? (
                    <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={32} /></div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <FaHandsHelping size={40} className="mb-3 opacity-25" />
                      <p>{isStudent ? 'No active mentors yet. Discover mentors and send a request!' : 'No mentorship sessions yet.'}</p>
                    </div>
                  ) : (
                    <>
                      {sessions.some(s => s.status === 'active') && (
                        <>
                          <h6 className="fw-bold mb-3 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Active Sessions</h6>
                          {sessions.filter(s => s.status === 'active').map(s => (
                            <SessionCard
                              key={s._id} session={s}
                              currentUserId={user?._id || user?.id}
                              onComplete={handleCompleteSession}
                              onFeedback={setFeedbackTarget}
                              onNotesEdit={s => { setNotesTarget(s); setNotesText(s.notes || ''); }}
                            />
                          ))}
                        </>
                      )}
                      {sessions.some(s => s.status === 'completed') && (
                        <>
                          <h6 className="fw-bold mb-3 mt-4 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Completed</h6>
                          {sessions.filter(s => s.status === 'completed').map(s => (
                            <SessionCard
                              key={s._id} session={s}
                              currentUserId={user?._id || user?.id}
                              onComplete={handleCompleteSession}
                              onFeedback={setFeedbackTarget}
                              onNotesEdit={s => { setNotesTarget(s); setNotesText(s.notes || ''); }}
                            />
                          ))}
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {/* ══ REQUESTS TAB ══ */}
              {activeTab === 'requests' && (
                <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                  {loadingData ? (
                    <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={32} /></div>
                  ) : isStudent ? (
                    /* Student — outgoing requests */
                    myRequests.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <FaGraduationCap size={40} className="mb-3 opacity-25" />
                        <p>No requests sent yet. Discover mentors above and send your first request!</p>
                      </div>
                    ) : (
                      myRequests.map(req => (
                        <div key={req._id} className="bg-white rounded-4 shadow-sm p-3 mb-3 d-flex gap-3 align-items-center" style={{ border: '1px solid #f0f0f0' }}>
                          <Avatar user={req.mentorId} size={44} />
                          <div className="flex-grow-1">
                            <div className="fw-bold">{req.mentorId?.name}</div>
                            <div className="text-muted" style={{ fontSize: 12 }}>{req.mentorId?.company || req.mentorId?.department}</div>
                            {req.topic && <div className="text-muted" style={{ fontSize: 12 }}>Topic: <strong>{req.topic}</strong></div>}
                          </div>
                          <span className={`badge rounded-pill px-3 py-2`} style={{
                            background: req.status === 'accepted' ? '#d4edda' : req.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                            color: req.status === 'accepted' ? '#155724' : req.status === 'rejected' ? '#721c24' : '#856404',
                            fontSize: 12
                          }}>
                            {req.status === 'accepted' ? '✅ Accepted' : req.status === 'rejected' ? '❌ Declined' : '⏳ Pending'}
                          </span>
                        </div>
                      ))
                    )
                  ) : (
                    /* Mentor — incoming requests */
                    incomingReqs.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <FaHandsHelping size={40} className="mb-3 opacity-25" />
                        <p>No pending requests. Set up your mentor profile to start receiving them.</p>
                      </div>
                    ) : (
                      incomingReqs.map(req => (
                        <div key={req._id} className="bg-white rounded-4 shadow-sm p-3 mb-3" style={{ border: '1px solid #f0f0f0' }}>
                          <div className="d-flex gap-3 align-items-start mb-3">
                            <Avatar user={req.menteeId} size={44} />
                            <div className="flex-grow-1">
                              <div className="fw-bold">{req.menteeId?.name}</div>
                              <div className="text-muted" style={{ fontSize: 12 }}>{req.menteeId?.department} • Batch {req.menteeId?.batch}</div>
                              {req.topic && <div className="mt-1 fw-semibold" style={{ fontSize: 13 }}>Topic: {req.topic}</div>}
                            </div>
                          </div>
                          {req.message && (
                            <div className="p-2 rounded-3 mb-3" style={{ background: '#f8f9fa', fontSize: 13 }}>"{req.message}"</div>
                          )}
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1"
                              style={{ background: MENTOR_GREEN, color: '#fff' }}
                              onClick={() => handleAcceptRequest(req)}
                            >
                              <FaCheck size={11} />Accept
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill fw-bold d-flex align-items-center gap-1"
                              onClick={() => handleRejectRequest(req)}
                            >
                              <FaTimes size={11} />Decline
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="col-lg-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-3" style={{ color: MAMCET_RED, fontSize: 13 }}>
                <FaGraduationCap className="me-2" />Your Mentorship Stats
              </h6>
              <div className="d-flex flex-column gap-2">
                {[
                  { label: 'Active Sessions',     value: sessions.filter(s => s.status === 'active').length,    color: '#378fe9' },
                  { label: 'Completed Sessions',  value: sessions.filter(s => s.status === 'completed').length,  color: MENTOR_GREEN },
                  { label: isStudent ? 'Requests Sent' : 'Pending Requests',
                    value: isStudent ? myRequests.length : pendingIncomingCount,
                    color: '#f5a623' },
                ].map(s => (
                  <div key={s.label} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <span className="text-muted" style={{ fontSize: 13 }}>{s.label}</span>
                    <span className="fw-bold" style={{ color: s.color, fontSize: 16 }}>{s.value}</span>
                  </div>
                ))}
                {isMentor && myMentorProfile?.avgRating > 0 && (
                  <div className="d-flex align-items-center justify-content-between py-2">
                    <span className="text-muted" style={{ fontSize: 13 }}>Your Rating</span>
                    <div className="d-flex align-items-center gap-1">
                      <Stars rating={myMentorProfile.avgRating} size={12} />
                      <span className="fw-bold" style={{ fontSize: 13 }}>{myMentorProfile.avgRating}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: `2px solid ${MAMCET_RED}15` }}>
              <h6 className="fw-bold mb-3" style={{ color: MAMCET_RED, fontSize: 13 }}>How It Works</h6>
              {(isStudent ? [
                { icon: '🔍', title: 'Discover', desc: 'Browse and filter mentors by domain, department or company' },
                { icon: '📩', title: 'Request', desc: 'Send a request with your topic and a personal message' },
                { icon: '✅', title: 'Connect', desc: 'Once accepted, your mentorship session begins' },
                { icon: '⭐', title: 'Grow', desc: 'Complete the session and leave feedback for your mentor' },
              ] : [
                { icon: '🛠️', title: 'Set Up Profile', desc: 'Add your skills, domains and availability' },
                { icon: '📩', title: 'Review Requests', desc: 'Accept or decline student requests' },
                { icon: '🎓', title: 'Guide', desc: 'Help students with topics, add session notes' },
                { icon: '✅', title: 'Complete', desc: 'Mark sessions done — students can leave you feedback' },
              ]).map((s, i) => (
                <div key={i} className="d-flex gap-3 mb-3">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${MAMCET_RED}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: 13 }}>{s.title}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {requestTarget && (
        <RequestModal
          mentor={requestTarget}
          onClose={() => setRequestTarget(null)}
          onSubmit={handleSendRequest}
          loading={reqLoading}
        />
      )}
      {feedbackTarget && (
        <FeedbackModal
          session={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
          onSubmit={handleFeedback}
          loading={feedbackLoading}
        />
      )}
      {notesTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 440 }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Session Notes</h5>
              <button className="btn btn-sm btn-link text-muted p-0" onClick={() => setNotesTarget(null)}><FaTimes /></button>
            </div>
            <textarea className="form-control mb-3" rows={5} placeholder="Add notes about this session..."
              value={notesText} onChange={e => setNotesText(e.target.value)} />
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={() => setNotesTarget(null)}>Cancel</button>
              <button
                className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                style={{ background: MENTOR_GREEN, color: '#fff' }}
                onClick={handleSaveNotes}
                disabled={notesSaving}
              >
                {notesSaving ? <ClipLoader size={14} color="#fff" /> : <><FaSave size={12} />Save Notes</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Mentorship;
