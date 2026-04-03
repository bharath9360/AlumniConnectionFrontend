import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService, jobService, eventService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiCheck, FiX, FiUser, FiBriefcase, FiCalendar,
  FiRefreshCw, FiAlertTriangle, FiInfo, FiMail,
  FiMapPin, FiTag, FiUsers,
} from 'react-icons/fi';

/* ── Inline toast (matches all other admin panels) ──────────── */
let _tid = 0;
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_tid;
    set(t => [...t, { id, msg, type }]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  return { toasts, add };
};

/* ── Avatar colour ──────────────────────────────────────────── */
const COLORS = ['#6366f1','#14b8a6','#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899','#c84022'];
const ac = (n = '') => COLORS[(n.charCodeAt(0) || 0) % COLORS.length];

/* ── Empty state ────────────────────────────────────────────── */
const Empty = ({ icon, msg }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '48px 32px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
    <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 4 }}>All clear!</div>
    <div style={{ fontSize: 13, color: '#aaa' }}>{msg}</div>
  </div>
);

/* ── Action buttons ─────────────────────────────────────────── */
const ActionBtn = ({ onClick, disabled, variant, children }) => {
  const styles = {
    approve: { bg: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)', hover: '#059669' },
    reject:  { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.15)', hover: '#dc2626' },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: s.bg, color: s.color, border: s.border, fontSize: 12.5, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
    >
      {children}
    </button>
  );
};

/* ── Alumni Card ────────────────────────────────────────────── */
const AlumniCard = ({ u, actionId, onApprove, onReject }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, opacity: actionId === u._id ? 0.65 : 1, transition: 'opacity 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
    <div style={{ width: 46, height: 46, borderRadius: '50%', background: ac(u.name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17, flexShrink: 0, overflow: 'hidden' }}>
      {u.profilePic ? <img src={u.profilePic} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (u.name || '?')[0].toUpperCase()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e', marginBottom: 3 }}>
        <Link to={`/profile/${u._id}`} style={{ color: '#1a1a2e', textDecoration: 'none' }}>{u.name}</Link>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#888' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiMail size={11} />{u.email}</span>
        {u.department && <span>🏛 {u.department}</span>}
        {u.batch && <span>📅 Batch {u.batch}</span>}
        {u.presentStatus && <span>💼 {u.presentStatus}</span>}
      </div>
      {u.company && <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>@ {u.company}{u.designation ? ` · ${u.designation}` : ''}</div>}
    </div>
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <ActionBtn onClick={onApprove} disabled={actionId === u._id} variant="approve">
        {actionId === u._id ? <ClipLoader size={12} color="#059669" /> : <FiCheck size={13} />}
        Approve
      </ActionBtn>
      <ActionBtn onClick={onReject} disabled={actionId === u._id} variant="reject">
        <FiX size={13} /> Reject
      </ActionBtn>
    </div>
  </div>
);

/* ── Job Card ───────────────────────────────────────────────── */
const JobCard = ({ j, actionId, onApprove, onReject }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px', opacity: actionId === j._id ? 0.65 : 1, transition: 'opacity 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1a1a2e', marginBottom: 4 }}>{j.title}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#888', marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>🏢 {j.company}</span>
          {j.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiMapPin size={11} />{j.location}</span>}
          {j.type && <span style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', borderRadius: 6, padding: '1px 7px', fontWeight: 700, textTransform: 'capitalize' }}>{j.type}</span>}
          {j.salary && <span>💰 {j.salary}</span>}
        </div>
        {j.description && <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.5 }}>{j.description.slice(0, 160)}{j.description.length > 160 ? '…' : ''}</div>}
        <div style={{ marginTop: 8, fontSize: 11.5, color: '#aaa' }}>
          Posted by: <Link to={`/profile/${j.postedBy?._id || j.postedBy}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>{j.postedBy?.name || j.postedByName}</Link>
          {j.postedBy?.role && <span> ({j.postedBy.role})</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
        <ActionBtn onClick={onApprove} disabled={actionId === j._id} variant="approve">
          {actionId === j._id ? <ClipLoader size={12} color="#059669" /> : <FiCheck size={13} />} Approve
        </ActionBtn>
        <ActionBtn onClick={onReject} disabled={actionId === j._id} variant="reject">
          <FiX size={13} /> Reject
        </ActionBtn>
      </div>
    </div>
  </div>
);

/* ── Event Card ─────────────────────────────────────────────── */
const EventCard = ({ e, actionId, onApprove, onReject }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f0f0f0', padding: '18px 20px', opacity: actionId === e._id ? 0.65 : 1, transition: 'opacity 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: '#1a1a2e', marginBottom: 4 }}>{e.title}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#888', marginBottom: 6 }}>
          <span>📅 {e.date}</span>
          {e.venue && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiMapPin size={11} />{e.venue}</span>}
          {e.category && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiTag size={11} />{e.category}</span>}
          {e.registeredBy?.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FiUsers size={11} />{e.registeredBy.length} registered</span>}
        </div>
        {e.description && <div style={{ fontSize: 12.5, color: '#666', lineHeight: 1.5 }}>{e.description.slice(0, 160)}{e.description.length > 160 ? '…' : ''}</div>}
        <div style={{ marginTop: 8, fontSize: 11.5, color: '#aaa' }}>
          Created by: <Link to={`/profile/${e.createdBy?._id || e.createdBy}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>{e.createdBy?.name}</Link>
          {e.createdBy?.role && <span> ({e.createdBy.role})</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
        <ActionBtn onClick={onApprove} disabled={actionId === e._id} variant="approve">
          {actionId === e._id ? <ClipLoader size={12} color="#059669" /> : <FiCheck size={13} />} Approve
        </ActionBtn>
        <ActionBtn onClick={onReject} disabled={actionId === e._id} variant="reject">
          <FiX size={13} /> Reject
        </ActionBtn>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const AdminApprovals = ({ defaultTab = 'alumni' }) => {
  const [activeTab,     setActiveTab]     = useState(defaultTab);
  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [pendingJobs,   setPendingJobs]   = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState(null);
  const { toasts, add: toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [a, j, e] = await Promise.all([
        adminService.getPendingAlumni(),
        jobService.getPendingJobs().catch(() => ({ data: { data: [] } })),
        eventService.getPendingEvents().catch(() => ({ data: { data: [] } })),
      ]);
      setPendingAlumni(a.data?.data || a.data || []);
      setPendingJobs(j.data?.data   || j.data || []);
      setPendingEvents(e.data?.data || e.data || []);
    } catch (err) {
      toast('Failed to load pending approvals.', 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* Alumni actions */
  const handleActivate = async (userId) => {
    setActionId(userId);
    try {
      await adminService.activateUser(userId);
      setPendingAlumni(prev => prev.filter(u => u._id !== userId));
      toast('✅ Alumni account activated! Email sent.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to activate.', 'error');
    } finally { setActionId(null); }
  };

  const handleRejectAlumni = async (userId) => {
    setActionId(userId);
    try {
      await adminService.rejectUser(userId);
      setPendingAlumni(prev => prev.filter(u => u._id !== userId));
      toast('Application rejected.', 'success');
    } catch (err) {
      toast('Failed to reject.', 'error');
    } finally { setActionId(null); }
  };

  /* Job actions */
  const handleApproveJob = async (jobId) => {
    setActionId(jobId);
    try {
      await jobService.approveJob(jobId);
      setPendingJobs(prev => prev.filter(j => j._id !== jobId));
      toast('✅ Job approved and published! Students notified.', 'success');
    } catch { toast('Failed to approve job.', 'error'); }
    finally { setActionId(null); }
  };

  const handleRejectJob = async (jobId) => {
    setActionId(jobId);
    try {
      await jobService.rejectJob(jobId);
      setPendingJobs(prev => prev.filter(j => j._id !== jobId));
      toast('Job rejected.', 'success');
    } catch { toast('Failed to reject job.', 'error'); }
    finally { setActionId(null); }
  };

  /* Event actions */
  const handleApproveEvent = async (eventId) => {
    setActionId(eventId);
    try {
      await eventService.approveEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      toast('✅ Event approved! Students notified.', 'success');
    } catch { toast('Failed to approve event.', 'error'); }
    finally { setActionId(null); }
  };

  const handleRejectEvent = async (eventId) => {
    setActionId(eventId);
    try {
      await eventService.rejectEvent(eventId);
      setPendingEvents(prev => prev.filter(e => e._id !== eventId));
      toast('Event rejected.', 'success');
    } catch { toast('Failed to reject event.', 'error'); }
    finally { setActionId(null); }
  };

  const totalPending = pendingAlumni.length + pendingJobs.length + pendingEvents.length;

  const TABS = [
    { key: 'alumni',  label: 'Alumni',  icon: FiUser,      count: pendingAlumni.length, color: '#c84022' },
    { key: 'jobs',    label: 'Jobs',    icon: FiBriefcase, count: pendingJobs.length,   color: '#6366f1' },
    { key: 'events',  label: 'Events',  icon: FiCalendar,  count: pendingEvents.length, color: '#10b981' },
  ];

  return (
    <div>
      {/* ── Header ──────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Approvals</div>
          <div className="ap-section-sub">
            Review and approve pending alumni registrations, job postings, and events.
            {totalPending > 0 && (
              <span style={{ marginLeft: 8, background: '#c84022', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                {totalPending} pending
              </span>
            )}
          </div>
        </div>
        <button onClick={fetchAll} disabled={loading} className="am-btn am-btn-ghost" style={{ fontSize: 12 }}>
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Tab bar ─────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#fff', borderRadius: 14, padding: 6, border: '1.5px solid #f0f0f0', width: 'fit-content', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: 'none', background: activeTab === t.key ? t.color : 'transparent', color: activeTab === t.key ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}
          >
            <t.icon size={14} />
            {t.label}
            {t.count > 0 && (
              <span style={{ background: activeTab === t.key ? 'rgba(255,255,255,0.3)' : t.color, color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 10.5, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <ClipLoader color="#6366f1" size={36} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* ALUMNI */}
          {activeTab === 'alumni' && (
            pendingAlumni.length === 0
              ? <Empty icon="👤" msg="No pending alumni registrations." />
              : pendingAlumni.map(u => (
                  <AlumniCard key={u._id} u={u} actionId={actionId}
                    onApprove={() => handleActivate(u._id)}
                    onReject={() => handleRejectAlumni(u._id)}
                  />
                ))
          )}

          {/* JOBS */}
          {activeTab === 'jobs' && (
            pendingJobs.length === 0
              ? <Empty icon="💼" msg="No pending job postings." />
              : pendingJobs.map(j => (
                  <JobCard key={j._id} j={j} actionId={actionId}
                    onApprove={() => handleApproveJob(j._id)}
                    onReject={() => handleRejectJob(j._id)}
                  />
                ))
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            pendingEvents.length === 0
              ? <Empty icon="📅" msg="No pending events." />
              : pendingEvents.map(e => (
                  <EventCard key={e._id} e={e} actionId={actionId}
                    onApprove={() => handleApproveEvent(e._id)}
                    onReject={() => handleRejectEvent(e._id)}
                  />
                ))
          )}
        </div>
      )}

      {/* ── Toast stack ─────────────────── */}
      <div className="am-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`am-toast am-toast-${t.type}`}>
            {t.type === 'success' && <FiCheck size={15} />}
            {t.type === 'error'   && <FiAlertTriangle size={15} />}
            {t.type === 'info'    && <FiInfo size={15} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovals;
