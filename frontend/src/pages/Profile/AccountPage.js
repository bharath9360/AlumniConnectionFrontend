import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiUser, FiMail, FiCalendar, FiShield,
  FiKey, FiLogOut, FiEdit3, FiCheckCircle, FiClock,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// ─── Helper ───────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND}${url}`;
};

const INFO_ROWS = [
  { icon: FiMail,     label: 'Email',       key: 'email' },
  { icon: FiUser,     label: 'Role',        key: 'role',   render: (v) => (
    <span style={{ background: 'rgba(200,64,34,0.09)', color: '#c84022', borderRadius: 20, padding: '2px 12px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
      {v}
    </span>
  )},
  { icon: FiShield,   label: 'Status',      key: 'status', render: (v) => {
    const active = (v || '').toLowerCase() === 'active';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: active ? '#38a169' : '#d69e2e', fontWeight: 700, fontSize: 13 }}>
        {active ? <FiCheckCircle size={13} /> : <FiClock size={13} />}
        {v || 'Unknown'}
      </span>
    );
  }},
  { icon: FiCalendar, label: 'Member Since', key: 'createdAt', render: (v) => v
    ? new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  },
];

const QUICK_ACTIONS = [
  { icon: FiEdit3, label: 'Edit Profile',     desc: 'Update your name, bio, and details',    action: (navigate, user) => navigate(`/profile/${user?._id || user?.id}`) },
  { icon: FiKey,   label: 'Change Password',  desc: 'Update your login password',             action: (navigate) => navigate('/change-password') },
];

// ─── Fade-up animation ────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.36, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] } }),
};

const AccountPage = () => {
  const navigate    = useNavigate();
  const { user, logout } = useAuth();

  const avatar     = resolveUrl(user?.profilePic);
  const initials   = (user?.name || '?')[0].toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Please <Link to="/login">log in</Link> to view your account.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', marginBottom: 24, padding: 0 }}
        >
          <FiArrowLeft size={15} /> Back
        </button>

        {/* ── Avatar + Name card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          style={{ background: '#fff', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 16 }}
        >
          {/* Header strip */}
          <div style={{ background: 'linear-gradient(135deg, #c84022, #e85d38)', padding: '28px 28px 60px' }} />

          {/* Avatar overlapping strip */}
          <div style={{ padding: '0 28px 28px', marginTop: -48 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                border: '3.5px solid #fff', overflow: 'hidden',
                background: '#f8f9fa', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.9rem', fontWeight: 800, color: '#c84022',
                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              }}>
                {avatar
                  ? <img src={avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              <div style={{ paddingBottom: 4 }}>
                <h3 style={{ margin: 0, fontWeight: 800, color: '#1a1a2e', fontSize: 20 }}>{user.name}</h3>
                <p style={{ margin: '2px 0 0', color: '#888', fontSize: 13.5 }}>{user.email}</p>
              </div>
            </div>
            <Link
              to={`/profile/${user._id || user.id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#c84022', color: '#fff', borderRadius: 20,
                padding: '7px 18px', fontSize: 13, fontWeight: 700,
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}
            >
              <FiUser size={13} /> View Public Profile
            </Link>
          </div>
        </motion.div>

        {/* ── Account Info card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{ padding: '20px 24px 8px', borderBottom: '1px solid #f5f5f5' }}>
            <h5 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>Account Information</h5>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {INFO_ROWS.map(({ icon: Icon, label, key, render }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', gap: 14, borderBottom: '1px solid #f9f9f9' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(200,64,34,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#c84022" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 14, color: '#1a1a2e', fontWeight: 500, wordBreak: 'break-word' }}>
                    {render ? render(user[key]) : (user[key] || '—')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Quick Actions card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 16 }}
        >
          <div style={{ padding: '20px 24px 8px', borderBottom: '1px solid #f5f5f5' }}>
            <h5 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>Quick Actions</h5>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {QUICK_ACTIONS.map(({ icon: Icon, label, desc, action }) => (
              <button
                key={label}
                onClick={() => action(navigate, user)}
                style={{
                  width: '100%', padding: '14px 24px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', borderBottom: '1px solid #f9f9f9',
                  transition: 'background 0.14s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(200,64,34,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color="#c84022" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{label}</div>
                  <div style={{ fontSize: 12.5, color: '#888', marginTop: 1 }}>{desc}</div>
                </div>
                <FiArrowLeft size={13} color="#ccc" style={{ transform: 'rotate(180deg)' }} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Danger zone card ── */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 32 }}
        >
          <div style={{ padding: '20px 24px 8px', borderBottom: '1px solid #f5f5f5' }}>
            <h5 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#e53e3e' }}>Sign Out</h5>
          </div>
          <div style={{ padding: '12px 24px 20px' }}>
            <p style={{ fontSize: 13.5, color: '#888', marginBottom: 16 }}>
              You will be signed out of your account across this device.
            </p>
            <button
              id="account-logout-btn"
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: '1.5px solid #e53e3e',
                color: '#e53e3e', borderRadius: 12, padding: '10px 20px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e53e3e'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#e53e3e'; }}
            >
              <FiLogOut size={15} /> Sign Out
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AccountPage;
