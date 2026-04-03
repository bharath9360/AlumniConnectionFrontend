import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────
   GROUP CONFIG PANEL — SaaS‑style member management modal
   Inline styles · MAMCET red theme
───────────────────────────────────────────────────────────── */
const MAMCET_RED = '#C8102E';

const GroupMemberModal = ({ group, onClose }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const [departments, setDepartments] = useState([]);
  const [batches, setBatches]         = useState([]);
  const [bulkFilter, setBulkFilter]   = useState({ type: 'department', value: '' });
  const [bulkLoading, setBulkLoading] = useState(false);

  /* ── Fetch members ── */
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/groups/${group._id}/members`);
      if (res.data.success) setMembers(res.data.data);
    } catch (e) { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  }, [group._id]);

  const fetchFilters = async () => {
    try {
      const res = await api.get('/groups/utils/departments-batches');
      if (res.data.success) {
        setDepartments(res.data.data.departments);
        setBatches(res.data.data.batches);
      }
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchMembers(); fetchFilters(); }, [fetchMembers]);

  /* ── Remove member ── */
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/groups/${group._id}/members/${userId}`);
      if (res.data.success) {
        toast.success('Member removed');
        setMembers(prev => prev.filter(m => (m.userId?._id || m.userId) !== userId));
      }
    } catch (e) { toast.error('Failed to remove'); }
  };

  /* ── Bulk add ── */
  const handleBulkAdd = async () => {
    if (!bulkFilter.value) return toast.error(`Select a ${bulkFilter.type}`);
    try {
      setBulkLoading(true);
      const payload = {};
      if (bulkFilter.type === 'department') payload.department = bulkFilter.value;
      if (bulkFilter.type === 'batch') payload.batch = bulkFilter.value;
      const res = await api.post(`/groups/${group._id}/bulk-add`, payload);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMembers();
        setActiveTab('members');
      }
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to add'); }
    finally { setBulkLoading(false); }
  };

  /* ── Close on backdrop ── */
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  /* ── Shared styles ── */
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 14, color: '#1f2937', background: '#fff',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s', appearance: 'auto',
  };

  const chipColor = group.type === 'batch' ? '#065f46' : group.type === 'department' ? '#3730a3' : '#374151';

  const TABS = [
    { key: 'members',  label: 'Members' },
    { key: 'bulk_add', label: 'Add Users' },
  ];

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 600, background: '#fff',
        borderRadius: 16, border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
        animation: 'gmcFadeUp .2s ease',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#374151',
            }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {group.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Manage and organize participants</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 20, background: '#f3f4f6', color: chipColor,
                }}>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af', fontSize: 18, transition: '.15s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af'; }}
          >✕</button>
        </div>

        {/* ── Segment Control ── */}
        <div style={{ display: 'flex', gap: 0, margin: '0 24px', marginTop: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #ddd', flexShrink: 0 }}>
          {TABS.map(t => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1, padding: '9px 0', border: 'none',
                  borderRight: t.key !== 'bulk_add' ? '1px solid #ddd' : 'none',
                  background: active ? MAMCET_RED : '#fff',
                  color: active ? '#fff' : '#6b7280',
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit', transition: '.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? MAMCET_RED : '#fff'; }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: MAMCET_RED }} />
                <p style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>Loading members…</p>
              </div>
            ) : members.length === 0 ? (
              /* Empty state */
              <div style={{
                textAlign: 'center', padding: '48px 16px',
                background: '#fafafa', borderRadius: 12,
                border: '1.5px dashed #d1d5db',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>No Members Yet</h4>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>Switch to "Add Users" to populate this group.</p>
                <button
                  onClick={() => setActiveTab('bulk_add')}
                  style={{
                    marginTop: 16, padding: '8px 20px', borderRadius: 8,
                    border: 'none', background: '#111827', color: '#fff',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Add Users
                </button>
              </div>
            ) : (
              /* Member list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(member => (
                  <div
                    key={member._id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #e5e7eb', background: '#fff',
                      transition: 'border-color .15s, box-shadow .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <img
                        src={member.userId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.userId?.name || '?')}&background=fee2e2&color=c84022&size=36`}
                        alt=""
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e5e7eb' }}
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.userId?.name || '?')}`; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.userId?.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {member.userId?.role} · {member.userId?.department || 'General'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.userId?._id)}
                      title="Remove"
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: '#d1d5db', padding: 6, borderRadius: 6,
                        display: 'flex', transition: '.15s', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ADD USERS TAB */}
          {activeTab === 'bulk_add' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Step 1: Category */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                  Step 1 — Choose Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { key: 'department', title: 'Department', desc: 'Group users by dept' },
                    { key: 'batch',      title: 'Batch Year',  desc: 'Group by graduation year' },
                  ].map(opt => {
                    const active = bulkFilter.type === opt.key;
                    return (
                      <div
                        key={opt.key}
                        onClick={() => setBulkFilter({ type: opt.key, value: '' })}
                        style={{
                          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${active ? MAMCET_RED : '#e5e7eb'}`,
                          background: active ? '#fef2f2' : '#fff',
                          transition: 'border-color .15s, background .15s',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#d1d5db'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? MAMCET_RED : '#e5e7eb'; }}
                      >
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: active ? MAMCET_RED : '#111827' }}>{opt.title}</h4>
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9ca3af' }}>{opt.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Target */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Step 2 — Select Target
                </label>
                <select
                  value={bulkFilter.value}
                  onChange={(e) => setBulkFilter({ ...bulkFilter, value: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = MAMCET_RED; e.target.style.boxShadow = `0 0 0 3px ${MAMCET_RED}18`; }}
                  onBlur={e => { e.target.style.borderColor = '#ddd'; e.target.style.boxShadow = 'none'; }}
                  style={inputStyle}
                >
                  <option value="">-- Choose {bulkFilter.type === 'department' ? 'department' : 'batch year'} --</option>
                  {bulkFilter.type === 'department'
                    ? departments.map(d => <option key={d} value={d}>{d}</option>)
                    : batches.map(b => <option key={b} value={b}>{b}</option>)
                  }
                </select>
              </div>

              {/* Helper text */}
              {bulkFilter.value && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8,
                  background: '#fef2f2', border: '1px solid #fecaca',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
                  <p style={{ margin: 0, fontSize: 12, color: '#991b1b', lineHeight: 1.4 }}>
                    All active users matching <strong>{bulkFilter.value}</strong> will be synced into this group.
                  </p>
                </div>
              )}

              {/* Step 3: Action */}
              <button
                onClick={handleBulkAdd}
                disabled={bulkLoading || !bulkFilter.value}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: 'none',
                  background: (!bulkFilter.value || bulkLoading) ? '#d1d5db' : MAMCET_RED,
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: (!bulkFilter.value || bulkLoading) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (bulkFilter.value && !bulkLoading) e.currentTarget.style.background = '#a50e24'; }}
                onMouseLeave={e => { if (bulkFilter.value && !bulkLoading) e.currentTarget.style.background = MAMCET_RED; }}
              >
                {bulkLoading ? (
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', display: 'inline-block',
                    border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff',
                    animation: 'gmcSpin .6s linear infinite',
                  }} />
                ) : null}
                {bulkLoading ? 'Syncing…' : 'Sync Users'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes gmcFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes gmcSpin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default GroupMemberModal;
