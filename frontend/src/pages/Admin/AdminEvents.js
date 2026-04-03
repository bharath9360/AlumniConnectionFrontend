import React, { useState, useEffect, useCallback, useRef } from 'react';
import { eventService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiRefreshCw,
  FiSearch, FiX, FiCheck, FiAlertTriangle, FiChevronLeft,
  FiChevronRight, FiUsers, FiMapPin, FiClock, FiCheckCircle,
  FiXCircle, FiInfo,
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
const CATEGORIES = ['Networking', 'Webinar', 'Reunion', 'Workshop', 'Seminar', 'Cultural', 'Tech Event'];
const CAT_COLORS = {
  Networking: '#6366f1', Webinar: '#14b8a6', Reunion: '#f59e0b',
  Workshop: '#10b981', Seminar: '#8b5cf6', Cultural: '#ec4899', 'Tech Event': '#3b82f6'
};
const EMPTY_FORM = { title: '', category: 'Networking', date: '', time: '', venue: '', desc: '', image: '', status: 'Approved' };
const ACCENT = '#c84022';

/* ══════════════════════════════════════════════════════════════════
   CATEGORY BADGE
══════════════════════════════════════════════════════════════════ */
const CatBadge = ({ cat }) => {
  const c = CAT_COLORS[cat] || '#6366f1';
  return (
    <span style={{ background: `${c}18`, color: c, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {cat}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════
   EVENT FORM MODAL
══════════════════════════════════════════════════════════════════ */
const EventFormModal = ({ event, onClose, onSave, saving }) => {
  const [form, setForm] = useState(event ? { ...event } : EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!event;

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title">
            {isEdit
              ? <><FiEdit2 size={14} color={ACCENT} /> Edit Event</>
              : <><FiPlus size={14} color="#8b5cf6" /> Create Event</>}
          </span>
          <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="am-modal-body">
          <div className="am-field-grid">
            <div className="am-field am-field-full">
              <label>Event Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Alumni Networking Night 2026" />
            </div>
            <div className="am-field">
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="am-field">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="Approved">Approved (Published)</option>
                <option value="Pending">Pending (Hidden)</option>
              </select>
            </div>
            <div className="am-field">
              <label>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
            <div className="am-field am-field-full">
              <label>Venue / Location</label>
              <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. MAMCET Auditorium / Online (Zoom)" />
            </div>
            <div className="am-field am-field-full">
              <label>Description</label>
              <textarea
                rows={4}
                value={form.desc}
                onChange={e => set('desc', e.target.value)}
                placeholder="Event details, agenda, speakers…"
                style={{ resize: 'vertical', width: '100%', padding: '9px 12px', border: '1.5px solid #e8e8e8', borderRadius: 9, fontFamily: 'inherit', fontSize: 13.5, outline: 'none', background: '#fafafa', boxSizing: 'border-box' }}
              />
            </div>
            <div className="am-field am-field-full">
              <label>Image URL <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
              <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>

        <div className="am-modal-footer">
          <button className="am-btn am-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="am-btn am-btn-primary"
            style={{ background: ACCENT, border: `1px solid ${ACCENT}` }}
            onClick={() => onSave(form)}
            disabled={saving || !form.title.trim() || !form.date}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : <><FiCheck size={14} /> {isEdit ? 'Save Changes' : 'Create Event'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ATTENDEES MODAL
══════════════════════════════════════════════════════════════════ */
const AttendeesModal = ({ event, onClose }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getAttendees(event._id)
      .then(r => setAttendees(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event._id]);

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title">
            <FiUsers size={14} color="#8b5cf6" /> Attendees — "{event.title}"
          </span>
          <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="am-modal-body" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><ClipLoader color="#8b5cf6" size={28} /></div>
          ) : attendees.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '32px 0' }}>
              <FiUsers size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />No registrations yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attendees.map((u, i) => (
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
                    {(u.batch || u.graduationYear) && (
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Batch {u.batch || u.graduationYear}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="am-modal-footer">
          <div style={{ fontSize: 12, color: '#aaa' }}>{attendees.length} registered</div>
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
        <div className="am-confirm-title">Delete Event?</div>
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
   EVENT ROW — Desktop table
══════════════════════════════════════════════════════════════════ */
const EventRow = ({ ev, onEdit, onDelete, onAttendees, onApprove, isPending }) => (
  <tr>
    {/* Event thumbnail + title */}
    <td>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {ev.image ? (
          <img src={ev.image} alt={ev.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 44, background: `${CAT_COLORS[ev.category] || '#6366f1'}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            📅
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e' }}>{ev.title}</div>
          {ev.desc && (
            <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ev.desc}
            </div>
          )}
        </div>
      </div>
    </td>
    {/* Category */}
    <td><CatBadge cat={ev.category} /></td>
    {/* Date + Venue */}
    <td>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: 4 }}>
        <FiCalendar size={11} /> {ev.date}{ev.time ? `, ${ev.time}` : ''}
      </div>
      {ev.venue && (
        <div style={{ fontSize: 11.5, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <FiMapPin size={11} /> {ev.venue}
        </div>
      )}
    </td>
    {/* Created by */}
    <td>
      <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>{ev.createdBy?.name || '—'}</div>
      <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
        {new Date(ev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </td>
    {/* Attendees */}
    <td>
      <button onClick={() => onAttendees(ev)} className="ajd-applicants-btn" title="View Attendees">
        <FiUsers size={12} /> {ev.registeredBy?.length || 0}
      </button>
    </td>
    {/* Actions */}
    <td>
      <div className="am-actions">
        {isPending ? (
          <>
            <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(ev)}>
              <FiCheckCircle size={13} />
            </button>
            <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onDelete(ev)}>
              <FiXCircle size={13} />
            </button>
          </>
        ) : (
          <>
            <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(ev)}>
              <FiEdit2 size={13} />
            </button>
            <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(ev)}>
              <FiTrash2 size={13} />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
);

/* ══════════════════════════════════════════════════════════════════
   EVENT CARD — Mobile card
══════════════════════════════════════════════════════════════════ */
const EventCard = ({ ev, onEdit, onDelete, onAttendees, onApprove, isPending }) => (
  <div className="ajd-mobile-card">
    {/* Image banner */}
    {ev.image && (
      <img src={ev.image} alt={ev.title} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '12px 12px 0 0', display: 'block' }} />
    )}
    <div style={{ padding: ev.image ? '12px 14px 14px' : '14px' }}>
      <div className="ajd-mobile-card-header" style={{ marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div className="ajd-mobile-card-title">{ev.title}</div>
        </div>
        <CatBadge cat={ev.category} />
      </div>

      <div className="ajd-mobile-card-meta">
        {ev.date && <span><FiCalendar size={11} /> {ev.date}{ev.time ? `, ${ev.time}` : ''}</span>}
        {ev.venue && <span><FiMapPin size={11} /> {ev.venue}</span>}
      </div>

      {ev.desc && (
        <p style={{ fontSize: 12, color: '#888', margin: '6px 0 10px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {ev.desc}
        </p>
      )}

      <div className="ajd-mobile-card-footer">
        <div style={{ fontSize: 11.5, color: '#888' }}>
          By {ev.createdBy?.name || '—'} •{' '}
          {new Date(ev.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
        <div className="am-actions">
          <button className="ajd-applicants-btn" onClick={() => onAttendees(ev)} title="View Attendees">
            <FiUsers size={12} /> {ev.registeredBy?.length || 0}
          </button>
          {isPending ? (
            <>
              <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(ev)}><FiCheckCircle size={13} /></button>
              <button className="am-btn-icon am-btn-icon-reject" title="Reject" onClick={() => onDelete(ev)}><FiXCircle size={13} /></button>
            </>
          ) : (
            <>
              <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(ev)}><FiEdit2 size={13} /></button>
              <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(ev)}><FiTrash2 size={13} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AdminEvents = () => {
  /* ── Tab state ─────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('pending');  // 'pending' | 'approved'

  /* ── Data ──────────────────────────────────────────────────── */
  const [events,     setEvents]     = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* ── Filters ───────────────────────────────────────────────── */
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [page,         setPage]         = useState(1);

  /* ── Modals ────────────────────────────────────────────────── */
  const [createOpen,   setCreateOpen]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attendeesEv,  setAttendeesEv]  = useState(null);

  /* ── Saving ────────────────────────────────────────────────── */
  const [createSaving, setCreateSaving] = useState(false);
  const [editSaving,   setEditSaving]   = useState(false);
  const [delSaving,    setDelSaving]    = useState(false);

  const { toasts, add: toast } = useToast();
  const timerRef = useRef(null);

  const handleSearchInput = val => {
    setSearchInput(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  const switchTab = tab => {
    setActiveTab(tab);
    setSearch(''); setSearchInput('');
    setCatFilter(''); setPage(1);
  };

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchEvents = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const statusParam = activeTab === 'pending' ? 'Pending' : 'Approved';
      const res = await eventService.adminGetAll({
        search, category: catFilter, status: statusParam, page, limit: 12
      });
      setEvents(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load events.';
      setError(msg); toast(msg, 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, catFilter, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── Create ────────────────────────────────────────────────── */
  const handleCreate = async (form) => {
    setCreateSaving(true);
    try {
      await eventService.createEvent(form);
      toast('✅ Event created!', 'success');
      setCreateOpen(false);
      fetchEvents();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create event.', 'error');
    } finally { setCreateSaving(false); }
  };

  /* ── Edit ──────────────────────────────────────────────────── */
  const handleEdit = async (form) => {
    setEditSaving(true);
    try {
      const res = await eventService.editEvent(editTarget._id, form);
      setEvents(prev => prev.map(e => e._id === editTarget._id ? res.data.data : e));
      toast('✅ Event updated!', 'success');
      setEditTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setEditSaving(false); }
  };

  /* ── Delete / Reject ───────────────────────────────────────── */
  const handleDelete = async () => {
    setDelSaving(true);
    try {
      await eventService.deleteEvent(deleteTarget._id);
      setEvents(prev => prev.filter(e => e._id !== deleteTarget._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast('🗑️ Event removed.', 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setDelSaving(false); }
  };

  /* ── Approve ───────────────────────────────────────────────── */
  const handleApprove = async (ev) => {
    try {
      await eventService.approveEvent(ev._id);
      setEvents(prev => prev.filter(e => e._id !== ev._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast('✅ Event approved & published!', 'success');
    } catch {
      toast('Approve failed.', 'error');
    }
  };

  /* ── Pagination ────────────────────────────────────────────── */
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
          <div className="ap-section-title">Event Management</div>
          <div className="ap-section-sub">Review pending event requests, manage published events, and view attendee registrations.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="am-btn am-btn-ghost" onClick={fetchEvents} title="Refresh">
            <FiRefreshCw size={13} />
          </button>
          <button
            className="am-btn am-btn-primary"
            style={{ background: ACCENT, border: `1px solid ${ACCENT}`, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setCreateOpen(true)}
          >
            <FiPlus size={14} /> Create Event
          </button>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────── */}
      <div className="ajd-tab-bar">
        {[
          { key: 'pending',  label: 'Pending Approvals', icon: <FiClock size={14} /> },
          { key: 'approved', label: 'Published Events',  icon: <FiCheckCircle size={14} /> },
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
          <span>These events were created by alumni and are pending your review before going live.</span>
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="am-toolbar">
        <div className="am-search-wrap" style={{ flex: 1, maxWidth: 340 }}>
          <FiSearch size={14} className="am-search-icon" />
          <input
            className="am-search-input"
            placeholder="Search events, venues…"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
          />
        </div>
        <select className="am-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || catFilter) && (
          <button className="am-btn am-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setCatFilter(''); setPage(1); }}>
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
      ) : events.length === 0 ? (
        <div className="am-empty">
          <div className="am-empty-icon">{activeTab === 'pending' ? '⏳' : '📅'}</div>
          <div className="am-empty-title">
            {activeTab === 'pending' ? 'No pending events' : 'No published events'}
          </div>
          <div className="am-empty-sub">
            {search || catFilter
              ? 'Try adjusting your filters.'
              : activeTab === 'pending'
                ? 'No events are awaiting approval right now.'
                : 'Click "Create Event" to add the first event.'}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="am-table-wrap ajd-desktop-table">
            <table className="am-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date &amp; Venue</th>
                  <th>Created By</th>
                  <th>Attendees</th>
                  <th>{activeTab === 'pending' ? 'Decision' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <EventRow
                    key={ev._id}
                    ev={ev}
                    isPending={activeTab === 'pending'}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                    onAttendees={setAttendeesEv}
                    onApprove={handleApprove}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="ajd-mobile-cards">
            {events.map(ev => (
              <EventCard
                key={ev._id}
                ev={ev}
                isPending={activeTab === 'pending'}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onAttendees={setAttendeesEv}
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
      {createOpen   && <EventFormModal event={null}       onClose={() => setCreateOpen(false)} onSave={handleCreate} saving={createSaving} />}
      {editTarget   && <EventFormModal event={editTarget} onClose={() => setEditTarget(null)}  onSave={handleEdit}   saving={editSaving}   />}
      {deleteTarget && (
        <DeleteConfirm label={deleteTarget.title} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} saving={delSaving} />
      )}
      {attendeesEv && <AttendeesModal event={attendeesEv} onClose={() => setAttendeesEv(null)} />}

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

export default AdminEvents;
