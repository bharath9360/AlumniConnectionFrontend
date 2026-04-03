import React from 'react';

// ─── Skeleton primitives ───────────────────────────────────────────────────────
const pulse = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  borderRadius: 6,
};

// Inline keyframe injection (one-time)
if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-style';
  style.textContent = `
    @keyframes skeleton-pulse {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

const Box = ({ w = '100%', h = 16, mb = 8, radius = 6, style = {} }) => (
  <div style={{ ...pulse, width: w, height: h, marginBottom: mb, borderRadius: radius, ...style }} />
);

// ─── Chat sidebar skeleton ────────────────────────────────────────────────────
export const ChatListSkeleton = ({ rows = 6 }) => (
  <div className="p-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="d-flex align-items-center gap-3 py-3 border-bottom">
        <Box w={48} h={48} mb={0} radius={50} style={{ flexShrink: 0 }} />
        <div className="flex-grow-1">
          <Box w="60%" h={13} mb={6} />
          <Box w="85%" h={11} mb={0} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Chat messages skeleton ───────────────────────────────────────────────────
export const MessagesSkeleton = ({ rows = 8 }) => (
  <div className="d-flex flex-column gap-3 px-4 py-3">
    {Array.from({ length: rows }).map((_, i) => {
      const isMine = i % 3 === 0;
      return (
        <div key={i} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
          <Box w={`${40 + Math.random() * 30}%`} h={38} mb={0} radius={16} />
        </div>
      );
    })}
  </div>
);

// ─── Admin table skeleton ─────────────────────────────────────────────────────
export const TableSkeleton = ({ rows = 8, cols = 5 }) => (
  <div className="px-2">
    {/* header */}
    <div className="d-flex gap-3 py-2 border-bottom mb-2">
      {Array.from({ length: cols }).map((_, i) => (
        <Box key={i} w={`${100 / cols}%`} h={14} mb={0} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="d-flex gap-3 py-3 border-bottom align-items-center">
        {Array.from({ length: cols }).map((_, c) => (
          <Box key={c} w={c === 0 ? '36px' : `${100 / cols}%`} h={c === 0 ? 36 : 13} mb={0} radius={c === 0 ? 50 : 6} style={{ flexShrink: 0 }} />
        ))}
      </div>
    ))}
  </div>
);

// ─── Card grid skeleton ───────────────────────────────────────────────────────
export const CardGridSkeleton = ({ cards = 6 }) => (
  <div className="row g-3">
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} className="col-12 col-md-6 col-lg-4">
        <div className="p-3 bg-white rounded-3 border">
          <Box w="40%" h={12} mb={8} />
          <Box w="100%" h={24} mb={6} />
          <Box w="70%" h={12} mb={12} />
          <Box w="30%" h={32} mb={0} radius={20} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Stat card skeleton ───────────────────────────────────────────────────────
export const StatCardSkeleton = ({ count = 4 }) => (
  <div className="row g-3 mb-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="col-6 col-lg-3">
        <div className="p-3 bg-white rounded-3 border">
          <Box w="50%" h={12} mb={10} />
          <Box w="40%" h={32} mb={6} />
          <Box w="60%" h={10} mb={0} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Profile skeleton ─────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <div className="p-4 bg-white rounded-3 border">
    <div className="d-flex gap-3 align-items-center mb-4">
      <Box w={72} h={72} mb={0} radius={50} style={{ flexShrink: 0 }} />
      <div className="flex-grow-1">
        <Box w="50%" h={18} mb={8} />
        <Box w="35%" h={12} mb={0} />
      </div>
    </div>
    <Box w="100%" h={12} mb={8} />
    <Box w="90%" h={12} mb={8} />
    <Box w="75%" h={12} mb={0} />
  </div>
);

// ─── Notification list skeleton ───────────────────────────────────────────────
export const NotificationSkeleton = ({ rows = 5 }) => (
  <div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="d-flex align-items-start gap-3 px-3 py-3 border-bottom">
        <Box w={38} h={38} mb={0} radius={50} style={{ flexShrink: 0 }} />
        <div className="flex-grow-1">
          <Box w="60%" h={13} mb={6} />
          <Box w="85%" h={11} mb={6} />
          <Box w="25%" h={10} mb={0} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Full-page spinner ────────────────────────────────────────────────────────
export const PageSpinner = ({ label = 'Loading...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
    <div className="spinner-border text-danger mb-3" role="status" style={{ width: 40, height: 40 }} />
    <span className="text-muted small">{label}</span>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
export const EmptyState = ({
  icon = 'fa-inbox',
  title = 'Nothing here yet',
  description = '',
  action = null,
}) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center px-3">
    <div
      className="rounded-circle d-flex align-items-center justify-content-center mb-3"
      style={{ width: 64, height: 64, backgroundColor: '#fff0ed' }}
    >
      <i className={`fas ${icon}`} style={{ fontSize: '1.5rem', color: '#c84022' }}></i>
    </div>
    <h6 className="fw-bold text-dark mb-1">{title}</h6>
    {description && <p className="text-muted small mb-3">{description}</p>}
    {action}
  </div>
);

export default {
  ChatListSkeleton,
  MessagesSkeleton,
  TableSkeleton,
  CardGridSkeleton,
  StatCardSkeleton,
  ProfileSkeleton,
  NotificationSkeleton,
  PageSpinner,
  EmptyState,
};
