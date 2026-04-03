import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService, adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiSettings, FiLock, FiUser, FiShield, FiServer,
  FiSave, FiEye, FiEyeOff, FiCheck, FiAlertTriangle,
  FiInfo, FiSearch, FiX, FiChevronLeft, FiChevronRight,
  FiRefreshCw, FiToggleLeft, FiToggleRight, FiEdit2,
} from 'react-icons/fi';

/* ── Toast ─────────────────────────────────────────────────── */
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

/* ── Avatar colour ─────────────────────────────────────────── */
const COLORS = ['#6366f1','#14b8a6','#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899','#c84022'];
const ac = (n = '') => COLORS[(n.charCodeAt(0) || 0) % COLORS.length];

/* ── Password strength ──────────────────────────────────────── */
const strength = (pw) => {
  let s = 0;
  if (pw.length >= 6)  s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-5
};
const strengthLabel = [null, 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = [null, '#ef4444', '#f59e0b', '#eab308', '#10b981', '#6366f1'];

/* ── Field ──────────────────────────────────────────────────── */
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{hint}</div>}
  </div>
);

const Input = ({ type = 'text', ...props }) => (
  <input
    type={type}
    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa', transition: 'border-color 0.15s' }}
    onFocus={e => (e.target.style.borderColor = '#6366f1')}
    onBlur={e  => (e.target.style.borderColor = '#e8e8e8')}
    {...props}
  />
);

/* ── Toggle switch ──────────────────────────────────────────── */
const Toggle = ({ value, onChange, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid #f5f5f5' }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1a2e' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{sub}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
    >
      {value
        ? <FiToggleRight size={32} color="#6366f1" />
        : <FiToggleLeft  size={32} color="#ccc" />}
    </button>
  </div>
);

/* ── Role pill ───────────────────────────────────────────────── */
const RolePill = ({ role }) => {
  const map = { admin: '#c84022', alumni: '#6366f1', student: '#10b981' };
  const c = map[role] || '#888';
  return (
    <span style={{ background: `${c}15`, color: c, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
      {role}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB: PROFILE
══════════════════════════════════════════════════════════════ */
const ProfileTab = ({ user, updateUser, toast }) => {
  const [name,   setName]   = useState(user?.name || '');
  const [phone,  setPhone]  = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast('Name is required.', 'error'); return; }
    setSaving(true);
    try {
      const res = await authService.updateProfile({ name: name.trim(), phone: phone.trim() });
      updateUser(res.data?.user || { name: name.trim(), phone: phone.trim() });
      toast('✅ Profile updated!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally { setSaving(false); }
  };

  const initials = (user?.name || 'A')[0].toUpperCase();

  return (
    <div>
      <div className="am-settings-section-title">Profile Information</div>

      {/* Avatar banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 18, background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.03))', borderRadius: 14, border: '1.5px solid rgba(99,102,241,0.12)' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: user?.profilePic ? 'transparent' : ac(user?.name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0, overflow: 'hidden', boxShadow: '0 0 0 3px rgba(99,102,241,0.2)' }}>
          {user?.profilePic ? <img src={user.profilePic} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: '#888', marginTop: 2 }}>{user?.email}</div>
          <span style={{ display: 'inline-block', marginTop: 6, background: 'rgba(200,64,34,0.1)', color: '#c84022', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Administrator</span>
        </div>
      </div>

      <Field label="Display Name">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
      </Field>

      <Field label="Phone Number" hint="Optional — used for account recovery">
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
      </Field>

      <Field label="Email Address" hint="Contact support to change your email">
        <Input value={user?.email || ''} readOnly style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13.5, background: '#f5f5f5', color: '#aaa', cursor: 'not-allowed', boxSizing: 'border-box', fontFamily: 'inherit' }} />
      </Field>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '11px 22px', cursor: 'pointer', fontSize: 13.5, color: '#fff', fontWeight: 700, boxShadow: '0 3px 14px rgba(99,102,241,0.35)' }}
      >
        {saving ? <ClipLoader size={14} color="#fff" /> : <FiSave size={14} />}
        {saving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB: SECURITY (change password)
══════════════════════════════════════════════════════════════ */
const SecurityTab = ({ toast }) => {
  const [oldPw,  setOldPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConfPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving]  = useState(false);

  const s = strength(newPw);
  const match = newPw && confPw && newPw === confPw;
  const mismatch = newPw && confPw && newPw !== confPw;

  const handleChange = async () => {
    if (!oldPw || !newPw || !confPw) { toast('All fields are required.', 'error'); return; }
    if (newPw !== confPw)            { toast('Passwords do not match.', 'error'); return; }
    if (newPw.length < 6)            { toast('Minimum 6 characters.', 'error'); return; }

    setSaving(true);
    try {
      await authService.changePassword(oldPw, newPw);
      toast('✅ Password changed successfully!', 'success');
      setOldPw(''); setNewPw(''); setConfPw('');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="am-settings-section-title">Change Password</div>

      <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, padding: '12px 16px', marginBottom: 22, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <FiInfo size={15} color="#6366f1" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.6 }}>
          Choose a strong password with at least 8 characters, including uppercase, numbers, and symbols.
        </div>
      </div>

      <Field label="Current Password">
        <div style={{ position: 'relative' }}>
          <Input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Enter current password" style={{ paddingRight: 40 }} />
          <button onClick={() => setShowOld(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
            {showOld ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </Field>

      <Field label="New Password">
        <div style={{ position: 'relative' }}>
          <input
            type={showNew ? 'text' : 'password'}
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Min 6 characters"
            style={{ width: '100%', padding: '10px 40px 10px 13px', border: `1.5px solid ${newPw ? strengthColor[s] || '#e8e8e8' : '#e8e8e8'}`, borderRadius: 10, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fafafa' }}
          />
          <button onClick={() => setShowNew(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
            {showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
        {/* Strength meter */}
        {newPw && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= s ? strengthColor[s] : '#e0e0e0', transition: 'background 0.2s' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: strengthColor[s], fontWeight: 600 }}>{strengthLabel[s]}</div>
          </div>
        )}
      </Field>

      <Field label="Confirm New Password">
        <Input
          type="password"
          value={confPw}
          onChange={e => setConfPw(e.target.value)}
          placeholder="Repeat new password"
          style={{ border: `1.5px solid ${match ? '#10b981' : mismatch ? '#ef4444' : '#e8e8e8'}` }}
        />
        {match    && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4, display: 'flex', gap: 4 }}><FiCheck size={12} /> Passwords match</div>}
        {mismatch && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>}
      </Field>

      <button
        onClick={handleChange}
        disabled={saving || !oldPw || !newPw || !confPw || newPw !== confPw}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, background: saving || !oldPw || !newPw || !confPw || newPw !== confPw ? '#e0e0e0' : 'linear-gradient(135deg,#c84022,#e05a3a)', border: 'none', borderRadius: 10, padding: '11px 22px', cursor: 'pointer', fontSize: 13.5, color: saving || !oldPw || !newPw || !confPw || newPw !== confPw ? '#aaa' : '#fff', fontWeight: 700, transition: 'all 0.2s', boxShadow: !saving && oldPw && newPw && confPw && newPw === confPw ? '0 3px 14px rgba(200,64,34,0.35)' : 'none' }}
      >
        {saving ? <ClipLoader size={14} color="#fff" /> : <FiLock size={14} />}
        {saving ? 'Updating…' : 'Update Password'}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB: ROLE MANAGER
══════════════════════════════════════════════════════════════ */
const RoleManagerTab = ({ toast, currentUserId }) => {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [searchIn,   setSearchIn]   = useState('');
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [updating,   setUpdating]   = useState(null); // userId being updated

  const timerRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsersWithRoles({ search, role: roleFilter, page, limit: 10 });
      setUsers(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch {
      toast('Failed to load users.', 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = val => {
    setSearchIn(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    setUpdating(user._id);
    try {
      await adminService.updateUserRole(user._id, newRole);
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: newRole } : u));
      toast(`✅ ${user.name}'s role → ${newRole}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Role update failed.', 'error');
    } finally { setUpdating(null); }
  };

  const getPages = () => {
    const { totalPages } = pagination;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p = pagination.page;
    return [...new Set([1, totalPages, p, p - 1, p + 1])].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  };

  return (
    <div>
      <div className="am-settings-section-title">Manage User Roles</div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 18, marginTop: -8 }}>
        Change user roles across the platform. Users are notified in-app when their role changes.
      </p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="am-search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <FiSearch size={13} className="am-search-icon" />
          <input className="am-search-input" placeholder="Search by name or email…" value={searchIn} onChange={e => handleSearch(e.target.value)} />
        </div>
        <select className="am-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="alumni">Alumni</option>
          <option value="admin">Admins</option>
        </select>
        <button className="am-btn am-btn-ghost" onClick={fetchUsers} title="Refresh"><FiRefreshCw size={13} /></button>
      </div>

      {loading ? (
        <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><ClipLoader color="#6366f1" size={30} /></div>
      ) : users.length === 0 ? (
        <div className="am-empty" style={{ padding: '40px 0' }}>
          <div className="am-empty-icon" style={{ fontSize: 32 }}>👥</div>
          <div className="am-empty-title">No users found</div>
        </div>
      ) : (
        <>
          <div className="am-table-wrap">
            <table className="am-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Dept / Batch</th>
                  <th>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ opacity: updating === u._id ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: ac(u.name || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {u.profilePic ? <img src={u.profilePic} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (u.name || '?')[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>
                            {u.name}
                            {u._id === currentUserId && <span style={{ fontSize: 10, background: '#6366f1', color: '#fff', borderRadius: 4, padding: '1px 5px', marginLeft: 6, fontWeight: 700 }}>YOU</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#aaa' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><RolePill role={u.role} /></td>
                    <td>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: u.status === 'Active' ? '#10b981' : '#f59e0b' }}>
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: '#888' }}>{u.department || '—'}</div>
                      {u.batch && <div style={{ fontSize: 11, color: '#bbb' }}>Batch {u.batch}</div>}
                    </td>
                    <td>
                      {updating === u._id ? (
                        <ClipLoader size={14} color="#6366f1" />
                      ) : (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u, e.target.value)}
                          disabled={u._id === currentUserId}
                          className="am-select"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          title={u._id === currentUserId ? 'Cannot change your own role' : undefined}
                        >
                          <option value="student">Student</option>
                          <option value="alumni">Alumni</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="am-pagination" style={{ marginTop: 14 }}>
            <span className="am-page-info">
              {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="am-page-btns">
              <button className="am-page-btn" onClick={() => setPage(p => p - 1)} disabled={pagination.page <= 1}><FiChevronLeft size={13} /></button>
              {getPages().map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && arr[i - 1] !== n - 1 && <span style={{ color: '#bbb' }}>…</span>}
                  <button className={`am-page-btn${n === pagination.page ? ' am-page-btn-active' : ''}`} onClick={() => setPage(n)}>{n}</button>
                </React.Fragment>
              ))}
              <button className="am-page-btn" onClick={() => setPage(p => p + 1)} disabled={pagination.page >= pagination.totalPages}><FiChevronRight size={13} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TAB: SYSTEM CONFIG
══════════════════════════════════════════════════════════════ */
const SystemConfigTab = ({ toast }) => {
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    adminService.getSystemConfig()
      .then(r => setConfig(r.data.data))
      .catch(() => toast('Failed to load system config.', 'error'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminService.updateSystemConfig(config);
      setConfig(res.data.data);
      toast('✅ System configuration saved!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed.', 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 60, display: 'flex', justifyContent: 'center' }}><ClipLoader color="#6366f1" size={30} /></div>;
  if (!config)  return null;

  return (
    <div>
      <div className="am-settings-section-title">System Configuration</div>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 22, marginTop: -8 }}>
        Control platform-wide feature flags and behaviour settings.
      </p>

      {/* Site name */}
      <Field label="Platform Name" hint="Displayed in emails and broadcast messages">
        <Input value={config.siteName} onChange={e => set('siteName', e.target.value)} />
      </Field>

      {/* Upload limit */}
      <Field label="Max File Upload Size (MB)" hint="Applies to profile pictures and post media">
        <input
          type="number"
          min={1}
          max={50}
          value={config.maxUploadSizeMB}
          onChange={e => set('maxUploadSizeMB', Number(e.target.value))}
          style={{ width: 120, padding: '10px 13px', border: '1.5px solid #e8e8e8', borderRadius: 10, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', background: '#fafafa' }}
        />
      </Field>

      {/* Feature toggles */}
      <div style={{ margin: '20px 0 6px', fontWeight: 700, fontSize: 12, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feature Flags</div>

      <Toggle
        label="Alumni can post jobs"
        sub="Allow alumni to submit job postings (pending admin approval)"
        value={config.allowAlumniJobs}
        onChange={v => set('allowAlumniJobs', v)}
      />
      <Toggle
        label="Alumni can create events"
        sub="Allow alumni to submit events (pending admin approval)"
        value={config.allowAlumniEvents}
        onChange={v => set('allowAlumniEvents', v)}
      />
      <Toggle
        label="Require admin approval for alumni"
        sub="New alumni registrations must be manually approved before login"
        value={config.requireApproval}
        onChange={v => set('requireApproval', v)}
      />
      <Toggle
        label="Email notifications (SMTP)"
        sub="Send email for broadcasts, approvals, and announcements (requires SMTP config)"
        value={config.notifEmailEnabled}
        onChange={v => set('notifEmailEnabled', v)}
      />

      {/* Maintenance mode — prominent warning */}
      <div style={{ marginTop: 4, padding: '14px 16px', background: config.maintenanceMode ? 'rgba(239,68,68,0.06)' : '#fafafa', border: `1.5px solid ${config.maintenanceMode ? 'rgba(239,68,68,0.25)' : '#f0f0f0'}`, borderRadius: 12, marginBottom: 20 }}>
        <Toggle
          label="🔧 Maintenance Mode"
          sub="Temporarily disable access for non-admin users (use with caution)"
          value={config.maintenanceMode}
          onChange={v => set('maintenanceMode', v)}
        />
        {config.maintenanceMode && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, fontSize: 12, color: '#dc2626' }}>
            <FiAlertTriangle size={13} /> Only admins can log in while maintenance mode is active.
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, padding: '11px 22px', cursor: 'pointer', fontSize: 13.5, color: '#fff', fontWeight: 700, boxShadow: '0 3px 14px rgba(99,102,241,0.35)' }}
      >
        {saving ? <ClipLoader size={14} color="#fff" /> : <FiServer size={14} />}
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'profile',  label: 'Profile',        icon: FiUser,    color: '#6366f1' },
  { id: 'security', label: 'Security',        icon: FiLock,    color: '#c84022' },
  { id: 'roles',    label: 'Role Manager',    icon: FiShield,  color: '#8b5cf6' },
  { id: 'system',   label: 'System Config',   icon: FiServer,  color: '#10b981' },
];

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [tab,  setTab]  = useState('profile');
  const { toasts, add: toast } = useToast();

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div>
      {/* ── Header ──────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Settings</div>
          <div className="ap-section-sub">Manage your account, security, user roles, and platform configuration.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ─── Sidebar nav ──────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', position: 'sticky', top: 20 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 18px', border: 'none',
                background: tab === t.id ? `${t.color}0a` : 'transparent',
                borderLeft: tab === t.id ? `3px solid ${t.color}` : '3px solid transparent',
                cursor: 'pointer', fontSize: 13.5,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? t.color : '#666',
                textAlign: 'left', transition: 'all 0.15s',
              }}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}

          {/* Admin info at bottom */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #f5f5f5', marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Logged in as</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

        {/* ─── Tab panel ────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '26px 28px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          {/* Tab indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 18, borderBottom: '1.5px solid #f5f5f5' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${activeTab?.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeTab && <activeTab.icon size={15} color={activeTab.color} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>{activeTab?.label}</div>
            </div>
          </div>

          {tab === 'profile'  && <ProfileTab user={user} updateUser={updateUser} toast={toast} />}
          {tab === 'security' && <SecurityTab toast={toast} />}
          {tab === 'roles'    && <RoleManagerTab toast={toast} currentUserId={user?._id || user?.id} />}
          {tab === 'system'   && <SystemConfigTab toast={toast} />}
        </div>
      </div>

      {/* Toast stack */}
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

export default AdminSettings;
