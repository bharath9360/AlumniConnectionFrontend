import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiSearch, FiEdit2, FiTrash2,
  FiCheck, FiX, FiChevronLeft, FiChevronRight,
  FiChevronUp, FiChevronDown, FiRefreshCw, FiDownload,
  FiUserCheck, FiClock, FiAlertTriangle,
  FiMail, FiBriefcase, FiInfo, FiCheckCircle, FiXCircle,
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
const EditModal = ({ staff, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    name:        staff.name        || '',
    email:       staff.email       || '',
    department:  staff.department  || '',
    designation: staff.designation || '',
    phone:       staff.phone       || '',
    status:      staff.status      || 'Pending',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="am-modal-backdrop" onClick={onClose}>
      <div className="am-modal" onClick={e => e.stopPropagation()}>
        <div className="am-modal-header">
          <span className="am-modal-title"><FiEdit2 size={15} color={ACCENT} /> Edit Staff Member</span>
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
              <label>Role / Designation</label>
              <input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Professor" />
            </div>
            <div className="am-field">
              <label>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="am-field">
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
const DeleteModal = ({ staff, onClose, onConfirm, saving }) => (
  <div className="am-modal-backdrop" onClick={onClose}>
    <div className="am-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
      <div className="am-confirm-body">
        <div className="am-confirm-icon"><FiTrash2 size={26} /></div>
        <div className="am-confirm-title">Delete Staff Account?</div>
        <div className="am-confirm-sub">
          This will permanently remove <strong>{staff.name}</strong>'s account. This action cannot be undone.
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
const Avatar = ({ staff, size = 36 }) => {
  const initials = staff.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const bg = avatarColor(staff.name || '');
  return (
    <div className="am-avatar-sm" style={{ background: bg, width: size, height: size, fontSize: size * 0.36 }}>
      {staff.profilePic
        ? <img src={staff.profilePic} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : initials}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   STAFF TABLE ROW — Desktop
══════════════════════════════════════════════════════════════════ */
const StaffRow = ({ staff, isPending, actionLoading, onApprove, onReject, onEdit, onDelete }) => {
  const isActioning = actionLoading === staff._id;
  return (
    <tr>
      {/* Name + phone */}
      <td>
        <div className="am-name-cell">
          <Avatar staff={staff} />
          <div>
            <div className="am-name-primary">{staff.name}</div>
            <div className="am-name-secondary">{staff.phone || '—'}</div>
          </div>
        </div>
      </td>
      {/* Email */}
      <td><span style={{ fontSize: 13, color: '#555' }}>{staff.email}</span></td>
      {/* Dept */}
      <td>
        {staff.department
          ? <span className="amd-dept-badge">{staff.department}</span>
          : <span style={{ color: '#ccc' }}>—</span>}
      </td>
      {/* Designation */}
      <td style={{ fontSize: 13, color: '#666' }}>{staff.designation || <span style={{ color: '#ccc' }}>—</span>}</td>
      {/* Status */}
      <td>
        <span className={staff.status === 'Active' ? 'am-pill am-pill-active' : 'am-pill am-pill-pending'}>
          <span className="am-pill-dot" /> {staff.status === 'Active' ? 'Approved' : 'Pending'}
        </span>
      </td>
      {/* Actions */}
      <td>
        <div className="am-actions">
          {isActioning ? (
            <ClipLoader size={16} color={ACCENT} />
          ) : isPending ? (
            <>
              <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(staff)}>
                <FiCheckCircle size={14} />
              </button>
              <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onReject(staff)}>
                <FiXCircle size={14} />
              </button>
            </>
          ) : (
            <button className="am-btn-icon am-btn-icon-reject" title="Revoke Approval" onClick={() => onReject(staff)}>
              <FiXCircle size={14} />
            </button>
          )}
          <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(staff)} disabled={isActioning}>
            <FiEdit2 size={13} />
          </button>
          <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(staff)} disabled={isActioning}>
            <FiTrash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

/* ══════════════════════════════════════════════════════════════════
   STAFF MOBILE CARD
══════════════════════════════════════════════════════════════════ */
const StaffCard = ({ staff, isPending, actionLoading, onApprove, onReject, onEdit, onDelete }) => {
  const isActioning = actionLoading === staff._id;
  return (
    <div className="ajd-mobile-card" style={{ padding: 14 }}>
      <div className="ajd-mobile-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Avatar staff={staff} size={40} />
          <div>
            <div className="ajd-mobile-card-title">{staff.name}</div>
            <div className="ajd-mobile-card-sub">
              <FiMail size={10} style={{ marginRight: 3 }} />{staff.email}
            </div>
          </div>
        </div>
        {/* Status pill */}
        <span className={staff.status === 'Active' ? 'am-pill am-pill-active' : 'am-pill am-pill-pending'}>
          <span className="am-pill-dot" /> {staff.status === 'Active' ? 'Approved' : 'Pending'}
        </span>
      </div>

      <div className="ajd-mobile-card-meta" style={{ marginTop: 8 }}>
        {staff.department && (
          <span><span className="amd-dept-badge" style={{ fontSize: 10.5 }}>{staff.department}</span></span>
        )}
        {staff.designation && <span><FiBriefcase size={11} /> {staff.designation}</span>}
      </div>

      <div className="ajd-mobile-card-footer">
        <div style={{ fontSize: 11, color: '#bbb' }}>{staff.phone || ''}</div>
        <div className="am-actions">
          {isActioning ? (
            <ClipLoader size={16} color={ACCENT} />
          ) : isPending ? (
            <>
              <button className="am-btn-icon am-btn-icon-approve" title="Approve" onClick={() => onApprove(staff)}>
                <FiCheckCircle size={14} />
              </button>
              <button className="am-btn-icon am-btn-icon-reject" title="Reject & Delete" onClick={() => onReject(staff)}>
                <FiXCircle size={14} />
              </button>
            </>
          ) : (
            <button className="am-btn-icon am-btn-icon-reject" title="Revoke Approval" onClick={() => onReject(staff)}>
              <FiXCircle size={14} />
            </button>
          )}
          <button className="am-btn-icon am-btn-icon-edit" title="Edit" onClick={() => onEdit(staff)} disabled={isActioning}>
            <FiEdit2 size={13} />
          </button>
          <button className="am-btn-icon am-btn-icon-delete" title="Delete" onClick={() => onDelete(staff)} disabled={isActioning}>
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
const StaffManagementPanel = () => {
  /* ── Tab ───────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'

  /* ── Data ──────────────────────────────────────────────────── */
  const [rows,       setRows]       = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filterMeta, setFilterMeta] = useState({ departments: [], roles: [] });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* ── Filters + sort ────────────────────────────────────────── */
  const [search,      setSearch]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deptFilter,  setDeptFilter]  = useState('');
  const [roleFilter,  setRoleFilter]  = useState('');
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
    setDeptFilter(''); setRoleFilter('');
    setPage(1);
  };

  /* ── Fetch ─────────────────────────────────────────────────── */
  const fetchStaff = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (activeTab === 'pending') {
        const res = await adminService.getPendingStaff();
        setRows(res.data.data || []);
        // Note: pending-staff isn't paginated in backend, just returns all sorted by date
        setPagination({ total: (res.data.data || []).length, page: 1, limit: 100, totalPages: 1 });
        setFilterMeta({ departments: [], roles: [] });
      } else {
        const res = await adminService.getStaff({
          search, department: deptFilter, roleFilter,
          status: 'Active', page, limit,
          sort: sortKey, order: sortOrder,
        });
        setRows(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit, totalPages: 1 });
        if (res.data.filters) setFilterMeta(res.data.filters);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load staff.';
      setError(msg); toast(msg, 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, deptFilter, roleFilter, page, limit, sortKey, sortOrder]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  /* ── Sort ──────────────────────────────────────────────────── */
  const handleSort = key => {
    if (sortKey === key) { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortOrder('asc'); }
    setPage(1);
  };

  /* ── Approve ───────────────────────────────────────────────── */
  const handleApprove = async staff => {
    setActionLoading(staff._id);
    try {
      await adminService.approveStaff(staff._id);
      setRows(prev => prev.filter(r => r._id !== staff._id));
      setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast(`✅ ${staff.name} approved!`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally { setActionLoading(null); }
  };

  /* ── Reject (pending tab: hard delete; approved tab: set pending) */
  const handleReject = async staff => {
    setActionLoading(staff._id);
    try {
      if (activeTab === 'pending') {
        await adminService.rejectPendingStaff(staff._id);
        setRows(prev => prev.filter(r => r._id !== staff._id));
        setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast(`${staff.name}'s application rejected.`, 'info');
      } else {
        await adminService.rejectApprovedStaff(staff._id);
        setRows(prev => prev.filter(r => r._id !== staff._id));
        setPagination(p => ({ ...p, total: Math.max(0, p.total - 1) }));
        toast(`${staff.name} moved back to Pending.`, 'info');
      }
    } catch (err) {
      toast('Action failed.', 'error');
    } finally { setActionLoading(null); }
  };

  /* ── Edit ──────────────────────────────────────────────────── */
  const handleEditSave = async formData => {
    setEditSaving(true);
    try {
      await adminService.updateStaff(editTarget._id, formData);
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
      await adminService.deleteStaff(deleteTarget._id);
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
    const headers = ['Name','Email','Department','Designation','Status','Phone'];
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name || ''}"`, `"${r.email || ''}"`,
        r.department || '', `"${r.designation || ''}"`,
        r.status || '', r.phone || '',
      ].join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `staff_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
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
    { key: 'designation', label: 'Role',          sortable: true },
    { key: 'status',      label: 'Status',        sortable: false },
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
          <div className="ap-section-title">Staff Management</div>
          <div className="ap-section-sub">Review pending staff applications, manage approved staff members.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="am-btn am-btn-ghost" onClick={fetchStaff} title="Refresh">
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
          { key: 'approved', label: 'Approved Staff',    icon: <FiUserCheck size={14} /> },
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
          <span>These staff members registered and are awaiting admin approval to access staff privileges.</span>
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────────────── */}
      <div className="am-toolbar">
        {activeTab !== 'pending' && (
          <>
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
            <select className="am-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              {filterMeta.roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {(search || deptFilter || roleFilter) && (
              <button className="am-btn am-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setDeptFilter(''); setRoleFilter(''); setPage(1); }}>
                <FiX size={13} /> Clear
              </button>
            )}
          </>
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
          <div className="am-empty-icon">{activeTab === 'pending' ? '⏳' : '👥'}</div>
          <div className="am-empty-title">
            {activeTab === 'pending' ? 'No pending applications' : 'No approved staff'}
          </div>
          <div className="am-empty-sub">
            {search || deptFilter || roleFilter
              ? 'Try adjusting your filters or search.'
              : activeTab === 'pending'
                ? 'All staff applications have been reviewed.'
                : 'No staff members have been approved yet.'}
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
                      onClick={() => col.sortable && activeTab !== 'pending' && handleSort(col.key)}
                      style={{ cursor: col.sortable && activeTab !== 'pending' ? 'pointer' : 'default' }}
                    >
                      <span className="am-th-sort">
                        {col.label}
                        {col.sortable && activeTab !== 'pending' && <SortIcon col={col.key} sortKey={sortKey} sortOrder={sortOrder} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(staff => (
                  <StaffRow
                    key={staff._id}
                    staff={staff}
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
            {rows.map(staff => (
              <StaffCard
                key={staff._id}
                staff={staff}
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
          {activeTab !== 'pending' && (
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
          )}
        </>
      )}

      {/* ══ MODALS ══ */}
      {editTarget && (
        <EditModal staff={editTarget} onClose={() => setEditTarget(null)} onSave={handleEditSave} saving={editSaving} />
      )}
      {deleteTarget && (
        <DeleteModal staff={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} saving={deleteSaving} />
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

export default StaffManagementPanel;
