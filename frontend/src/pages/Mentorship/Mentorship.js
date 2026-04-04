import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { mentorshipService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ClipLoader } from 'react-spinners';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaGraduationCap, FaHandsHelping, FaStar, FaCheck, FaTimes,
  FaUserTie, FaChalkboardTeacher, FaSearch, FaFilter, FaUserGraduate,
  FaBriefcase, FaRegStar, FaCheckCircle, FaCommentDots,
  FaBook, FaEdit, FaSave, FaPlus, FaUsers
} from 'react-icons/fa';

const DOMAINS = [
  'all','Web Dev','Mobile Dev','AI/ML','Data Science',
  'Cloud/DevOps','Embedded Systems','Finance','Core Engineering',
  'Research','Product Management','HR/Operations'
];
const DEPARTMENTS = [
  'all','Computer Science & Engineering','Electronics & Communication Engineering',
  'Electrical & Electronics Engineering','Mechanical Engineering','Civil Engineering',
  'Information Technology','Artificial Intelligence & Data Science','MBA','MCA'
];
const MAMCET_RED = '#c84022';
const MENTOR_GREEN = '#1a6b4a';

const Stars = ({ rating, size = 14 }) => (
  <div className="d-flex align-items-center gap-1">
    {[1,2,3,4,5].map(n => (
      n <= Math.round(rating)
        ? <FaStar key={n} size={size} color="#f5a623" />
        : <FaRegStar key={n} size={size} color="#f5a623" />
    ))}
  </div>
);

const RoleBadge = ({ role }) => {
  const icons = { alumni: FaUserTie, staff: FaChalkboardTeacher, student: FaUserGraduate };
  const colors = { alumni: ['#cce5ff','#004085'], staff: ['#d4edda','#155724'], student: ['#fff3cd','#856404'] };
  const Icon = icons[role] || FaUserGraduate;
  const [bg, fg] = colors[role] || colors.student;
  return <span className="badge rounded-pill px-2 fw-semibold" style={{ fontSize: 10, background: bg, color: fg }}><Icon className="me-1" size={9}/>{role}</span>;
};

const Avatar = ({ user, size = 44 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 1px 6px rgba(0,0,0,.1)' }}>
    {user?.profilePic
      ? <img src={user.profilePic} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span style={{ fontWeight: 700, fontSize: size * 0.38, color: MAMCET_RED }}>{user?.name?.[0]?.toUpperCase() || '?'}</span>}
  </div>
);

// ─── Mentor Card ──────────────────────────────────────────────
const MentorCard = ({ mentor, myRequests, onRequest, canRequest }) => {
  const mp = mentor.mentorProfile || {};
  const existingReq = myRequests.find(r => (r.mentorId?._id || r.mentorId)?.toString() === mentor._id?.toString());
  return (
    <motion.div className="bg-white rounded-4 shadow-sm p-3" style={{ border: '1px solid #f0f0f0' }}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,.10)' }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <div className="d-flex gap-3 align-items-start mb-3">
        <Avatar user={mentor} size={52} />
        <div className="flex-grow-1 min-width-0">
          <div className="fw-bold" style={{ fontSize: 15, lineHeight: 1.2 }}>{mentor.name}</div>
          <div className="text-muted d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: 12, marginTop: 3 }}>
            <RoleBadge role={mentor.role} />
            {mentor.company && <span><FaBriefcase size={10} className="me-1"/>{mentor.company}</span>}
          </div>
          {mp.avgRating > 0 && <div className="d-flex align-items-center gap-1 mt-1"><Stars rating={mp.avgRating} size={11}/><span style={{ fontSize: 11, color: '#888' }}>{mp.avgRating} ({mp.totalRatings})</span></div>}
        </div>
        {mp.isAvailable !== false && <span className="badge rounded-pill" style={{ background: '#d4edda', color: '#155724', fontSize: 10 }}>Available</span>}
      </div>
      {mp.domain?.length > 0 && <div className="d-flex flex-wrap gap-1 mb-2">{mp.domain.map(d => <span key={d} className="badge" style={{ background: '#fff5f3', color: MAMCET_RED, border: '1px solid #f1c4b8', fontSize: 10.5 }}>{d}</span>)}</div>}
      {mp.skills?.length > 0 && <div className="d-flex flex-wrap gap-1 mb-3">{mp.skills.slice(0,5).map(s => <span key={s} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{s}</span>)}{mp.skills.length > 5 && <span className="badge bg-light text-muted border" style={{ fontSize: 10 }}>+{mp.skills.length-5}</span>}</div>}
      {mp.bio && <p className="text-muted mb-3" style={{ fontSize: 12, lineHeight: 1.5 }}>{mp.bio}</p>}
      {mp.totalSessions > 0 && <div className="text-muted mb-3" style={{ fontSize: 11 }}><FaCheckCircle style={{ color: MENTOR_GREEN }} className="me-1"/>{mp.totalSessions} session{mp.totalSessions !== 1 ? 's' : ''} completed</div>}
      {canRequest && (existingReq ? (
        <div className="text-center py-2">
          <span className="badge rounded-pill px-3" style={{ background: existingReq.status === 'accepted' ? '#d4edda' : existingReq.status === 'rejected' ? '#f8d7da' : '#fff3cd', color: existingReq.status === 'accepted' ? '#155724' : existingReq.status === 'rejected' ? '#721c24' : '#856404', fontSize: 12 }}>
            {existingReq.status === 'accepted' ? '✓ Accepted' : existingReq.status === 'rejected' ? '✕ Declined' : '⏳ Request Sent'}
          </span>
        </div>
      ) : (
        <button className="btn w-100 rounded-pill fw-bold" style={{ background: MAMCET_RED, color: '#fff', fontSize: 13, height: 36 }} onClick={() => onRequest(mentor)} disabled={mp.isAvailable === false}>
          <FaHandsHelping className="me-2"/>{mp.isAvailable === false ? 'Unavailable' : 'Request Mentorship'}
        </button>
      ))}
    </motion.div>
  );
};

// ─── Request Modal ────────────────────────────────────────────
const RequestModal = ({ mentor, onClose, onSubmit, loading }) => {
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div style={{ background: '#fff', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 460 }} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4"><h5 className="fw-bold mb-0">Request Mentorship</h5><button className="btn btn-sm btn-link text-muted p-0" onClick={onClose}><FaTimes/></button></div>
        <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}><Avatar user={mentor} size={44}/><div><div className="fw-bold">{mentor.name}</div><div className="text-muted" style={{ fontSize: 12 }}>{mentor.company || mentor.department}</div></div></div>
        <div className="mb-3"><label className="form-label fw-semibold small">What do you need help with?</label><input type="text" className="form-control" placeholder="e.g. Web Dev career, Interview prep..." value={topic} onChange={e => setTopic(e.target.value)}/></div>
        <div className="mb-4"><label className="form-label fw-semibold small">Message <span className="text-muted fw-normal">(optional)</span></label><textarea className="form-control" rows={3} placeholder="Introduce yourself..." value={message} onChange={e => setMessage(e.target.value)} maxLength={500}/></div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={onClose}>Cancel</button>
          <button className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ background: MAMCET_RED, color: '#fff' }} onClick={() => onSubmit({ topic, message })} disabled={loading || !topic.trim()}>
            {loading ? <ClipLoader size={14} color="#fff"/> : <><FaHandsHelping/>Send Request</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Become Mentor Panel ──────────────────────────────────────
const BecomeMentorPanel = ({ profile, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ skills: profile?.skills?.join(', ') || '', domain: profile?.domain || [], experience: profile?.experience || '', bio: profile?.bio || '', isAvailable: profile?.isAvailable !== false });
  const toggleDomain = d => setForm(f => ({ ...f, domain: f.domain.includes(d) ? f.domain.filter(x => x !== d) : [...f.domain, d] }));
  const handleSave = async () => {
    setSaving(true);
    try { const res = await mentorshipService.registerMentor(form); toast.success(profile ? 'Mentor profile updated!' : 'You are now a mentor! 🎉'); onSaved(res.data.data); setOpen(false); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };
  if (!open) return (
    <motion.div className="bg-white rounded-4 shadow-sm p-4 mb-4" style={{ border: `2px solid ${profile ? MENTOR_GREEN+'40' : MAMCET_RED+'30'}` }} whileHover={{ boxShadow: '0 6px 24px rgba(0,0,0,.08)' }}>
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: profile ? `${MENTOR_GREEN}18` : `${MAMCET_RED}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaHandsHelping style={{ color: profile ? MENTOR_GREEN : MAMCET_RED, fontSize: 20 }}/></div>
          <div><div className="fw-bold" style={{ fontSize: 15 }}>{profile ? 'Your Mentor Profile' : 'Become a Mentor'}</div><div className="text-muted" style={{ fontSize: 12 }}>{profile ? `${profile.domain?.join(', ') || 'No domains'} • ${profile.isAvailable ? 'Available' : 'Unavailable'}` : 'Share your expertise and guide others'}</div></div>
        </div>
        <button className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1" style={{ background: profile ? `${MENTOR_GREEN}18` : `${MAMCET_RED}12`, color: profile ? MENTOR_GREEN : MAMCET_RED, border: 'none' }} onClick={() => setOpen(true)}>{profile ? <><FaEdit size={12}/>Edit</> : <><FaPlus size={12}/>Set Up</>}</button>
      </div>
      {profile?.skills?.length > 0 && <div className="d-flex flex-wrap gap-1 mt-3">{profile.skills.slice(0,6).map(s => <span key={s} className="badge bg-light text-dark border" style={{ fontSize: 10 }}>{s}</span>)}</div>}
    </motion.div>
  );
  return (
    <motion.div className="bg-white rounded-4 shadow-sm p-4 mb-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ border: `2px solid ${MENTOR_GREEN}40` }}>
      <div className="d-flex justify-content-between align-items-center mb-4"><h6 className="fw-bold mb-0" style={{ color: MENTOR_GREEN }}><FaHandsHelping className="me-2"/>{profile ? 'Edit Mentor Profile' : 'Become a Mentor'}</h6><button className="btn btn-sm btn-link text-muted p-0" onClick={() => setOpen(false)}><FaTimes/></button></div>
      <div className="row g-3">
        <div className="col-12"><label className="form-label small fw-semibold">Skills <span className="text-muted fw-normal">(comma-separated)</span></label><input type="text" className="form-control form-control-sm" placeholder="React, Node.js, Python..." value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}/></div>
        <div className="col-12"><label className="form-label small fw-semibold">Domain / Expertise</label><div className="d-flex flex-wrap gap-2">{DOMAINS.filter(d => d !== 'all').map(d => <button key={d} type="button" onClick={() => toggleDomain(d)} className="btn btn-sm rounded-pill" style={{ fontSize: 12, background: form.domain.includes(d) ? MAMCET_RED : '#f0f0f0', color: form.domain.includes(d) ? '#fff' : '#555', border: 'none' }}>{d}</button>)}</div></div>
        <div className="col-md-6"><label className="form-label small fw-semibold">Experience</label><input type="text" className="form-control form-control-sm" placeholder="e.g. 4 years at Infosys" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}/></div>
        <div className="col-md-6"><label className="form-label small fw-semibold">Availability</label><div className="form-check form-switch mt-1"><input type="checkbox" className="form-check-input" role="switch" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}/><label className="form-check-label small">{form.isAvailable ? 'Available' : 'Not accepting'}</label></div></div>
        <div className="col-12"><label className="form-label small fw-semibold">Bio</label><textarea className="form-control form-control-sm" rows={3} placeholder="What can you help with?" value={form.bio} maxLength={500} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}/></div>
      </div>
      <div className="d-flex gap-2 mt-4"><button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-2" style={{ background: MENTOR_GREEN, color: '#fff' }} onClick={handleSave} disabled={saving}>{saving ? <ClipLoader size={13} color="#fff"/> : <><FaSave size={12}/>Save Profile</>}</button></div>
    </motion.div>
  );
};

// ─── Session Card ─────────────────────────────────────────────
const SessionCard = ({ session, currentUserId, onComplete, onFeedback, onNotesEdit, onChat }) => {
  const isMentor = session.mentorId?._id?.toString() === currentUserId?.toString();
  const other = isMentor ? session.menteeId : session.mentorId;
  const isActive = session.status === 'active';
  return (
    <div className="bg-white rounded-4 shadow-sm p-3 mb-3" style={{ border: '1px solid #f0f0f0' }}>
      <div className="d-flex align-items-start gap-3">
        <Avatar user={other} size={42}/>
        <div className="flex-grow-1">
          <div className="fw-bold" style={{ fontSize: 14 }}>{other?.name}</div>
          <div className="text-muted" style={{ fontSize: 12 }}>{isMentor ? 'Your mentee' : 'Your mentor'} • {other?.department || other?.company || '—'}</div>
          {session.topic && <div className="mt-1 d-flex align-items-center gap-1 text-muted" style={{ fontSize: 12 }}><FaBook size={10}/> Topic: <strong>{session.topic}</strong></div>}
          <div className="mt-2"><span className="badge rounded-pill" style={{ fontSize: 11, background: isActive ? '#cce5ff' : '#d4edda', color: isActive ? '#004085' : '#155724' }}>{isActive ? '● Active' : '✓ Completed'}</span></div>
        </div>
      </div>
      {session.notes && <div className="mt-3 p-2 rounded-3" style={{ background: '#f8f9fa', fontSize: 12 }}><strong className="text-muted">Notes:</strong> {session.notes}</div>}
      {session.feedback?.rating && <div className="mt-2 d-flex align-items-center gap-2"><Stars rating={session.feedback.rating} size={12}/>{session.feedback.comment && <span className="text-muted" style={{ fontSize: 11 }}>"{session.feedback.comment}"</span>}</div>}
      <div className="d-flex flex-wrap gap-2 mt-3">
        {session.chatId && <button className="btn btn-sm rounded-pill btn-outline-primary" style={{ fontSize: 12 }} onClick={() => onChat(session.chatId)}><FaCommentDots className="me-1"/>Open Chat</button>}
        {isMentor && isActive && <>
          <button className="btn btn-sm rounded-pill" style={{ background: MENTOR_GREEN, color: '#fff', fontSize: 12 }} onClick={() => onComplete(session)}><FaCheckCircle className="me-1"/>Mark Complete</button>
          <button className="btn btn-sm btn-outline-secondary rounded-pill" style={{ fontSize: 12 }} onClick={() => onNotesEdit(session)}><FaEdit className="me-1"/>Notes</button>
        </>}
        {!isMentor && !isActive && !session.feedback?.rating && <button className="btn btn-sm rounded-pill fw-semibold" style={{ background: '#f5a623', color: '#fff', fontSize: 12 }} onClick={() => onFeedback(session)}><FaStar className="me-1"/>Leave Feedback</button>}
      </div>
    </div>
  );
};

// ─── Feedback Modal ───────────────────────────────────────────
const FeedbackModal = ({ session, onClose, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div style={{ background: '#fff', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 400 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-4"><h5 className="fw-bold mb-0">Rate Your Experience</h5><button className="btn btn-sm btn-link text-muted p-0" onClick={onClose}><FaTimes/></button></div>
        <div className="text-center mb-4">
          <div className="fw-semibold mb-2">How helpful was {session?.mentorId?.name}?</div>
          <div className="d-flex justify-content-center gap-2">{[1,2,3,4,5].map(n => <span key={n} style={{ cursor: 'pointer', fontSize: 28 }} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>{n <= (hover || rating) ? '⭐' : '☆'}</span>)}</div>
          {rating > 0 && <p className="text-muted mt-2 small">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</p>}
        </div>
        <div className="mb-4"><label className="form-label small fw-semibold">Comment <span className="text-muted fw-normal">(optional)</span></label><textarea className="form-control" rows={3} maxLength={500} placeholder="What did you learn?" value={comment} onChange={e => setComment(e.target.value)}/></div>
        <div className="d-flex gap-2"><button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={onClose}>Cancel</button><button className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ background: '#f5a623', color: '#fff' }} onClick={() => onSubmit({ rating, comment })} disabled={loading || rating === 0}>{loading ? <ClipLoader size={14} color="#fff"/> : <><FaStar/>Submit</>}</button></div>
      </motion.div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
const Mentorship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?._id || user?.id;
  const [activeTab, setActiveTab] = useState('discover');
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [domainFilter, setDomainFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [incomingReqs, setIncomingReqs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [myMentorProfile, setMyMentorProfile] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [notesTarget, setNotesTarget] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const fetchMentors = useCallback(() => {
    setLoadingMentors(true);
    const params = { available: 'true' };
    if (domainFilter !== 'all') params.domain = domainFilter;
    if (deptFilter !== 'all') params.department = deptFilter;
    if (search.trim()) params.search = search.trim();
    mentorshipService.getMentors(params).then(res => setMentors(res.data.data || [])).catch(() => toast.error('Failed to load mentors.')).finally(() => setLoadingMentors(false));
  }, [domainFilter, deptFilter, search]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const fetchPersonalData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [sessRes, reqRes, inRes, mpRes] = await Promise.allSettled([
        mentorshipService.getMySessions(),
        mentorshipService.getMyRequests(),
        mentorshipService.getIncomingRequests(),
        mentorshipService.getMyMentorProfile(),
      ]);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data.data || []);
      if (reqRes.status === 'fulfilled') setMyRequests(reqRes.value.data.data || []);
      if (inRes.status === 'fulfilled') setIncomingReqs(inRes.value.data.data || []);
      if (mpRes.status === 'fulfilled') setMyMentorProfile(mpRes.value.data.data);
    } catch (_) {}
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { fetchPersonalData(); }, [fetchPersonalData]);

  const handleSendRequest = async ({ topic, message }) => {
    setReqLoading(true);
    try { await mentorshipService.sendRequest({ mentorId: requestTarget._id, topic, message }); toast.success('Request sent! 🙌'); setRequestTarget(null); fetchPersonalData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setReqLoading(false); }
  };
  const handleAccept = async req => { try { await mentorshipService.acceptRequest(req._id); toast.success('Accepted! Session started.'); fetchPersonalData(); } catch(e) { toast.error(e.response?.data?.message || 'Failed.'); } };
  const handleReject = async req => { try { await mentorshipService.rejectRequest(req._id); toast.success('Declined.'); fetchPersonalData(); } catch(_) { toast.error('Failed.'); } };
  const handleComplete = async s => { try { await mentorshipService.completeSession(s._id, { notes: s.notes }); toast.success('Completed! ✅'); fetchPersonalData(); } catch(_) { toast.error('Failed.'); } };
  const handleFeedback = async ({ rating, comment }) => { setFeedbackLoading(true); try { await mentorshipService.submitFeedback(feedbackTarget._id, { rating, comment }); toast.success('Feedback submitted! 🌟'); setFeedbackTarget(null); fetchPersonalData(); } catch(e) { toast.error(e.response?.data?.message || 'Failed.'); } finally { setFeedbackLoading(false); } };
  const handleSaveNotes = async () => { setNotesSaving(true); try { await mentorshipService.updateNotes(notesTarget._id, { notes: notesText }); toast.success('Notes saved.'); setNotesTarget(null); fetchPersonalData(); } catch(_) { toast.error('Failed.'); } finally { setNotesSaving(false); } };
  const openChat = chatId => navigate(`/messages/${chatId}`);

  const mentorSessions = sessions.filter(s => s.mentorId?._id?.toString() === uid?.toString());
  const menteeSessions = sessions.filter(s => s.menteeId?._id?.toString() === uid?.toString());

  const TABS = [
    { key: 'discover', label: 'Discover', icon: <FaSearch className="me-1" size={12}/> },
    { key: 'mentors', label: 'My Mentors', icon: <FaHandsHelping className="me-1" size={12}/>, count: menteeSessions.filter(s => s.status === 'active').length },
    { key: 'mentees', label: 'My Mentees', icon: <FaUsers className="me-1" size={12}/>, count: mentorSessions.filter(s => s.status === 'active').length },
    { key: 'requests', label: 'Requests', icon: <FaGraduationCap className="me-1" size={12}/>, count: incomingReqs.length + myRequests.filter(r => r.status === 'pending').length },
  ];

  const renderSessionList = (list, emptyMsg) => {
    if (loadingData) return <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={32}/></div>;
    if (list.length === 0) return <div className="text-center py-5 text-muted"><FaHandsHelping size={40} className="mb-3 opacity-25"/><p>{emptyMsg}</p></div>;
    const active = list.filter(s => s.status === 'active'), completed = list.filter(s => s.status === 'completed');
    return <>
      {active.length > 0 && <><h6 className="fw-bold mb-3 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Active Sessions</h6>{active.map(s => <SessionCard key={s._id} session={s} currentUserId={uid} onComplete={handleComplete} onFeedback={setFeedbackTarget} onNotesEdit={s => { setNotesTarget(s); setNotesText(s.notes || ''); }} onChat={openChat}/>)}</>}
      {completed.length > 0 && <><h6 className="fw-bold mb-3 mt-4 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Completed</h6>{completed.map(s => <SessionCard key={s._id} session={s} currentUserId={uid} onComplete={handleComplete} onFeedback={setFeedbackTarget} onNotesEdit={s => { setNotesTarget(s); setNotesText(s.notes || ''); }} onChat={openChat}/>)}</>}
    </>;
  };

  return (
    <div className="dashboard-main-bg min-vh-100 py-4">
      <Toaster position="top-center"/>
      <div className="container-fluid px-3 px-lg-4" style={{ maxWidth: 1200 }}>
        <motion.div className="rounded-4 mb-4 px-4 py-3 d-flex align-items-center gap-3 flex-wrap" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff' }} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
          <FaHandsHelping size={32} style={{ color: '#f5a623' }}/>
          <div><div className="fw-bold" style={{ fontSize: 19 }}>Mentorship Hub</div><div style={{ fontSize: 13, opacity: 0.7 }}>Connect, learn, and grow — everyone can be a mentor and a mentee</div></div>
        </motion.div>
        <div className="row g-4">
          <div className="col-lg-8">
            <BecomeMentorPanel profile={myMentorProfile} onSaved={p => setMyMentorProfile(p)}/>
            <div className="bg-white rounded-4 p-1 shadow-sm mb-4 d-flex gap-1 w-100 flex-wrap">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className="btn rounded-3 flex-grow-1 d-flex align-items-center justify-content-center fw-semibold" style={{ fontSize: 12, height: 38, background: activeTab === t.key ? MAMCET_RED : 'transparent', color: activeTab === t.key ? '#fff' : '#666' }}>
                  {t.icon}{t.label}
                  {t.count > 0 && <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: 9 }}>{t.count}</span>}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'discover' && (
                <motion.div key="discover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                  <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
                    <div className="d-flex gap-2 flex-wrap">
                      <div className="position-relative flex-grow-1"><FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: 13 }}/><input type="text" className="form-control ps-4" placeholder="Search mentors..." value={search} onChange={e => setSearch(e.target.value)} style={{ borderRadius: 20, fontSize: 13 }}/></div>
                      <button className={`btn btn-sm rounded-pill d-flex align-items-center gap-1 ${showFilters ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setShowFilters(f => !f)} style={{ fontSize: 12 }}><FaFilter size={11}/>Filters</button>
                    </div>
                    {showFilters && <div className="row g-2 mt-2"><div className="col-md-6"><select className="form-select form-select-sm" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>{DOMAINS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Domains' : d}</option>)}</select></div><div className="col-md-6"><select className="form-select form-select-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}</select></div></div>}
                  </div>
                  {loadingMentors ? <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={36}/></div> : mentors.length === 0 ? <div className="text-center py-5 text-muted"><FaHandsHelping size={40} className="mb-3 opacity-25"/><p>No mentors found.</p></div> : <div className="row g-3">{mentors.map(m => <div key={m._id} className="col-md-6"><MentorCard mentor={m} myRequests={myRequests} onRequest={setRequestTarget} canRequest={true}/></div>)}</div>}
                </motion.div>
              )}
              {activeTab === 'mentors' && <motion.div key="mentors" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>{renderSessionList(menteeSessions, 'No mentors yet. Discover mentors and send a request!')}</motion.div>}
              {activeTab === 'mentees' && <motion.div key="mentees" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>{renderSessionList(mentorSessions, 'No mentees yet. Set up your mentor profile to start receiving requests.')}</motion.div>}
              {activeTab === 'requests' && (
                <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>
                  {loadingData ? <div className="text-center py-5"><ClipLoader color={MAMCET_RED} size={32}/></div> : <>
                    {incomingReqs.length > 0 && <><h6 className="fw-bold mb-3 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Incoming Requests (as Mentor)</h6>
                      {incomingReqs.map(req => (
                        <div key={req._id} className="bg-white rounded-4 shadow-sm p-3 mb-3" style={{ border: '1px solid #f0f0f0' }}>
                          <div className="d-flex gap-3 align-items-start mb-3"><Avatar user={req.menteeId} size={44}/><div className="flex-grow-1"><div className="fw-bold">{req.menteeId?.name} <RoleBadge role={req.menteeId?.role}/></div><div className="text-muted" style={{ fontSize: 12 }}>{req.menteeId?.department} • Batch {req.menteeId?.batch}</div>{req.topic && <div className="mt-1 fw-semibold" style={{ fontSize: 13 }}>Topic: {req.topic}</div>}</div></div>
                          {req.message && <div className="p-2 rounded-3 mb-3" style={{ background: '#f8f9fa', fontSize: 13 }}>"{req.message}"</div>}
                          <div className="d-flex gap-2"><button className="btn btn-sm rounded-pill fw-bold d-flex align-items-center gap-1" style={{ background: MENTOR_GREEN, color: '#fff' }} onClick={() => handleAccept(req)}><FaCheck size={11}/>Accept</button><button className="btn btn-sm btn-outline-danger rounded-pill fw-bold d-flex align-items-center gap-1" onClick={() => handleReject(req)}><FaTimes size={11}/>Decline</button></div>
                        </div>
                      ))}
                    </>}
                    {myRequests.length > 0 && <><h6 className="fw-bold mb-3 mt-4 text-muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>My Outgoing Requests (as Mentee)</h6>
                      {myRequests.map(req => (
                        <div key={req._id} className="bg-white rounded-4 shadow-sm p-3 mb-3 d-flex gap-3 align-items-center" style={{ border: '1px solid #f0f0f0' }}>
                          <Avatar user={req.mentorId} size={44}/><div className="flex-grow-1"><div className="fw-bold">{req.mentorId?.name}</div><div className="text-muted" style={{ fontSize: 12 }}>{req.mentorId?.company || req.mentorId?.department}</div>{req.topic && <div className="text-muted" style={{ fontSize: 12 }}>Topic: <strong>{req.topic}</strong></div>}</div>
                          <span className="badge rounded-pill px-3 py-2" style={{ background: req.status === 'accepted' ? '#d4edda' : req.status === 'rejected' ? '#f8d7da' : '#fff3cd', color: req.status === 'accepted' ? '#155724' : req.status === 'rejected' ? '#721c24' : '#856404', fontSize: 12 }}>{req.status === 'accepted' ? '✅ Accepted' : req.status === 'rejected' ? '❌ Declined' : '⏳ Pending'}</span>
                        </div>
                      ))}
                    </>}
                    {incomingReqs.length === 0 && myRequests.length === 0 && <div className="text-center py-5 text-muted"><FaGraduationCap size={40} className="mb-3 opacity-25"/><p>No requests yet.</p></div>}
                  </>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="col-lg-4">
            <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-3" style={{ color: MAMCET_RED, fontSize: 13 }}><FaGraduationCap className="me-2"/>Your Stats</h6>
              {[{ label: 'Active as Mentee', value: menteeSessions.filter(s => s.status === 'active').length, color: '#378fe9' },
                { label: 'Active as Mentor', value: mentorSessions.filter(s => s.status === 'active').length, color: MENTOR_GREEN },
                { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, color: '#6b7280' },
                { label: 'Pending Requests', value: incomingReqs.length + myRequests.filter(r => r.status === 'pending').length, color: '#f5a623' },
              ].map(s => <div key={s.label} className="d-flex align-items-center justify-content-between py-2 border-bottom"><span className="text-muted" style={{ fontSize: 13 }}>{s.label}</span><span className="fw-bold" style={{ color: s.color, fontSize: 16 }}>{s.value}</span></div>)}
              {myMentorProfile?.avgRating > 0 && <div className="d-flex align-items-center justify-content-between py-2"><span className="text-muted" style={{ fontSize: 13 }}>Your Rating</span><div className="d-flex align-items-center gap-1"><Stars rating={myMentorProfile.avgRating} size={12}/><span className="fw-bold" style={{ fontSize: 13 }}>{myMentorProfile.avgRating}</span></div></div>}
            </div>
            <div className="bg-white rounded-4 shadow-sm p-4" style={{ border: `2px solid ${MAMCET_RED}15` }}>
              <h6 className="fw-bold mb-3" style={{ color: MAMCET_RED, fontSize: 13 }}>How It Works</h6>
              {[{ icon: '🔍', title: 'Discover', desc: 'Find mentors by domain, dept, or company' },
                { icon: '📩', title: 'Request', desc: 'Send a request with your topic' },
                { icon: '✅', title: 'Connect', desc: 'Once accepted, a chat session starts' },
                { icon: '💬', title: 'Chat', desc: 'Share text, images, and resources' },
                { icon: '⭐', title: 'Rate', desc: 'Leave feedback after the session' },
              ].map((s, i) => <div key={i} className="d-flex gap-3 mb-3"><div style={{ width: 32, height: 32, borderRadius: '50%', background: `${MAMCET_RED}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{s.icon}</div><div><div className="fw-semibold" style={{ fontSize: 13 }}>{s.title}</div><div className="text-muted" style={{ fontSize: 12 }}>{s.desc}</div></div></div>)}
            </div>
          </div>
        </div>
      </div>
      {requestTarget && <RequestModal mentor={requestTarget} onClose={() => setRequestTarget(null)} onSubmit={handleSendRequest} loading={reqLoading}/>}
      {feedbackTarget && <FeedbackModal session={feedbackTarget} onClose={() => setFeedbackTarget(null)} onSubmit={handleFeedback} loading={feedbackLoading}/>}
      {notesTarget && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}><motion.div style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 440 }} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><div className="d-flex justify-content-between align-items-center mb-3"><h5 className="fw-bold mb-0">Session Notes</h5><button className="btn btn-sm btn-link text-muted p-0" onClick={() => setNotesTarget(null)}><FaTimes/></button></div><textarea className="form-control mb-3" rows={5} placeholder="Add notes, steps, resources..." value={notesText} onChange={e => setNotesText(e.target.value)}/><div className="d-flex gap-2"><button className="btn btn-outline-secondary rounded-pill flex-grow-1" onClick={() => setNotesTarget(null)}>Cancel</button><button className="btn rounded-pill fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-2" style={{ background: MENTOR_GREEN, color: '#fff' }} onClick={handleSaveNotes} disabled={notesSaving}>{notesSaving ? <ClipLoader size={14} color="#fff"/> : <><FaSave size={12}/>Save</>}</button></div></motion.div></div>}
    </div>
  );
};

export default Mentorship;
