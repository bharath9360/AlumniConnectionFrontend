import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import GroupModal from '../../components/admin/GroupModal';
import GroupMemberModal from '../../components/admin/GroupMemberModal';

/* ─────────────────────────────────────────────────────────────
   GROUP MANAGEMENT PAGE  —  SaaS-style admin interface
   MAMCET red-white theme · Inline styles only
───────────────────────────────────────────────────────────── */
const MAMCET_RED = '#C8102E';

const GroupManagementPanel = () => {
  const navigate = useNavigate();
  const [groups, setGroups]   = useState([]);
  const [loading, setLoading] = useState(true);

  const [isGroupModalOpen, setIsGroupModalOpen]             = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);

  /* ── Fetch ── */
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      if (res.data.success) setGroups(res.data.data);
    } catch (e) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  /* ── Delete ── */
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group? All members will be removed.')) return;
    try {
      const res = await api.delete(`/groups/${groupId}`);
      if (res.data.success) { toast.success('Group deleted'); fetchGroups(); }
    } catch (e) { toast.error('Failed to delete group'); }
  };

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:      groups.length,
    batch:      groups.filter(g => g.type === 'batch').length,
    department: groups.filter(g => g.type === 'department').length,
    custom:     groups.filter(g => g.type === 'custom').length,
    members:    groups.reduce((sum, g) => sum + (g.memberCount || 0), 0),
  }), [groups]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* ────── Shared styles ────── */
  const chipColor = (type) => {
    if (type === 'batch')      return { bg: '#ecfdf5', text: '#065f46' };
    if (type === 'department') return { bg: '#eef2ff', text: '#3730a3' };
    return { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px', width: '100%', boxSizing: 'border-box' }}>

      {/* ══════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, marginBottom: 24,
      }}>
        {/* Left */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <button
              onClick={() => navigate('/admin')}
              title="Back to Admin Dashboard"
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: '#9ca3af', display: 'flex', padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = MAMCET_RED; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>Group Management</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', paddingLeft: 28 }}>Organize users into batch, department, or custom groups</p>
        </div>

        {/* Right — CTA */}
        <button
          onClick={() => setIsGroupModalOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: MAMCET_RED, color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
            boxShadow: '0 2px 8px rgba(200,16,46,.25)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#a50e24'; }}
          onMouseLeave={e => { e.currentTarget.style.background = MAMCET_RED; }}
        >
          <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1 }}>+</span>
          Create Group
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════ */}
      {!loading && groups.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Total Groups',      value: stats.total,      color: '#111827' },
            { label: 'Batch Groups',       value: stats.batch,      color: '#065f46' },
            { label: 'Department Groups',  value: stats.department, color: '#3730a3' },
            { label: 'Total Members',      value: stats.members,    color: MAMCET_RED },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
              padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.3px' }}>{s.label}</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          CONTENT
      ══════════════════════════════════════════════ */}
      {loading ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px', background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 14,
        }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: MAMCET_RED }} />
          <p style={{ marginTop: 16, color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>Loading groups…</p>
        </div>
      ) : groups.length === 0 ? (
        /* ── Empty State ── */
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          background: '#fafafa', borderRadius: 16,
          border: '1.5px dashed #d1d5db',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#fef2f2', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 30,
          }}>
            👥
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>No Groups Yet</h3>
          <p style={{ margin: '8px auto 0', fontSize: 13, color: '#6b7280', maxWidth: 300, lineHeight: 1.5 }}>
            Create your first group to organize alumni and students into batches, departments, or custom cohorts.
          </p>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: MAMCET_RED, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(200,16,46,.25)',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 400 }}>+</span>
            Create First Group
          </button>
        </div>
      ) : (
        /* ── Group Cards Grid ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {groups.map(group => {
            const c = chipColor(group.type);
            return (
              <div
                key={group._id}
                style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 12, padding: '20px',
                  display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow .2s, border-color .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                {/* Top row — Type chip + Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.5px', padding: '3px 10px', borderRadius: 6,
                    background: c.bg, color: c.text,
                  }}>
                    {group.type}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                    {formatDate(group.createdAt)}
                  </span>
                </div>

                {/* Name + members */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: '#f3f4f6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#374151',
                  }}>
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{
                      margin: 0, fontSize: 15, fontWeight: 700, color: '#111827',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {group.name}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: 12.5, color: '#9ca3af', lineHeight: 1.5,
                  margin: '0 0 16px', minHeight: 36,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {group.description || 'No description provided.'}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => setSelectedGroupForMembers(group)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8,
                      border: 'none', background: '#111827', color: '#fff',
                      fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'background .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#1f2937'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#111827'; }}
                  >
                    Manage Members
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group._id)}
                    style={{
                      padding: '9px 14px', borderRadius: 8,
                      border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af',
                      fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                      fontFamily: 'inherit', transition: '.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = '#fff'; }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {isGroupModalOpen && (
        <GroupModal
          onClose={() => setIsGroupModalOpen(false)}
          onSuccess={() => { setIsGroupModalOpen(false); fetchGroups(); }}
        />
      )}
      {selectedGroupForMembers && (
        <GroupMemberModal
          group={selectedGroupForMembers}
          onClose={() => { setSelectedGroupForMembers(null); fetchGroups(); }}
        />
      )}
    </div>
  );
};

export default GroupManagementPanel;
