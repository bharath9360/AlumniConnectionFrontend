import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────
   GROUP CREATION MODAL — Clean, modern, inline-styled form
   MAMCET red‑white theme · Segmented type selector
───────────────────────────────────────────────────────────── */
const MAMCET_RED = '#C8102E';

const GroupModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'batch',
    description: '',
    department: '',
    passoutYear: '',
    members: [],
  });

  const [loading, setLoading]       = useState(false);
  const [options, setOptions]       = useState({ departments: [], batches: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]   = useState(false);
  const [errors, setErrors]         = useState({});

  /* ── Fetch department + batch options on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/groups/utils/departments-batches');
        if (res.data.success) setOptions(res.data.data);
      } catch (e) { console.error('Failed to load options', e); }
    })();
  }, []);

  /* ── User search (Custom mode) ── */
  const handleSearchUsers = async (e) => {
    const q = e.target.value;
    setSearchTerm(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const res = await api.get(`/users/search?q=${q}&limit=8`);
      if (res.data.success) setSearchResults(res.data.data);
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const toggleMember = (user) => {
    const has = formData.members.includes(user._id);
    setFormData({
      ...formData,
      members: has
        ? formData.members.filter(id => id !== user._id)
        : [...formData.members, user._id],
    });
    if (errors.members) setErrors({ ...errors, members: '' });
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Group name is required';
    if (formData.type === 'batch' && !formData.department) e.department = 'Select a department';
    if (formData.type === 'batch' && !formData.passoutYear) e.passoutYear = 'Select a batch year';
    if (formData.type === 'department' && !formData.department) e.department = 'Select a department';
    if (formData.type === 'custom' && formData.members.length === 0) e.members = 'Add at least one member';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = () => {
    if (!formData.name.trim()) return false;
    if (formData.type === 'batch' && (!formData.department || !formData.passoutYear)) return false;
    if (formData.type === 'department' && !formData.department) return false;
    if (formData.type === 'custom' && formData.members.length === 0) return false;
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await api.post('/groups', formData);
      if (res.data.success) {
        toast.success(res.data.message || 'Group created successfully!');
        onSuccess(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally { setLoading(false); }
  };

  /* ── Close on backdrop click ── */
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  /* ── Type config ── */
  const TYPES = [
    { key: 'batch',      label: 'Batch' },
    { key: 'department', label: 'Department' },
    { key: 'custom',     label: 'Custom' },
  ];

  /* ── Shared styles ── */
  const inputBase = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937',
    background: '#fff',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
  const inputFocus = { borderColor: MAMCET_RED, boxShadow: `0 0 0 3px ${MAMCET_RED}18` };
  const inputError = { borderColor: '#ef4444' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
  const errorText  = { fontSize: 12, color: '#ef4444', marginTop: 4 };

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 500,
        background: '#fff', borderRadius: 14,
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '92vh', overflow: 'hidden',
        animation: 'gmFadeUp .2s ease',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>Create Group</h2>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af', fontSize: 18, transition: '.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
          >✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* 1. Group Name */}
            <div>
              <label style={labelStyle}>Group Name <span style={{ color: MAMCET_RED }}>*</span></label>
              <input
                type="text"
                placeholder="e.g. CSE Batch 2024"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
                onFocus={e => Object.assign(e.target.style, inputFocus)}
                onBlur={e => { e.target.style.borderColor = errors.name ? '#ef4444' : '#ddd'; e.target.style.boxShadow = 'none'; }}
                style={{ ...inputBase, ...(errors.name ? inputError : {}) }}
              />
              {errors.name && <p style={errorText}>{errors.name}</p>}
            </div>

            {/* 2. Group Type — Segmented Buttons */}
            <div>
              <label style={labelStyle}>Group Type <span style={{ color: MAMCET_RED }}>*</span></label>
              <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd' }}>
                {TYPES.map(t => {
                  const active = formData.type === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.key, department: '', passoutYear: '', members: [] })}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        border: 'none',
                        borderRight: t.key !== 'custom' ? '1px solid #ddd' : 'none',
                        background: active ? MAMCET_RED : '#fff',
                        color: active ? '#fff' : '#6b7280',
                        fontWeight: active ? 700 : 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'background .15s, color .15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Dynamic Fields ── */}

            {/* Department (for batch + department types) */}
            {(formData.type === 'batch' || formData.type === 'department') && (
              <div>
                <label style={labelStyle}>Department <span style={{ color: MAMCET_RED }}>*</span></label>
                <select
                  value={formData.department}
                  onChange={(e) => { setFormData({ ...formData, department: e.target.value }); if (errors.department) setErrors({ ...errors, department: '' }); }}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => { e.target.style.borderColor = errors.department ? '#ef4444' : '#ddd'; e.target.style.boxShadow = 'none'; }}
                  style={{ ...inputBase, ...(errors.department ? inputError : {}), appearance: 'auto' }}
                >
                  <option value="">Select department</option>
                  {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p style={errorText}>{errors.department}</p>}
              </div>
            )}

            {/* Passout Year (batch only) */}
            {formData.type === 'batch' && (
              <div>
                <label style={labelStyle}>Passout Year <span style={{ color: MAMCET_RED }}>*</span></label>
                <select
                  value={formData.passoutYear}
                  onChange={(e) => { setFormData({ ...formData, passoutYear: e.target.value }); if (errors.passoutYear) setErrors({ ...errors, passoutYear: '' }); }}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => { e.target.style.borderColor = errors.passoutYear ? '#ef4444' : '#ddd'; e.target.style.boxShadow = 'none'; }}
                  style={{ ...inputBase, ...(errors.passoutYear ? inputError : {}), appearance: 'auto' }}
                >
                  <option value="">Select year</option>
                  {options.batches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.passoutYear && <p style={errorText}>{errors.passoutYear}</p>}
              </div>
            )}

            {/* Custom member search */}
            {formData.type === 'custom' && (
              <div>
                <label style={labelStyle}>
                  Add Members <span style={{ color: MAMCET_RED }}>*</span>
                  {formData.members.length > 0 && (
                    <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>({formData.members.length} selected)</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Search users by name…"
                  value={searchTerm}
                  onChange={handleSearchUsers}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
                  style={{ ...inputBase, marginBottom: searchResults.length > 0 || (searchTerm && !searching) ? 8 : 0 }}
                />

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div style={{
                    border: '1px solid #e5e7eb', borderRadius: 8,
                    maxHeight: 180, overflowY: 'auto',
                    background: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,.06)',
                  }}>
                    {searchResults.map((user, idx) => {
                      const selected = formData.members.includes(user._id);
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleMember(user)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', cursor: 'pointer',
                            background: selected ? '#fef2f2' : '#fff',
                            borderBottom: idx < searchResults.length - 1 ? '1px solid #f9fafb' : 'none',
                            transition: 'background .1s',
                          }}
                          onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = selected ? '#fef2f2' : '#fff'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <img
                              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=fee2e2&color=c84022&size=32`}
                              alt=""
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.department || 'General'} · {user.role}</div>
                            </div>
                          </div>
                          <div style={{
                            width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                            border: `1.5px solid ${selected ? MAMCET_RED : '#d1d5db'}`,
                            background: selected ? MAMCET_RED : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: '.15s',
                          }}>
                            {selected && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && !searching && (
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>No users found for "{searchTerm}"</p>
                )}
                {errors.members && <p style={errorText}>{errors.members}</p>}
              </div>
            )}

            {/* Description (optional) */}
            <div>
              <label style={labelStyle}>Description <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Brief description of the group purpose…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onFocus={e => Object.assign(e.target.style, inputFocus)}
                onBlur={e => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
                style={{ ...inputBase, resize: 'none', minHeight: 72 }}
              />
            </div>

            {/* Info banner */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
            }}>
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
                {formData.type === 'batch' && 'All active users matching the selected department and batch year will be auto-added.'}
                {formData.type === 'department' && 'Every active user from the selected department will be auto-added.'}
                {formData.type === 'custom' && 'Only manually selected users will be added to this group.'}
              </p>
            </div>
          </div>
        </form>

        {/* ── Footer ── */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f3f4f6',
          display: 'flex', gap: 12,
          background: '#fafafa',
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: 8,
              border: '1px solid #ddd', background: '#fff',
              color: '#374151', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: '.15s', opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !isValid()}
            style={{
              flex: 1, padding: '12px', borderRadius: 8,
              border: 'none',
              background: (!isValid() || loading) ? '#d1d5db' : MAMCET_RED,
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: (!isValid() || loading) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background .15s, opacity .15s',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={e => { if (isValid() && !loading) e.currentTarget.style.background = '#a50e24'; }}
            onMouseLeave={e => { if (isValid() && !loading) e.currentTarget.style.background = MAMCET_RED; }}
          >
            {loading && (
              <span style={{
                width: 16, height: 16, borderRadius: '50%', display: 'inline-block',
                border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                animation: 'gmSpin .6s linear infinite',
              }} />
            )}
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes gmFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gmSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default GroupModal;
