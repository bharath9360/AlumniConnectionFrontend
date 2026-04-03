import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { postService, adminService } from '../../services/api';
import FeedItem from '../Alumni/components/FeedItem';
import Toast from '../../components/common/Toast';
import { ClipLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import {
    FaClipboardCheck, FaBriefcase, FaCalendarAlt,
    FaUserShield, FaUsers, FaChartLine, FaNewspaper,
    FaBell, FaUserPlus, FaUpload, FaTimes, FaCheck,
} from 'react-icons/fa';
import { FiX, FiInfo, FiAlertTriangle } from 'react-icons/fi';

/* ─────────────────────────────────────────────────────────────
   ADD ALUMNI INLINE MODAL
───────────────────────────────────────────────────────────── */
const DEPT_OPTIONS = ['CSE','IT','ECE','EEE','MECH','CIVIL','MBA','MCA'];
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) =>
    String(new Date().getFullYear() - i)
);

const AddAlumniModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: '', email: '', department: '', batch: '',
        graduationYear: '', phone: '', status: 'Active',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.email.trim()) {
            setError('Name and Email are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await adminService.addAlumni({ ...form, role: 'alumni' });
            onSuccess('Alumni added successfully!');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add alumni. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{ position:'fixed', inset:0, background:'rgba(10,8,30,0.6)',
                zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center',
                padding:16, backdropFilter:'blur(4px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity:0, scale:0.95 }}
                animate={{ opacity:1, scale:1 }}
                style={{ background:'#fff', borderRadius:18, width:'100%', maxWidth:520,
                    boxShadow:'0 24px 80px rgba(0,0,0,0.22)', overflow:'hidden' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding:'18px 22px', background:'linear-gradient(135deg,#0f0c1d,#1a1035)',
                    display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10,
                            background:'rgba(200,64,34,0.25)', display:'flex',
                            alignItems:'center', justifyContent:'center' }}>
                            <FaUserPlus size={16} color="#ff6b47" />
                        </div>
                        <div>
                            <div style={{ color:'#fff', fontWeight:800, fontSize:15 }}>Quick Add Alumni</div>
                            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>
                                Creates an Active alumni account immediately
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose}
                        style={{ background:'rgba(255,255,255,0.1)', border:'none',
                            borderRadius:8, width:32, height:32, cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                        <FiX size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding:'20px 22px' }}>
                    {error && (
                        <div style={{ display:'flex', gap:8, alignItems:'center',
                            background:'rgba(200,64,34,0.06)', border:'1px solid rgba(200,64,34,0.2)',
                            borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#c84022' }}>
                            <FiAlertTriangle size={14} />
                            {error}
                        </div>
                    )}

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        {/* Name */}
                        <div style={{ gridColumn:'1/-1' }}>
                            <label style={labelSt}>Full Name *</label>
                            <input value={form.name} onChange={e => set('name', e.target.value)}
                                placeholder="Aarav Kumar" style={inputSt} />
                        </div>
                        {/* Email */}
                        <div style={{ gridColumn:'1/-1' }}>
                            <label style={labelSt}>Email *</label>
                            <input value={form.email} onChange={e => set('email', e.target.value)}
                                placeholder="aarav@example.com" type="email" style={inputSt} />
                        </div>
                        {/* Dept */}
                        <div>
                            <label style={labelSt}>Department</label>
                            <select value={form.department} onChange={e => set('department', e.target.value)}
                                style={inputSt}>
                                <option value="">Select</option>
                                {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        {/* Batch / Join Year */}
                        <div>
                            <label style={labelSt}>Join Year (Batch)</label>
                            <input value={form.batch} onChange={e => set('batch', e.target.value)}
                                placeholder="2020" style={inputSt} />
                        </div>
                        {/* Graduation Year */}
                        <div>
                            <label style={labelSt}>Graduation Year</label>
                            <select value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)}
                                style={inputSt}>
                                <option value="">Select</option>
                                {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                        {/* Phone */}
                        <div>
                            <label style={labelSt}>Phone</label>
                            <input value={form.phone} onChange={e => set('phone', e.target.value)}
                                placeholder="+91 XXXXX XXXXX" style={inputSt} />
                        </div>
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:14,
                        padding:'10px 13px', background:'rgba(16,185,129,0.06)',
                        border:'1px solid rgba(16,185,129,0.2)', borderRadius:9, fontSize:12, color:'#059669' }}>
                        <FiInfo size={13} />
                        Account will be set to <strong style={{ marginLeft:3 }}>Active</strong>.
                        Default password = email prefix before '@'.
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding:'14px 22px', background:'#fafafa',
                    borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'flex-end', gap:10 }}>
                    <button onClick={onClose} disabled={saving}
                        style={{ padding:'9px 18px', border:'1.5px solid #e8e8e8', borderRadius:10,
                            background:'#fff', fontSize:13, cursor:'pointer', fontWeight:600, color:'#555' }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px',
                            border:'none', borderRadius:10,
                            background: saving ? '#e0e0e0' : 'linear-gradient(135deg,#c84022,#e8334a)',
                            color: saving ? '#aaa' : '#fff', fontSize:13, cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight:700, boxShadow: saving ? 'none' : '0 3px 12px rgba(200,64,34,0.35)' }}>
                        {saving ? <ClipLoader size={13} color="#aaa" /> : <FaCheck size={12} />}
                        {saving ? 'Adding…' : 'Add Alumni'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const labelSt = {
    display:'block', fontSize:11.5, fontWeight:700, color:'#666',
    marginBottom:5, textTransform:'uppercase', letterSpacing:'0.4px',
};
const inputSt = {
    width:'100%', padding:'9px 12px', border:'1.5px solid #e8e8e8',
    borderRadius:9, fontSize:13, outline:'none', fontFamily:'inherit',
    background:'#fafafa', boxSizing:'border-box',
};

/* ─────────────────────────────────────────────────────────────
   QUICK ACTIONS GRID
───────────────────────────────────────────────────────────── */
const ACTIONS = [
    {
        id: 'add-alumni',
        icon: FaUserPlus,
        label: 'Add Alumni',
        sub: 'Create alumni account',
        color: '#c84022',
        bg: 'rgba(200,64,34,0.08)',
        action: 'modal', // handled separately
    },
    {
        id: 'approve-alumni',
        icon: FaClipboardCheck,
        label: 'Approve Alumni',
        sub: 'Review pending requests',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.08)',
        to: '/admin/alumni',
    },
    {
        id: 'post-job',
        icon: FaBriefcase,
        label: 'Post a Job',
        sub: 'Add job opportunity',
        color: '#6f42c1',
        bg: 'rgba(111,66,193,0.08)',
        to: '/admin/jobs',
    },
    {
        id: 'add-event',
        icon: FaCalendarAlt,
        label: 'Add Event',
        sub: 'Create new event',
        color: '#fd7e14',
        bg: 'rgba(253,126,20,0.08)',
        to: '/admin/events',
    },
    {
        id: 'send-notif',
        icon: FaBell,
        label: 'Send Notification',
        sub: 'Broadcast to users',
        color: '#14b8a6',
        bg: 'rgba(20,184,166,0.08)',
        to: '/admin/broadcast',
    },
    {
        id: 'bulk-upload',
        icon: FaUpload,
        label: 'Bulk Upload',
        sub: 'Import students/alumni',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        to: '/admin/import',
    },
];

const QuickActionsGrid = ({ onAddAlumni }) => {
    const navigate = useNavigate();
    const [loadingId, setLoadingId] = useState(null);

    const handleClick = async (action) => {
        if (action.action === 'modal') { onAddAlumni(); return; }
        setLoadingId(action.id);
        await new Promise(r => setTimeout(r, 180)); // micro-delay for visual feedback
        navigate(action.to);
        setLoadingId(null);
    };

    return (
        <div className="dashboard-card bg-white rounded-4 shadow-sm border-0 p-3 mb-4">
            <div className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: 14, color: '#333' }}>
                <FaChartLine style={{ color: '#c84022' }} />
                Quick Actions
            </div>
            <div className="row g-2 ap-quick-actions-grid"
                style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10 }}>
                {ACTIONS.map(action => {
                    const Icon = action.icon;
                    const isLoading = loadingId === action.id;
                    return (
                        <button
                            key={action.id}
                            onClick={() => handleClick(action)}
                            disabled={!!loadingId}
                            style={{
                                display:'flex', flexDirection:'column', alignItems:'center',
                                gap:8, padding:'14px 10px', borderRadius:12, cursor:'pointer',
                                border:`1.5px solid ${loadingId ? '#f0f0f0' : 'transparent'}`,
                                background: action.bg, transition:'transform 0.15s, box-shadow 0.15s',
                                opacity: loadingId && !isLoading ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!loadingId) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; }}}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                        >
                            <div style={{ width:42, height:42, borderRadius:'50%', background:'#fff',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                boxShadow:'0 2px 8px rgba(0,0,0,0.08)', flexShrink:0 }}>
                                {isLoading
                                    ? <ClipLoader size={16} color={action.color} />
                                    : <Icon size={17} style={{ color: action.color }} />}
                            </div>
                            <div style={{ textAlign:'center' }}>
                                <div style={{ fontSize:12.5, fontWeight:700, color:'#222', lineHeight:1.3 }}>
                                    {action.label}
                                </div>
                                <div style={{ fontSize:10.5, color:'#999', marginTop:2, lineHeight:1.3 }}>
                                    {action.sub}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   ADMIN STATS SIDEBAR
───────────────────────────────────────────────────────────── */
const AdminStatsSidebar = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminService.getStats()
            .then(res => { if (res.data?.data) setStats(res.data.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="d-flex flex-column gap-3">
            {/* Admin Mini Profile */}
            <motion.div
                className="dashboard-card bg-white rounded-4 shadow-sm border-0 overflow-hidden"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="w-100" style={{ height: 64, background: 'linear-gradient(135deg, #1a1a2e 0%, #c84022 100%)' }} />
                <div className="px-3 pb-3 text-center" style={{ marginTop: -32 }}>
                    <div
                        className="rounded-circle border border-3 border-white mx-auto overflow-hidden bg-light d-flex align-items-center justify-content-center fw-bold text-secondary"
                        style={{ width: 64, height: 64, fontSize: 22 }}
                    >
                        {user?.profilePic
                            ? <img src={user.profilePic} alt="admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (user?.name?.[0]?.toUpperCase() || 'A')}
                    </div>
                    <div className="fw-bold mt-2" style={{ fontSize: 15 }}>{user?.name}</div>
                    <div className="badge mt-1" style={{ backgroundColor: '#c84022', fontSize: 11 }}>
                        <FaUserShield className="me-1" />Administrator
                    </div>
                    <Link to="/admin/profile" className="btn btn-outline-danger btn-sm rounded-pill mt-2 w-100" style={{ fontSize: 12 }}>
                        Edit Profile
                    </Link>
                </div>
            </motion.div>

            {/* Live Stats */}
            <motion.div
                className="dashboard-card bg-white rounded-4 shadow-sm border-0 p-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="fw-bold mb-3" style={{ fontSize: 14, color: '#c84022' }}>
                    <FaChartLine className="me-2" />Platform Stats
                </div>
                {loading ? (
                    <div className="text-center py-2"><ClipLoader size={20} color="#c84022" /></div>
                ) : stats ? (
                    <>
                        {[
                            { label: 'Total Users',    value: stats.totalUsers    || 0, color: '#0d6efd' },
                            { label: 'Total Posts',    value: stats.totalPosts    || 0, color: '#198754' },
                            { label: 'Pending Alumni', value: stats.pendingAlumni || 0, color: stats.pendingAlumni > 0 ? '#c84022' : '#198754' },
                            { label: 'Pending Jobs',   value: stats.pendingJobs   || 0, color: stats.pendingJobs   > 0 ? '#fd7e14' : '#198754' },
                            { label: 'Pending Events', value: stats.pendingEvents || 0, color: stats.pendingEvents > 0 ? '#fd7e14' : '#198754' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="d-flex justify-content-between align-items-center py-1 border-bottom" style={{ fontSize: 13 }}>
                                <span className="text-muted">{label}</span>
                                <span className="fw-bold" style={{ color }}>{value}</span>
                            </div>
                        ))}
                        <button
                            className="btn btn-sm text-white w-100 fw-bold rounded-pill mt-3"
                            style={{ backgroundColor: '#c84022', fontSize: 13 }}
                            onClick={() => navigate('/admin/approvals')}
                        >
                            <FaClipboardCheck className="me-2" />Review Approvals
                        </button>
                    </>
                ) : (
                    <p className="text-muted small mb-0">Could not load stats.</p>
                )}
            </motion.div>

            {/* Notifications shortcut */}
            <motion.div
                className="dashboard-card bg-white rounded-4 shadow-sm border-0 p-3"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="fw-bold mb-2" style={{ fontSize: 14, color: '#333' }}>
                    <FaBell className="me-2" style={{ color: '#fd7e14' }} />Notifications
                </div>
                <p className="text-muted small mb-2">View system alerts and approval notifications.</p>
                <Link to="/notifications" className="btn btn-outline-warning btn-sm rounded-pill w-100" style={{ fontSize: 12 }}>
                    View Alerts
                </Link>
            </motion.div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   ADMIN HOME — MAIN
───────────────────────────────────────────────────────────── */
const AdminHome = () => {
    const { user } = useAuth();
    const [feedData, setFeedData]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [toast, setToast]           = useState(null);
    const [showAddAlumni, setShowAddAlumni] = useState(false);

    const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

    useEffect(() => {
        const loadFeed = async () => {
            try {
                setLoading(true);
                const res = await postService.getFeed();
                setFeedData(res.data.data || []);
            } catch {
                showToast('Failed to load feed.', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadFeed();
    }, [showToast]);

    const handleLike = async (postId) => {
        try {
            const res = await postService.likePost(postId);
            setFeedData(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data.data : p));
        } catch { showToast('Could not update like.', 'error'); }
    };

    const handleComment = async (postId, commentText) => {
        try {
            const res = await postService.addComment(postId, commentText);
            setFeedData(prev => prev.map(p => (p._id === postId || p.id === postId) ? res.data.data : p));
            showToast('Comment posted!', 'success');
        } catch { showToast('Could not post comment.', 'error'); }
    };

    if (loading) {
        return (
            <div className="dashboard-main-bg py-5 min-vh-100 d-flex align-items-center justify-content-center">
                <ClipLoader color="#c84022" size={45} />
            </div>
        );
    }

    return (
        <div className="dashboard-main-bg py-4 min-vh-100">
            <div className="container">
                {/* Admin Welcome Banner */}
                <motion.div
                    className="rounded-4 mb-4 px-4 py-3 d-flex align-items-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #c84022 100%)', color: '#fff' }}
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <FaUserShield size={32} />
                    <div>
                        <div className="fw-bold" style={{ fontSize: 18 }}>Admin Control Centre 🛡️</div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                            Welcome, {user?.name?.split(' ')[0] || 'Admin'}. Use Quick Actions or navigate via the sidebar.
                        </div>
                    </div>
                </motion.div>

                <div className="row g-4">
                    {/* LEFT SIDEBAR (desktop only) */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <AdminStatsSidebar user={user} />
                    </div>

                    {/* CENTER */}
                    <div className="col-lg-6">
                        <QuickActionsGrid onAddAlumni={() => setShowAddAlumni(true)} />
                        <div className="fw-bold mb-3 ps-1" style={{ fontSize: 15, color: '#444' }}>
                            Recent Activity Feed
                        </div>
                        <div className="feed-scroll-area">
                            {feedData.length > 0 ? (
                                feedData.map(post => (
                                    <FeedItem
                                        key={post._id || post.id}
                                        post={post}
                                        onLike={handleLike}
                                        onComment={handleComment}
                                        onShare={() => showToast('Post link copied!', 'info')}
                                    />
                                ))
                            ) : (
                                <div className="text-center p-5 bg-white rounded-4 shadow-sm border-0">
                                    <FaNewspaper size={36} className="text-muted mb-3 opacity-50" />
                                    <p className="text-muted mb-0">No posts in the feed yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (desktop only) */}
                    <div className="col-lg-3 d-none d-lg-block">
                        <motion.div
                            className="dashboard-card bg-white rounded-4 shadow-sm border-0 p-3"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="fw-bold mb-3" style={{ fontSize: 14, color: '#c84022' }}>
                                Admin Navigation
                            </div>
                            {[
                                { to: '/admin/analytics',  label: '📊 Analytics Dashboard' },
                                { to: '/admin/alumni',     label: '👥 Alumni Management'   },
                                { to: '/admin/students',   label: '🎓 Student Management'  },
                                { to: '/admin/approvals',  label: '✅ Pending Approvals'   },
                                { to: '/admin/jobs',       label: '💼 Job Listings'        },
                                { to: '/admin/events',     label: '📅 Events'              },
                                { to: '/admin/broadcast',  label: '📣 Broadcast'           },
                                { to: '/admin/import',     label: '⬆️ Bulk Import'         },
                            ].map(({ to, label }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="d-block py-2 px-2 rounded-2 text-decoration-none mb-1"
                                    style={{ fontSize: 13, color: '#333', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    {label}
                                </Link>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Add Alumni Modal */}
            {showAddAlumni && (
                <AddAlumniModal
                    onClose={() => setShowAddAlumni(false)}
                    onSuccess={(msg) => showToast(msg, 'success')}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default AdminHome;