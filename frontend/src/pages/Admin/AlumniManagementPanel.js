import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiSearch, FiEdit2, FiTrash2,
  FiCheck, FiX, FiChevronLeft, FiChevronRight,
  FiChevronUp, FiChevronDown, FiRefreshCw, FiDownload,
  FiUserCheck, FiUsers, FiClock, FiAlertTriangle,
  FiMail, FiBriefcase, FiMapPin, FiInfo, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';

/* ── Avatar colours ─────────────────────────────────────────────── */
const AVATAR_COLORS = ['#c84022','#14b8a6','#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899','#6366f1'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ── Toast hook ─────────────────────────────────────────────────── */
let _tid = 0;
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_tid;
    set(t => [...t, { id, msg, type }]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
};

/* ── Page sizes ─────────────────────────────────────────────────── */
const PAGE_SIZES = [10, 20, 50];
const ACCENT = '#c84022';

/* ══════════════════════════════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════════════════════════════ */
const EditModal = ({ alumni, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    name:        alumni.name        || '',
    email:       alumni.email       || '',
    department:  alumni.department  || '',
    batch:       alumni.batch       || '',
    company:     alumni.company     || '',
    designation: alumni.designation || '',
    phone:       alumni.phone       || '',
    city:        alumni.city        || '',
    status:      alumni.status      || 'Pending',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title"><FiEdit2 size={15} color={ACCENT} /> Edit Alumni</span>
          <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>
        <div className="am-modal-body">
          <div className="am-field-grid">
            <div className="am-field">
              <label>Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Department</label>
              <input value={form.department} onChange={e => set('department', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Pass-Out Year</label>
              <input value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="e.g. 2022" />
            </div>
            <div className="am-field">
              <label>Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Designation</label>
              <input value={form.designation} onChange={e => set('designation', e.target.value)} />
            </div>
            <div className="am-field">
              <label>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="am-field">
              <label>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="am-field am-field-full">
              <label>Account Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="Active">Active (Approved)</option>
                <option value="Pending">Pending</option>
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
            disabled={saving}
          >
            {saving ? <ClipLoader size={14} color="#fff" /> : <><FiCheck size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DELETE MODAL
══════════════════════════════════════════════════════════════════ */
const DeleteModal = ({ alumni, onClose, onConfirm, saving }) => (
  <div className="am-modal-backdrop" onClick={onClose}>
    <div className="am-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
      <div className="am-confirm-body">
        <div className="am-confirm-icon"><FiTrash2 size={26} /></div>
        <div className="am-confirm-title">Delete Alumni Account?</div>
        <div className="am-confirm-sub">
          This will permanently remove <strong>{alumni.name}</strong>'s account. This action cannot be undone.
        </div>
      </div>
      <div className="am-modal-footer" style={{ justifyContent: 'center' }}>
        <button className="am-btn am-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="am-btn am-btn-danger" onClick={onConfirm} disabled={saving}>
          {saving ? <ClipLoader size={14} color="#fff" /> : <><FiTrash2 size={14} /> Delete</>}
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   SORT ICON
══════════════════════════════════════════════════════════════════ */
const SortIcon = ({ col, sortKey, sortOrder }) => {
  if (col !== sortKey) return <FiChevronDown size={11} style={{ opacity: 0.3 }} />;
  return sortOrder === 'asc'
    ? <FiChevronUp size={11} style={{ color: ACCENT }} />
    : <FiChevronDown size={11} style={{ color: ACCENT }} />;
};

/* ══════════════════════════════════════════════════════════════════
   AVATAR
══════════════════════════════════════════════════════════════════ */
const Avatar = ({ alumni, size = 36 }) => {
  const initials = alumni.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const bg = avatarColor(alumni.name || '');
  return (
    <div className="am-avatar-sm" style={{ background: bg, width: size, height: size, fontSize: size * 0.36 }}>
      {alumni.profilePic
        ? <img src={alumni.profilePic} alt={alumni.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : initials}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ALUMNI TABLE ROW — Desktop
══════════════════════════════════════════════════════════════════ */
const AlumniRow = ({ alumni, isPending, actionLoading, onApprove, onReject, onEdit, onDelete }) => {
  const isActioning = actionLoading === alumni._id;
  return (
    <tr>
      {/* Name + phone */}
      <td>
        <div className="am-name-cell">
          <Avatar alumni={alumni} />
          <div>
            <div className="am-name-primary">{alumni.name}</div>
            <div className="am-name-secondary">{alumni.phone || '—'}</div>
          </div>
        </div>
      </td>
      {/* Email */}
      <td><span style={{ fontSize: 13, color: '#555' }}>{alumni.email}</span></td>
      {/* Dept */}
      <td>
        {alumni.department
          ? <span className="amd-dept-badge">{alumni.department}</span>
          : <span style={{ color: '#ccc' }}>—</span>}
      </td>
      {/* Batch */}
      <td><span style={{ fontWeight: 700, color: '#333', fontSize: 13 }}>{alumni.batch || '—'}</span></td>
      {/* Company */}
      <td>
        <div style={{ fontSize: 13, color: '#444', fontWeight: 500 }}>{alumni.company || <span style={{ color: '#ccc' }}>—</span>}</div>
        {alumni.city && <div style={{ fontSize: 11, color: '#aaa' }}>{alumni.city}</div>}
      </td>
      {/* Designation */}
      <td style={{ fontSize: 13, color: '#666' }}>{alumni.designation || <span style={{ color: '#ccc' }}>—</span>}</td>
      {/* Actions */}
      <td>
        <div className="am-actions">
          {isActioning ? (
            <ClipLoader size={16} color={ACCENT} />
          ) : isPending ? (
            <>
              <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(alumni)}>
                <FiCheckCircle size={14} />
              </button>
              <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onReject(alumni)}>
                <FiXCircle size={14} />
              </button>
            </>
          ) : (
            <button className="am-btn-icon am-btn-icon-reject" title="Revoke Approval" onClick={() => onReject(alumni)}>
              <FiXCircle size={14} />
            </button>
          )}
          <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(alumni)} disabled={isActioning}>
            <FiEdit2 size={13} />
          </button>
          <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(alumni)} disabled={isActioning}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ALUMNI MOBILE CARD
══════════════════════════════════════════════════════════════════ */
const AlumniCard = ({ alumni, isPending, actionLoading, onApprove, onReject, onEdit, onDelete }) => {
  const isActioning = actionLoading === alumni._id;
  return (
    <div className="ajd-mobile-card" style={{ padding: 14 }}>
      <div className="ajd-mobile-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Avatar alumni={alumni} size={40} />
          <div>
            <div className="ajd-mobile-card-title">{alumni.name}</div>
            <div className="ajd-mobile-card-sub">
              <FiMail size={10} style={{ marginRight: 3 }} />{alumni.email}
            </div>
          </div>
        </div>
        {/* Status pill */}
        <span className={alumni.status === 'Active' ? 'am-pill am-pill-active' : 'am-pill am-pill-pending'}>
          <span className="am-pill-dot" /> {alumni.status === 'Active' ? 'Approved' : 'Pending'}
        </span>
      </div>

      <div className="ajd-mobile-card-meta" style={{ marginTop: 8 }}>
        {alumni.department && (
          <span><span className="amd-dept-badge" style={{ fontSize: 10.5 }}>{alumni.department}</span></span>
        )}
        {alumni.batch && <span><FiClock size={11} /> {alumni.batch}</span>}
        {alumni.company && <span><FiBriefcase size={11} /> {alumni.company}</span>}
        {alumni.city && <span><FiMapPin size={11} /> {alumni.city}</span>}
      </div>

      {alumni.designation && (
        <div style={{ fontSize: 12, color: '#888', marginTop: 4, marginBottom: 8 }}>
          {alumni.designation}
        </div>
      )}

      <div className="ajd-mobile-card-footer">
        <div style={{ fontSize: 11, color: '#bbb' }}>{alumni.phone || ''}</div>
        <div className="am-actions">
          {isActioning ? (
            <ClipLoader size={16} color={ACCENT} />
          ) : isPending ? (
            <>
              <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(alumni)}>
                <FiCheckCircle size={14} />
              </button>
              <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onReject(alumni)}>
                <FiXCircle size={14} />
              </button>
            </>
          ) : (
            <button className="am-btn-icon am-btn-icon-reject" title="Revoke Approval" onClick={() => onReject(alumni)}>
              <FiXCircle size={14} />
            </button>
          )}
          <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(alumni)} disabled={isActioning}>
            <FiEdit2 size={13} />
          </button>
          <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(alumni)} disabled={isActioning}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AlumniManagementPanel = () => {
  /* ── Tab ───────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'

  /* ── Data ──────────────────────────────────────────────────── */
  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filterMeta, setFilterMeta] = useState({ departments: [], batches: [] });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* ── Filters + sort ────────────────────────────────────────── */
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deptFilter,  setDeptFilter]  = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [sortKey,     setSortKey]     = useState('createdAt');
  const [sortOrder,   setSortOrder]   = useState('desc');
  const [page,        setPage]        = useState(1);
  const [limit,       setLimit]       = useState(10);

  /* ── Modal state ───────────────────────────────────────────── */
  const [editTarget,    setEditTarget]    = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editSaving,    setEditSaving]    = useState(false);
  const [deleteSaving,  setDeleteSaving]  = useState(false);

  const { toasts, add: toast } = useToast();
  const searchTimer = useRef(null);

  /* ── Search debounce ───────────────────────────────────────── */
  const handleSearchChange = val => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  /* ── Tab switch ────────────────────────────────────────────── */
  const switchTab = tab => {
    setActiveTab(tab);
    setSearch(''); setSearchInput('');
    setDeptFilter(''); setBatchFilter('');
    setPage(1);
  };

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchAlumni = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const statusParam = activeTab === 'pending' ? 'Pending' : 'Active';
      const res = await adminService.getAlumni({
        search, department: deptFilter, batch: batchFilter,
        status: statusParam, page, limit,
        sort: sortKey, order: sortOrder,
      });
      setRows(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
      if (res.data.filters) setFilterMeta(res.data.filters);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load alumni.';
      setError(msg); toast(msg, 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, deptFilter, batchFilter, page, limit, sortKey, sortOrder]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  /* ── Sort ──────────────────────────────────────────────────── */
  const handleSort = key => {
    if (sortKey === key) { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortOrder('asc'); }
    setPage(1);
  };

  /* ── Approve ───────────────────────────────────────────────── */
  const handleApprove = async alumni => {
    setActionLoading(alumni._id);
    try {
      await adminService.approveAlumni(alumni._id);
      // Remove from pending list / refresh
      setRows(prev => prev.filter(r => r._id !== alumni._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast(`✅ ${alumni.name} approved!`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally { setActionLoading(null); }
  };

  /* ── Reject (pending tab: hard delete; approved tab: set pending) */
  const handleReject = async alumni => {
    setActionLoading(alumni._id);
    try {
      if (activeTab === 'pending') {
        // Pending → reject & hard-delete the application
        await adminService.rejectUser(alumni._id);
        setRows(prev => prev.filter(r => r._id !== alumni._id));
        setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast(`${alumni.name}'s application rejected.`, 'info');
      } else {
        // Approved → revoke (set back to Pending)
        await adminService.rejectAlumni(alumni._id);  // PUT /admin/reject-alumni/:id
        setRows(prev => prev.filter(r => r._id !== alumni._id));
        setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast(`${alumni.name} moved back to Pending.`, 'info');
      }
    } catch (err) {
      toast('Action failed.', 'error');
    } finally { setActionLoading(null); }
  };

  /* ── Edit ──────────────────────────────────────────────────── */
  const handleEditSave = async formData => {
    setEditSaving(true);
    try {
      await adminService.updateAlumni(editTarget._id, formData);
      setRows(prev => prev.map(r => r._id === editTarget._id ? { ...r, ...formData } : r));
      toast(`✅ ${formData.name} updated!`, 'success');
      setEditTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed.', 'error');
    } finally { setEditSaving(false); }
  };

  /* ── Delete ────────────────────────────────────────────────── */
  const handleDeleteConfirm = async () => {
    setDeleteSaving(true);
    try {
      await adminService.deleteAlumni(deleteTarget._id);
      setRows(prev => prev.filter(r => r._id !== deleteTarget._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast(`🗑️ ${deleteTarget.name} deleted.`, 'info');
      setDeleteTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setDeleteSaving(false); }
  };

  /* ── CSV Export ────────────────────────────────────────────── */
  const handleExport = () => {
    const headers = ['Name','Email','Department','Batch','Company','Designation','Status','Phone','City'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name || ''}"`, `"${r.email || ''}"`,
        r.department || '', r.batch || '',
        `"${r.company || ''}"`, `"${r.designation || ''}"`,
        r.status || '', r.phone || '', r.city || '',
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `alumni_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported!', 'success');
  };

  /* ── Pagination ────────────────────────────────────────────── */
  const getPageNumbers = () => {
    const { totalPages } = pagination;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p = pagination.page;
    return [...new Set([1, totalPages, p, p - 1, p + 1])].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  };

  const TABLE_COLS = [
    { key: 'name',        label: 'Name',          sortable: true },
    { key: 'email',       label: 'Email',         sortable: true },
    { key: 'department',  label: 'Department',    sortable: true },
    { key: 'batch',       label: 'Pass-Out Year', sortable: true },
    { key: 'company',     label: 'Company',       sortable: false },
    { key: 'designation', label: 'Designation',   sortable: false },
    { key: 'actions',     label: activeTab === 'pending' ? 'Decision' : 'Actions', sortable: false },
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Alumni Management</div>
          <div className="ap-section-sub">Review pending applications, manage approved alumni profiles.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="am-btn am-btn-ghost" onClick={fetchAlumni} title="Refresh">
            <FiRefreshCw size={14} />
          </button>
          <button className="am-btn am-btn-ghost" onClick={handleExport} title="Export CSV">
            <FiDownload size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────── */}
      <div className="ajd-tab-bar">
        {[
          { key: 'pending',  label: 'Pending Approvals', icon: <FiClock size={14} /> },
          { key: 'approved', label: 'Approved Alumni',   icon: <FiUserCheck size={14} /> },
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

      {/* ── Info banner (pending tab) ───────────────────────── */}
      {activeTab === 'pending' && (
        <div className="ajd-info-banner">
          <FiInfo size={14} />
          <span>These alumni registered and are awaiting admin approval before they can access the platform.</span>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="am-toolbar">
        <div className="am-search-wrap" style={{ flex: 1, maxWidth: 340 }}>
          <FiSearch size={14} className="am-search-icon" />
          <input
            className="am-search-input"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <select className="am-select" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All Departments</option>
          {filterMeta.departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="am-select" value={batchFilter} onChange={e => { setBatchFilter(e.target.value); setPage(1); }}>
          <option value="">All Years</option>
          {filterMeta.batches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {(search || deptFilter || batchFilter) && (
          <button className="am-btn am-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setDeptFilter(''); setBatchFilter(''); setPage(1); }}>
            <FiX size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <div className="ajd-error-banner"><FiAlertTriangle size={15} /> {error}</div>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
          <ClipLoader color={ACCENT} size={38} />
        </div>
      ) : rows.length === 0 ? (
        <div className="am-empty">
          <div className="am-empty-icon">{activeTab === 'pending' ? '⏳' : '🎓'}</div>
          <div className="am-empty-title">
            {activeTab === 'pending' ? 'No pending applications' : 'No approved alumni'}
          </div>
          <div className="am-empty-sub">
            {search || deptFilter || batchFilter
              ? 'Try adjusting your filters or search.'
              : activeTab === 'pending'
                ? 'All applications have been reviewed.'
                : 'No alumni have been approved yet.'}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="am-table-wrap ajd-desktop-table">
            <table className="am-table">
              <thead>
                <tr>
                  {TABLE_COLS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                    >
                      <span className="am-th-sort">
                        {col.label}
                        {col.sortable && <SortIcon col={col.key} sortKey={sortKey} sortOrder={sortOrder} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(alumni => (
                  <AlumniRow
                    key={alumni._id}
                    alumni={alumni}
                    isPending={activeTab === 'pending'}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="ajd-mobile-cards">
            {rows.map(alumni => (
              <AlumniCard
                key={alumni._id}
                alumni={alumni}
                isPending={activeTab === 'pending'}
                actionLoading={actionLoading}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="am-pagination">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="am-page-info">
                Showing {((pagination.page - 1) * pagination.limit) + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <select className="am-limit-select" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
                {PAGE_SIZES.map(s => <option key={s} value={s}>Show {s}</option>)}
              </select>
            </div>
            <div className="am-page-btns">
              <button className="am-page-btn" onClick={() => setPage(p => p - 1)} disabled={pagination.page <= 1}>
                <FiChevronLeft size={14} />
              </button>
              {getPageNumbers().map((n, i, arr) => (
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
      {editTarget && (
        <EditModal alumni={editTarget} onClose={() => setEditTarget(null)} onSave={handleEditSave} saving={editSaving} />
      )}
      {deleteTarget && (
        <DeleteModal alumni={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} saving={deleteSaving} />
      )}

      {/* Toasts */}
      <div className="am-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`am-toast am-toast-${t.type}`}>
            {t.type === 'success' && <FiCheck size={15} />}
            {t.type === 'error'   && <FiAlertTriangle size={15} />}
            {t.type === 'info'    && <FiUserCheck size={15} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlumniManagementPanel;
