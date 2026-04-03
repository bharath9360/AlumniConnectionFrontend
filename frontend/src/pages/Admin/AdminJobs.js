import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jobService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
  FiSearch, FiX, FiCheck, FiAlertTriangle, FiChevronLeft,
  FiChevronRight, FiUsers, FiMapPin, FiClock, FiDollarSign,
  FiInfo, FiCheckCircle, FiXCircle, FiEye,
} from 'react-icons/fi';

/* ── Avatar colour ─────────────────────────────────────────────── */
const COLORS = ['#c84022','#14b8a6','#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899','#6366f1'];
const ac = (n = '') => COLORS[(n.charCodeAt(0) || 0) % COLORS.length];

/* ── Toast hook ─────────────────────────────────────────────────── */
let _tid = 0;
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_tid;
    set(t => [...t, { id, msg, type }]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, add };
};

/* ── Constants ──────────────────────────────────────────────────── */
const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];
const EMPTY_FORM = {
  title: '', company: '', location: '', type: 'Full-time',
  department: '', experience: '', salary: '', description: '', skills: '', status: 'Approved'
};
const ACCENT = '#c84022';

/* ══════════════════════════════════════════════════════════════════
   TYPE BADGE
══════════════════════════════════════════════════════════════════ */
const TypeBadge = ({ type }) => {
  const map = {
    'Full-time': '#10b981', 'Part-time': '#6366f1',
    'Internship': '#f59e0b', 'Contract': '#8b5cf6', 'Remote': '#3b82f6'
  };
  const c = map[type] || '#6366f1';
  return (
    <span style={{ background: `${c}18`, color: c, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {type}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════
   JOB FORM MODAL
══════════════════════════════════════════════════════════════════ */
const JobFormModal = ({ job, onClose, onSave, saving }) => {
  const [form, setForm] = useState(job
    ? { ...job, skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || '') }
    : EMPTY_FORM
  );
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!job;

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title">
            {isEdit
              ? <><FiEdit2 size={14} color={ACCENT} /> Edit Job</>
              : <><FiPlus size={14} color="#10b981" /> Create Job</>}
          </span>
          <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="am-modal-body">
          <div className="am-field-grid">
            <div className="am-field">
              <label>Job Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer" />
            </div>
            <div className="am-field">
              <label>Company *</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. Google" />
            </div>
            <div className="am-field">
              <label>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Chennai / Remote" />
            </div>
            <div className="am-field">
              <label>Job Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="am-field">
              <label>Experience</label>
              <input value={form.experience} onChange={e => set('experience', e.target.value)} placeholder="e.g. 2–4 years" />
            </div>
            <div className="am-field">
              <label>Salary / Stipend</label>
              <input value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="e.g. ₹6–10 LPA" />
            </div>
            <div className="am-field am-field-full">
              <label>Skills <span style={{ fontWeight: 400, color: '#aaa' }}>(comma-separated)</span></label>
              <input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="e.g. React, Node.js, MongoDB" />
            </div>
            <div className="am-field am-field-full">
              <label>Description</label>
              <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Role responsibilities, requirements…" style={{ resize: 'vertical', width: '100%', padding: '9px 12px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontFamily: 'inherit', fontSize: 13.5, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }} />
            </div>
            <div className="am-field">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="Approved">Approved (Published)</option>
                <option value="Pending">Pending (Hidden)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="am-modal-footer">
          <button className="am-btn am-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="am-btn am-btn-primary"
            style={{ background: ACCENT, border: `1px solid ${ACCENT}` }}
            onClick={() => onSave(form)}
            disabled={saving || !form.title.trim() || !form.company.trim()}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : <><FiCheck size={14} /> {isEdit ? 'Save Changes' : 'Create Job'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   APPLICANTS MODAL
══════════════════════════════════════════════════════════════════ */
const ApplicantsModal = ({ job, onClose }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobService.getApplicants(job._id)
      .then(r => setApplicants(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [job._id]);

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title">
            <FiUsers size={14} color="#6366f1" /> Applicants — "{job.title}"
          </span>
          <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="am-modal-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><ClipLoader color="#6366f1" size={28} /></div>
          ) : applicants.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '32px 0' }}>
              <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />No applicants yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {applicants.map((u, i) => (
                <div key={i} className="ajd-applicant-row">
                  <div className="ajd-applicant-avatar" style={{ background: ac(u.name || '') }}>
                    {u.profilePic
                      ? <img src={u.profilePic} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (u.name || '?')[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ background: `${ac(u.role || '')}18`, color: ac(u.role || ''), borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                    {u.department && <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{u.department}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="am-modal-footer">
          <div style={{ fontSize: 12, color: '#aaa' }}>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</div>
          <button className="am-btn am-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════════════════════════════════ */
const DeleteConfirm = ({ label, onClose, onConfirm, saving }) => (
  <div className="am-modal-backdrop" onClick={onClose}>
    <div className="am-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
      <div className="am-confirm-body">
        <div className="am-confirm-icon"><FiTrash2 size={26} /></div>
        <div className="am-confirm-title">Delete Job?</div>
        <div className="am-confirm-sub">
          This will permanently remove <strong>"{label}"</strong>. This action cannot be undone.
        </div>
      </div>
      <div className="am-modal-footer" style={{ justifyContent: 'center' }}>
        <button className="am-btn am-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="am-btn am-btn-danger" onClick={onConfirm} disabled={saving}>
          {saving ? <ClipLoader size={13} color="#fff" /> : <><FiTrash2 size={13} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   JOB ROW — Table row (desktop)
══════════════════════════════════════════════════════════════════ */
const JobRow = ({ job, onEdit, onDelete, onApplicants, onApprove, onReject, isPending }) => (
  <tr>
    {/* Job title + company + skills */}
    <td>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 2 }}>{job.title}</div>
      <div style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <FiBriefcase size={11} /> {job.company}
      </div>
      {job.skills?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {job.skills.slice(0, 3).map(s => (
            <span key={s} style={{ background: '#f0f0f0', color: '#555', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{s}</span>
          ))}
          {job.skills.length > 3 && <span style={{ fontSize: 10, color: '#aaa' }}>+{job.skills.length - 3}</span>}
        </div>
      )}
    </td>
    {/* Type + Location */}
    <td>
      <TypeBadge type={job.type} />
      {job.location && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <FiMapPin size={11} /> {job.location}
        </div>
      )}
    </td>
    {/* Salary + Exp */}
    <td>
      <span style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>
        {job.salary || <span style={{ color: '#ccc' }}>—</span>}
      </span>
      {job.experience && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{job.experience}</div>}
    </td>
    {/* Posted by + date */}
    <td>
      <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{job.postedBy?.name || job.postedByName || '—'}</div>
      <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </td>
    {/* Applicants */}
    <td>
      <button
        onClick={() => onApplicants(job)}
        className="ajd-applicants-btn"
        title="View Applicants"
      >
        <FiUsers size={12} /> {job.appliedBy?.length || 0}
      </button>
    </td>
    {/* Actions */}
    <td>
      <div className="am-actions">
        {isPending ? (
          <>
            <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(job)}>
              <FiCheckCircle size={13} />
            </button>
            <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onDelete(job)}>
              <FiXCircle size={13} />
            </button>
          </>
        ) : (
          <>
            <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(job)}>
              <FiEdit2 size={13} />
            </button>
            <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(job)}>
              <FiTrash2 size={13} />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);

/* ══════════════════════════════════════════════════════════════════
   JOB CARD — Mobile card view
══════════════════════════════════════════════════════════════════ */
const JobCard = ({ job, onEdit, onDelete, onApplicants, onApprove, onReject, isPending }) => (
  <div className="ajd-mobile-card">
    <div className="ajd-mobile-card-header">
      <div style={{ flex: 1 }}>
        <div className="ajd-mobile-card-title">{job.title}</div>
        <div className="ajd-mobile-card-sub"><FiBriefcase size={11} style={{ marginRight: 4 }} />{job.company}</div>
      </div>
      <TypeBadge type={job.type} />
    </div>

    <div className="ajd-mobile-card-meta">
      {job.location && <span><FiMapPin size={11} /> {job.location}</span>}
      {job.salary && <span><FiDollarSign size={11} /> {job.salary}</span>}
      {job.experience && <span><FiClock size={11} /> {job.experience}</span>}
    </div>

    {job.skills?.length > 0 && (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {job.skills.slice(0, 4).map(s => (
          <span key={s} style={{ background: '#f0f0f0', color: '#555', borderRadius: 4, padding: '2px 7px', fontSize: 10.5 }}>{s}</span>
        ))}
        {job.skills.length > 4 && <span style={{ fontSize: 10.5, color: '#aaa' }}>+{job.skills.length - 4}</span>}
      </div>
    )}

    <div className="ajd-mobile-card-footer">
      <div style={{ fontSize: 11.5, color: '#888' }}>
        By {job.postedBy?.name || job.postedByName || '—'} •{' '}
        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
      </div>
      <div className="am-actions">
        <button className="ajd-applicants-btn" onClick={() => onApplicants(job)} title="View Applicants">
          <FiUsers size={12} /> {job.appliedBy?.length || 0}
        </button>
        {isPending ? (
          <>
            <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(job)}><FiCheckCircle size={13} /></button>
            <button className="am-btn-icon am-btn-icon-reject" title="Reject" onClick={() => onDelete(job)}><FiXCircle size={13} /></button>
          </>
        ) : (
          <>
            <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(job)}><FiEdit2 size={13} /></button>
            <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(job)}><FiTrash2 size={13} /></button>
          </>
        )}
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AdminJobs = () => {
  /* ── Tab state ─────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('pending');  // 'pending' | 'approved'

  /* ── Data ──────────────────────────────────────────────────── */
  const [jobs,       setJobs]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* ── Filters ───────────────────────────────────────────────── */
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [page,        setPage]        = useState(1);

  /* ── Modals ────────────────────────────────────────────────── */
  const [createOpen,    setCreateOpen]    = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [applicantsJob, setApplicantsJob] = useState(null);

  /* ── Saving states ─────────────────────────────────────────── */
  const [createSaving, setCreateSaving] = useState(false);
  const [editSaving,   setEditSaving]   = useState(false);
  const [delSaving,    setDelSaving]    = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const { toasts, add: toast } = useToast();
  const timerRef = useRef(null);

  const handleSearchInput = val => {
    setSearchInput(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  // Switch tab → reset
  const switchTab = tab => {
    setActiveTab(tab);
    setSearch(''); setSearchInput('');
    setTypeFilter(''); setPage(1);
  };

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchJobs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const statusParam = activeTab === 'pending' ? 'Pending' : 'Approved';
      const res = await jobService.adminGetAll({
        search, type: typeFilter, status: statusParam, page, limit: 12
      });
      setJobs(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load jobs.';
      setError(msg); toast(msg, 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, typeFilter, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  /* ── Create ────────────────────────────────────────────────── */
  const handleCreate = async (form) => {
    setCreateSaving(true);
    try {
      await jobService.createJob(form);
      toast('✅ Job created!', 'success');
      setCreateOpen(false);
      fetchJobs();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create job.', 'error');
    } finally { setCreateSaving(false); }
  };

  /* ── Edit ──────────────────────────────────────────────────── */
  const handleEdit = async (form) => {
    setEditSaving(true);
    try {
      const res = await jobService.editJob(editTarget._id, form);
      setJobs(prev => prev.map(j => j._id === editTarget._id ? res.data.data : j));
      toast('✅ Job updated!', 'success');
      setEditTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setEditSaving(false); }
  };

  /* ── Delete / Reject ───────────────────────────────────────── */
  const handleDelete = async () => {
    setDelSaving(true);
    try {
      await jobService.deleteJob(deleteTarget._id);
      setJobs(prev => prev.filter(j => j._id !== deleteTarget._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast('🗑️ Job removed.', 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setDelSaving(false); }
  };

  /* ── Approve ───────────────────────────────────────────────── */
  const handleApprove = async (job) => {
    setActionLoading(p => ({ ...p, [job._id]: 'approving' }));
    try {
      await jobService.approveJob(job._id);
      setJobs(prev => prev.filter(j => j._id !== job._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast('✅ Job approved & published!', 'success');
    } catch {
      toast('Approve failed.', 'error');
    } finally { setActionLoading(p => ({ ...p, [job._id]: null })); }
  };

  /* ── Pagination helpers ────────────────────────────────────── */
  const getPages = () => {
    const { totalPages } = pagination;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p = pagination.page;
    return [...new Set([1, totalPages, p, p - 1, p + 1])].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Job Management</div>
          <div className="ap-section-sub">Review pending submissions, manage published job postings, and view applicants.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="am-btn am-btn-ghost" onClick={fetchJobs} title="Refresh">
            <FiRefreshCw size={13} />
          </button>
          <button
            className="am-btn am-btn-primary"
            style={{ background: ACCENT, border: `1px solid ${ACCENT}`, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setCreateOpen(true)}
          >
            <FiPlus size={14} /> Create Job
          </button>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────── */}
      <div className="ajd-tab-bar">
        {[
          { key: 'pending',  label: 'Pending Approvals',  icon: <FiClock size={14} /> },
          { key: 'approved', label: 'Published Jobs',     icon: <FiCheckCircle size={14} /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            className={`ajd-tab${activeTab === key ? ' ajd-tab-active' : ''}`}
            onClick={() => switchTab(key)}
          >
            {icon} {label}
            {activeTab === key && pagination.total > 0 && (
              <span className="ajd-tab-count">{pagination.total}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Pending info banner ──────────────────────────────── */}
      {activeTab === 'pending' && (
        <div className="ajd-info-banner">
          <FiInfo size={14} />
          <span>These jobs were submitted by alumni and are awaiting your approval before being published to students.</span>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="am-toolbar">
        <div className="am-search-wrap" style={{ flex: 1, maxWidth: 340 }}>
          <FiSearch size={14} className="am-search-icon" />
          <input
            className="am-search-input"
            placeholder="Search jobs, companies…"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
          />
        </div>
        <select className="am-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || typeFilter) && (
          <button className="am-btn am-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setTypeFilter(''); setPage(1); }}>
            <FiX size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="ajd-error-banner">
          <FiAlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
          <ClipLoader color={ACCENT} size={38} />
        </div>
      ) : jobs.length === 0 ? (
        <div className="am-empty">
          <div className="am-empty-icon">{activeTab === 'pending' ? '⏳' : '💼'}</div>
          <div className="am-empty-title">
            {activeTab === 'pending' ? 'No pending jobs' : 'No published jobs'}
          </div>
          <div className="am-empty-sub">
            {search || typeFilter
              ? 'Try adjusting your filters.'
              : activeTab === 'pending'
                ? 'No jobs are awaiting approval right now.'
                : 'Click "Create Job" to post the first job.'}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="am-table-wrap ajd-desktop-table">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Type / Location</th>
                  <th>Salary</th>
                  <th>Posted By</th>
                  <th>Applicants</th>
                  <th>{activeTab === 'pending' ? 'Decision' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <JobRow
                    key={job._id}
                    job={job}
                    isPending={activeTab === 'pending'}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onApplicants={setApplicantsJob}
                    onApprove={handleApprove}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="ajd-mobile-cards">
            {jobs.map(job => (
              <JobCard
                key={job._id}
                job={job}
                isPending={activeTab === 'pending'}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onApplicants={setApplicantsJob}
                onApprove={handleApprove}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="am-pagination">
            <span className="am-page-info">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="am-page-btns">
              <button className="am-page-btn" onClick={() => setPage(p => p - 1)} disabled={pagination.page <= 1}>
                <FiChevronLeft size={14} />
              </button>
              {getPages().map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: '#bbb', fontSize: 13 }}>…</span>}
                  <button
                    className={`am-page-btn${n === pagination.page ? ' am-page-btn-active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
              <button className="am-page-btn" onClick={() => setPage(p => p + 1)} disabled={pagination.page >= pagination.totalPages}>
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ MODALS ══ */}
      {createOpen   && <JobFormModal job={null}       onClose={() => setCreateOpen(false)} onSave={handleCreate} saving={createSaving} />}
      {editTarget   && <JobFormModal job={editTarget} onClose={() => setEditTarget(null)}  onSave={handleEdit}   saving={editSaving}   />}
      {deleteTarget && (
        <DeleteConfirm
          label={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          saving={delSaving}
        />
      )}
      {applicantsJob && <ApplicantsModal job={applicantsJob} onClose={() => setApplicantsJob(null)} />}

      {/* Toasts */}
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

export default AdminJobs;
