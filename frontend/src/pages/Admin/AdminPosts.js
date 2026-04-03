import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiSearch, FiRefreshCw, FiTrash2, FiEyeOff, FiEye,
  FiAlertTriangle, FiAlertOctagon, FiCheck, FiX,
  FiSlash, FiUserX, FiFilter, FiChevronLeft, FiChevronRight,
  FiFileText, FiFlag, FiShield, FiInfo, FiUser, FiMessageSquare,
  FiHeart, FiCalendar,
} from 'react-icons/fi';

/* ── Avatar colour ────────────────────────────────────────────── */
const COLORS = ['#6366f1','#14b8a6','#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899','#c84022'];
const ac = (n = '') => COLORS[n.charCodeAt(0) % COLORS.length];

/* ── Tiny toast ───────────────────────────────────────────────── */
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

/* ── Time ago helper ──────────────────────────────────────────── */
const timeAgo = d => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (h < 1) return `${m}m ago`;
  if (day < 1) return `${h}h ago`;
  return `${day}d ago`;
};

/* ── Filter tab config ────────────────────────────────────────── */
const TABS = [
  { key: 'all',      label: 'All Posts',  icon: FiFileText,     color: '#6366f1' },
  { key: 'reported', label: 'Reported',   icon: FiFlag,         color: '#ef4444' },
  { key: 'hidden',   label: 'Hidden',     icon: FiEyeOff,       color: '#f59e0b' },
  { key: 'recent',   label: 'Recent',     icon: FiCalendar,     color: '#10b981' },
];

/* ══════════════════════════════════════════════════════════════
   CONFIRM MODAL (shared)
══════════════════════════════════════════════════════════════ */
const ConfirmModal = ({ icon: Icon, iconColor, iconBg, title, sub, confirmLabel, confirmColor, onClose, onConfirm, saving }) => (
  <div className="am-modal-backdrop" onClick={onClose}>
    <div className="am-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
      <div className="am-confirm-body">
        <div className="am-confirm-icon" style={{ background: iconBg, color: iconColor }}>
          <Icon size={26} />
        </div>
        <div className="am-confirm-title">{title}</div>
        <div className="am-confirm-sub">{sub}</div>
      </div>
      <div className="am-modal-footer" style={{ justifyContent: 'center' }}>
        <button className="am-btn am-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button
          className="am-btn"
          onClick={onConfirm}
          disabled={saving}
          style={{ background: confirmColor, color: '#fff', border: 'none', fontWeight: 700 }}
        >
          {saving ? <ClipLoader size={13} color="#fff" /> : <><Icon size={14} /> {confirmLabel}</>}
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   REPORTERS MODAL (view who reported)
══════════════════════════════════════════════════════════════ */
const ReportersModal = ({ post, onClose }) => (
  <div className="am-modal-backdrop" onClick={onClose}>
    <div className="am-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
      <div className="am-modal-header">
        <span className="am-modal-title"><FiFlag size={14} color="#ef4444" /> Reporters ({post.reportCount || 0})</span>
        <button className="am-modal-close" onClick={onClose}><FiX size={18} /></button>
      </div>
      <div className="am-modal-body">
        {(!post.reportedBy || post.reportedBy.length === 0) ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '24px 0' }}>No reporters found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {post.reportedBy.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fafafa', borderRadius: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: ac(u.name || '?'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {(u.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || 'Unknown'}</div>
                  <div style={{ fontSize: 11.5, color: '#aaa' }}>{u.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="am-modal-footer">
        <button className="am-btn am-btn-ghost" onClick={onClose} style={{ margin: '0 auto' }}>Close</button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   POST CARD
══════════════════════════════════════════════════════════════ */
const PostCard = ({ post, onDelete, onHide, onBan, onDismiss, onViewReporters, actionId }) => {
  const pid     = post._id;
  const busy    = actionId === pid;
  const author  = post.userId || {};
  const initials= (author.name || post.userName || '?')[0]?.toUpperCase();
  const bg      = ac(author.name || post.userName || '');
  const isHidden    = post.isHidden;
  const isReported  = post.reportCount > 0;
  const isBanned    = author.status === 'Inactive';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1.5px solid ${isReported ? 'rgba(239,68,68,0.25)' : isHidden ? 'rgba(245,158,11,0.25)' : '#f0f0f0'}`,
      boxShadow: isReported ? '0 2px 12px rgba(239,68,68,0.06)' : '0 1px 6px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      opacity: busy ? 0.6 : 1,
      transition: 'opacity 0.2s',
      position: 'relative',
    }}>
      {/* Status stripe */}
      {(isHidden || isReported) && (
        <div style={{
          height: 3,
          background: isReported ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#f59e0b,#fcd34d)',
        }} />
      )}

      <div style={{ padding: '16px 20px' }}>
        {/* ── Header row ──────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>

          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%', background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
            position: 'relative',
          }}>
            {author.profilePic
              ? <img src={author.profilePic} alt={author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
            {isBanned && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiSlash size={8} color="#fff" />
              </div>
            )}
          </div>

          {/* Author info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
                {author.name || post.userName || 'Unknown'}
              </span>
              {author.role && (
                <span style={{ background: `${ac(author.role)}18`, color: ac(author.role), borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                  {author.role}
                </span>
              )}
              {isBanned && (
                <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                  🚫 Banned
                </span>
              )}
              {isHidden && (
                <span style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
                  👁‍🗨 Hidden
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: '#aaa', marginTop: 2 }}>
              {author.email && <span style={{ marginRight: 8 }}>{author.email}</span>}
              {timeAgo(post.createdAt)}
            </div>
          </div>

          {/* Report badge */}
          {isReported && (
            <button
              onClick={() => onViewReporters(post)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
              title="View reporters"
            >
              <FiFlag size={12} /> {post.reportCount} report{post.reportCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* ── Content ─────────────────────────── */}
        {post.content && (
          <p style={{ margin: '0 0 10px', fontSize: 14, color: '#444', lineHeight: 1.6, wordBreak: 'break-word' }}>
            {post.content.length > 300 ? `${post.content.slice(0, 300)}…` : post.content}
          </p>
        )}

        {/* Media thumbnail */}
        {post.media && (
          <div style={{ marginBottom: 10 }}>
            <img
              src={post.media}
              alt="post media"
              style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 10, objectFit: 'cover', border: '1px solid #f0f0f0' }}
            />
          </div>
        )}

        {/* ── Stats + Actions row ──────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#aaa' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiHeart size={12} color="#ec4899" /> {post.likes || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiMessageSquare size={12} color="#6366f1" /> {post.comments?.length || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiUser size={12} /> {author.department || '—'}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {busy ? <ClipLoader size={16} color="#6366f1" /> : (
              <>
                {/* Dismiss reports */}
                {isReported && (
                  <button
                    onClick={() => onDismiss(post)}
                    title="Dismiss all reports"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#059669', fontSize: 12, fontWeight: 600 }}
                  >
                    <FiCheck size={12} /> Dismiss
                  </button>
                )}
                {/* Hide / Show */}
                <button
                  onClick={() => onHide(post)}
                  title={isHidden ? 'Restore to feed' : 'Hide from feed'}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: isHidden ? 'rgba(99,102,241,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isHidden ? 'rgba(99,102,241,0.18)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: isHidden ? '#6366f1' : '#d97706', fontSize: 12, fontWeight: 600 }}
                >
                  {isHidden ? <><FiEye size={12} /> Show</> : <><FiEyeOff size={12} /> Hide</>}
                </button>
                {/* Ban user */}
                {author._id && (
                  <button
                    onClick={() => onBan(post)}
                    title={isBanned ? 'Unban user' : 'Ban user'}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, background: isBanned ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${isBanned ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: isBanned ? '#059669' : '#ef4444', fontSize: 12, fontWeight: 600 }}
                  >
                    <FiUserX size={12} /> {isBanned ? 'Unban' : 'Ban'}
                  </button>
                )}
                {/* Delete */}
                <button
                  onClick={() => onDelete(post)}
                  title="Delete post permanently"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(200,64,34,0.08)', border: '1px solid rgba(200,64,34,0.18)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#c84022', fontSize: 12, fontWeight: 600 }}
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const AdminPosts = () => {
  const [posts,      setPosts]      = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [stats,      setStats]      = useState({ total: 0, reportedCount: 0, hiddenCount: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  /* filters */
  const [tab,         setTab]         = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);

  /* action state */
  const [actionId,  setActionId]  = useState(null);

  /* modals */
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [banTarget,     setBanTarget]     = useState(null);
  const [dismissTarget, setDismissTarget] = useState(null);
  const [reportersPost, setReportersPost] = useState(null);

  /* saving states for modals */
  const [delSaving,     setDelSaving]     = useState(false);
  const [banSaving,     setBanSaving]     = useState(false);
  const [dismissSaving, setDismissSaving] = useState(false);

  const { toasts, add: toast } = useToast();
  const timerRef = useRef(null);

  /* ── Debounce search ────────────────────── */
  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  /* ── Fetch ─────────────────────────────── */
  const fetchPosts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminService.getModerationPosts({ filter: tab, search, page, limit: 15 });
      setPosts(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 });
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load posts.';
      setError(msg); toast(msg, 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, search, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  /* ── Tab change ────────────────────────── */
  const handleTab = key => { setTab(key); setPage(1); };

  /* ── Hide toggle (inline — no modal) ──── */
  const handleHide = async post => {
    setActionId(post._id);
    try {
      const res = await adminService.toggleHidePost(post._id);
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, isHidden: res.data.data.isHidden } : p));
      toast(res.data.message, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed.', 'error');
    } finally { setActionId(null); }
  };

  /* ── Delete ────────────────────────────── */
  const handleDeleteConfirm = async () => {
    setDelSaving(true);
    try {
      await adminService.deletePost(deleteTarget._id);
      setPosts(prev => prev.filter(p => p._id !== deleteTarget._id));
      setPagination(p => ({ ...p, total: p.total - 1 }));
      toast('🗑️ Post deleted permanently.', 'success');
      setDeleteTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setDelSaving(false); }
  };

  /* ── Ban user ──────────────────────────── */
  const handleBanConfirm = async () => {
    setBanSaving(true);
    const authorId = banTarget.userId?._id;
    try {
      const res = await adminService.banUser(authorId);
      // Update the post's author status in the list
      setPosts(prev => prev.map(p =>
        p.userId?._id === authorId
          ? { ...p, userId: { ...p.userId, status: res.data.data.status } }
          : p
      ));
      toast(res.data.message, 'success');
      setBanTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Ban failed.', 'error');
    } finally { setBanSaving(false); }
  };

  /* ── Dismiss reports ───────────────────── */
  const handleDismissConfirm = async () => {
    setDismissSaving(true);
    try {
      await adminService.dismissReports(dismissTarget._id);
      setPosts(prev => prev.map(p =>
        p._id === dismissTarget._id ? { ...p, reportCount: 0, reportedBy: [] } : p
      ));
      toast('✅ Reports dismissed.', 'success');
      setDismissTarget(null);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed.', 'error');
    } finally { setDismissSaving(false); }
  };

  /* ── Pagination helper ─────────────────── */
  const getPages = () => {
    const { totalPages } = pagination;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const p = pagination.page;
    return [...new Set([1, totalPages, p, p - 1, p + 1])].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  };

  const isBanned = u => u?.status === 'Inactive';

  /* ══════════════════════════════════════ */
  return (
    <div>
      {/* ── Page header ───────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Post Moderation</div>
          <div className="ap-section-sub">
            Manage, hide, delete posts and ban users from the platform feed.
          </div>
        </div>
        <button
          className="am-btn am-btn-ghost"
          onClick={fetchPosts}
          title="Refresh"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stats chips ───────────────────────── */}
      <div className="am-stats-bar">
        <div className="am-stat-chip">
          <FiFileText size={14} color="#6366f1" />
          <span><strong>{stats.total}</strong> total posts</span>
        </div>
        <div className="am-stat-chip" style={{ color: '#ef4444' }}>
          <FiFlag size={14} color="#ef4444" />
          <span><strong>{stats.reportedCount}</strong> reported</span>
        </div>
        <div className="am-stat-chip" style={{ color: '#d97706' }}>
          <FiEyeOff size={14} color="#d97706" />
          <span><strong>{stats.hiddenCount}</strong> hidden</span>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 16px', borderRadius: 100, cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              border: tab === t.key ? 'none' : '1.5px solid #e8e8e8',
              background: tab === t.key ? t.color : '#fff',
              color: tab === t.key ? '#fff' : '#666',
              boxShadow: tab === t.key ? `0 3px 12px ${t.color}44` : 'none',
            }}
          >
            <t.icon size={13} />
            {t.label}
            {t.key === 'reported' && stats.reportedCount > 0 && (
              <span style={{ background: tab === t.key ? 'rgba(255,255,255,0.25)' : '#ef4444', color: '#fff', borderRadius: 20, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>
                {stats.reportedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search bar ────────────────────────── */}
      <div className="am-toolbar" style={{ marginBottom: 16 }}>
        <div className="am-search-wrap" style={{ flex: 1 }}>
          <FiSearch size={14} className="am-search-icon" />
          <input
            className="am-search-input"
            placeholder="Search post content or author name…"
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        {searchInput && (
          <button className="am-btn am-btn-ghost" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
            <FiX size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Error banner ──────────────────────── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '11px 16px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          <FiAlertTriangle size={15} /> {error}
        </div>
      )}

      {/* ── Content ───────────────────────────── */}
      {loading ? (
        <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
          <ClipLoader color="#6366f1" size={38} />
        </div>
      ) : posts.length === 0 ? (
        <div className="am-empty">
          <div className="am-empty-icon">{tab === 'reported' ? '🚩' : tab === 'hidden' ? '👁' : '📝'}</div>
          <div className="am-empty-title">No posts found</div>
          <div className="am-empty-sub">
            {tab === 'reported' ? 'No reported posts — the feed is clean!' :
             tab === 'hidden'   ? 'No hidden posts at the moment.' :
             search             ? 'Try a different search term.' :
                                  'No posts in the feed yet.'}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                actionId={actionId}
                onDelete={setDeleteTarget}
                onHide={handleHide}
                onBan={setBanTarget}
                onDismiss={setDismissTarget}
                onViewReporters={setReportersPost}
              />
            ))}
          </div>

          {/* ── Pagination ──────────────────────── */}
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

      {/* ══ MODALS ══════════════════════════════ */}

      {/* Delete */}
      {deleteTarget && (
        <ConfirmModal
          icon={FiTrash2}
          iconColor="#c84022"
          iconBg="rgba(200,64,34,0.1)"
          title="Delete Post Permanently?"
          sub={<>This will permanently remove <strong>{deleteTarget.userName || 'this user'}'s</strong> post. This action cannot be undone.</>}
          confirmLabel="Delete"
          confirmColor="#c84022"
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          saving={delSaving}
        />
      )}

      {/* Ban */}
      {banTarget && (() => {
        const targetUser = banTarget.userId || {};
        const alreadyBanned = targetUser.status === 'Inactive';
        return (
          <ConfirmModal
            icon={FiUserX}
            iconColor={alreadyBanned ? '#059669' : '#ef4444'}
            iconBg={alreadyBanned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
            title={alreadyBanned ? `Unban ${targetUser.name}?` : `Ban ${targetUser.name}?`}
            sub={
              alreadyBanned
                ? <>This will <strong>reinstate</strong> <strong>{targetUser.name}'s</strong> account and allow them to log in again.</>
                : <>This will <strong>suspend</strong> <strong>{targetUser.name}'s</strong> account. They will be unable to log in until reinstated.</>
            }
            confirmLabel={alreadyBanned ? 'Unban User' : 'Ban User'}
            confirmColor={alreadyBanned ? '#059669' : '#ef4444'}
            onClose={() => setBanTarget(null)}
            onConfirm={handleBanConfirm}
            saving={banSaving}
          />
        );
      })()}

      {/* Dismiss reports */}
      {dismissTarget && (
        <ConfirmModal
          icon={FiShield}
          iconColor="#6366f1"
          iconBg="rgba(99,102,241,0.1)"
          title="Dismiss All Reports?"
          sub={<>Mark this post as reviewed and clear all <strong>{dismissTarget.reportCount}</strong> report(s). The post will remain visible.</>}
          confirmLabel="Dismiss Reports"
          confirmColor="#6366f1"
          onClose={() => setDismissTarget(null)}
          onConfirm={handleDismissConfirm}
          saving={dismissSaving}
        />
      )}

      {/* Reporters list */}
      {reportersPost && (
        <ReportersModal post={reportersPost} onClose={() => setReportersPost(null)} />
      )}

      {/* ── Toast stack ───────────────────────── */}
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

export default AdminPosts;
