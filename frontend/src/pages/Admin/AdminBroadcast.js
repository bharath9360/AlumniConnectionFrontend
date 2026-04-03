import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import {
  FiBell, FiSend, FiUsers, FiUserCheck, FiCheck,
  FiAlertTriangle, FiInfo, FiRefreshCw, FiClock,
  FiGlobe, FiChevronsRight,
} from 'react-icons/fi';

/* ── Tiny toast ─────────────────────────────────────────────── */
let _tid = 0;
const useToast = () => {
  const [toasts, set] = useState([]);
  const add = useCallback((msg, type = 'info') => {
    const id = ++_tid;
    set(t => [...t, { id, msg, type }]);
    setTimeout(() => set(t => t.filter(x => x.id !== id)), 5000);
  }, []);
  return { toasts, add };
};

/* ── Audience options ───────────────────────────────────────── */
const AUDIENCES = [
  { key: 'all',      label: 'All Users',     subLabel: 'Students + Alumni',  icon: FiGlobe,     color: '#6366f1' },
  { key: 'students', label: 'Students Only', subLabel: 'All registered students', icon: FiUsers, color: '#10b981' },
  { key: 'alumni',   label: 'Alumni Only',   subLabel: 'All verified alumni', icon: FiUserCheck, color: '#f59e0b' },
  { key: 'batch',    label: 'Specific Batch', subLabel: 'Target a pass-out year', icon: FiClock, color: '#8b5cf6' },
];

/* ── Quick message templates ────────────────────────────────── */
const TEMPLATES = [
  { label: '📅 Event Reminder',    title: 'Upcoming Event Reminder', message: 'Don\'t forget! We have an exciting event coming up soon. Check the Events section for full details and register now.' },
  { label: '💼 New Job Posted',    title: 'New Job Opportunity',      message: 'A new job opportunity has just been posted on the platform. Log in now and check the Jobs section to apply.' },
  { label: '🎓 Graduation Update', title: 'Graduation & Batch Update', message: 'This is an important update regarding graduations and batch transitions. Please log in to check your profile and verify your details.' },
  { label: '🔔 Platform Update',   title: 'Platform Maintenance Notice', message: 'We\'re making improvements to MAMCET Alumni Connect. The platform may be briefly unavailable on [date/time]. Thank you for your patience!' },
  { label: '📢 General Announcement', title: 'Important Announcement', message: '' },
];

/* ── History item component ─────────────────────────────────── */
const HistoryItem = ({ item }) => (
  <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
    <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 2 }}>{item.title}</div>
      <div style={{ fontSize: 12.5, color: '#666', marginBottom: 6, lineHeight: 1.5 }}>{item.message}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11.5, color: '#aaa' }}>
        <span>→ {item.audienceLabel}</span>
        <span>• {item.sent} notified</span>
        {item.emailSent > 0 && <span>• {item.emailSent} emails</span>}
        <span>• {new Date(item.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const AdminBroadcast = () => {
  /* Form state */
  const [audience,    setAudience]    = useState('all');
  const [batch,       setBatch]       = useState('');
  const [title,       setTitle]       = useState('');
  const [message,     setMessage]     = useState('');
  const [icon,        setIcon]        = useState('📢');
  const [sendEmail,   setSendEmail]   = useState(false);

  /* Data */
  const [batches,     setBatches]     = useState([]);
  const [sending,     setSending]     = useState(false);
  const [history,     setHistory]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_broadcast_history') || '[]'); } catch { return []; }
  });
  const [lastResult,  setLastResult]  = useState(null);

  const { toasts, add: toast } = useToast();

  /* Fetch batch list */
  useEffect(() => {
    adminService.getBatches()
      .then(r => setBatches(r.data.data || []))
      .catch(() => {});
  }, []);

  /* Template picker */
  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  /* Character counts */
  const titleLeft   = 80  - title.length;
  const messageLeft = 500 - message.length;

  /* ── Send ──────────────────────────────── */
  const handleSend = async () => {
    if (!title.trim()) { toast('Title is required.', 'error'); return; }
    if (!message.trim()) { toast('Message is required.', 'error'); return; }
    if (audience === 'batch' && !batch) { toast('Please select a batch year.', 'error'); return; }

    setSending(true);
    setLastResult(null);
    try {
      const res = await adminService.sendBroadcast({
        audience,
        batch: audience === 'batch' ? batch : undefined,
        title: title.trim(),
        message: message.trim(),
        icon,
        sendEmail,
      });

      const result = res.data;
      setLastResult(result);
      toast(result.message, 'success');

      /* Save to local history */
      const record = {
        id:           Date.now(),
        sentAt:       new Date().toISOString(),
        audience,
        audienceLabel: result.data?.audienceLabel || audience,
        title:        title.trim(),
        message:      message.trim().slice(0, 120),
        icon,
        sent:         result.data?.sent || 0,
        emailSent:    result.data?.emailResult?.sent || 0,
      };
      const updated = [record, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem('admin_broadcast_history', JSON.stringify(updated));

      /* Reset form */
      setTitle('');
      setMessage('');
    } catch (err) {
      toast(err.response?.data?.message || 'Broadcast failed.', 'error');
    } finally { setSending(false); }
  };

  const selectedAudience = AUDIENCES.find(a => a.key === audience);

  /* ══════════════════════════════════════ */
  return (
    <div>
      {/* ── Header ──────────────────────── */}
      <div className="ap-section-header">
        <div>
          <div className="ap-section-title">Notification Broadcast</div>
          <div className="ap-section-sub">
            Send real-time in-app notifications (+ optional email) to users by audience.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ─── LEFT: Compose panel ──────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Audience selector */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 14 }}>
              1 · Select Audience
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {AUDIENCES.map(aud => (
                <button
                  key={aud.key}
                  onClick={() => setAudience(aud.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    border: audience === aud.key ? `2px solid ${aud.color}` : '2px solid #f0f0f0',
                    background: audience === aud.key ? `${aud.color}08` : '#fafafa',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${aud.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <aud.icon size={17} color={aud.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: audience === aud.key ? aud.color : '#1a1a2e' }}>{aud.label}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{aud.subLabel}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Batch selector */}
            {audience === 'batch' && (
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>
                  Select Batch Year *
                </label>
                <select
                  className="am-select"
                  value={batch}
                  onChange={e => setBatch(e.target.value)}
                  style={{ width: '100%', borderColor: !batch ? '#ef4444' : undefined }}
                >
                  <option value="">— Choose a batch year —</option>
                  {batches.map(b => <option key={b} value={b}>{b}</option>)}
                  {batches.length === 0 && <option disabled>No batches found</option>}
                </select>
              </div>
            )}
          </div>

          {/* Compose */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 14 }}>
              2 · Compose Message
            </div>

            {/* Icon picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['📢', '🔔', '🎓', '💼', '📅', '🚀', '⚠️', '✅', '🎉', '📌'].map(e => (
                  <button
                    key={e}
                    onClick={() => setIcon(e)}
                    style={{ width: 38, height: 38, fontSize: 20, border: icon === e ? '2px solid #6366f1' : '2px solid #f0f0f0', borderRadius: 10, background: icon === e ? 'rgba(99,102,241,0.08)' : '#fafafa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#555' }}>Title *</label>
                <span style={{ fontSize: 11, color: titleLeft < 10 ? '#ef4444' : '#bbb' }}>{titleLeft} left</span>
              </div>
              <input
                className="am-search-input"
                style={{ display: 'block', width: '100%', padding: '10px 14px', fontSize: 14, borderRadius: 10, border: `1.5px solid ${!title.trim() ? '#eee' : '#6366f1'}`, background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                placeholder="Enter notification title…"
                value={title}
                maxLength={80}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Message */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#555' }}>Message *</label>
                <span style={{ fontSize: 11, color: messageLeft < 30 ? '#ef4444' : '#bbb' }}>{messageLeft} left</span>
              </div>
              <textarea
                style={{ display: 'block', width: '100%', minHeight: 110, padding: '10px 14px', fontSize: 13.5, borderRadius: 10, border: `1.5px solid ${!message.trim() ? '#eee' : '#6366f1'}`, background: '#fafafa', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                placeholder="Write your notification message here…"
                value={message}
                maxLength={500}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '16px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 12 }}>3 · Options</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => setSendEmail(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, transition: 'background 0.2s',
                  background: sendEmail ? '#6366f1' : '#e0e0e0',
                  position: 'relative', flexShrink: 0, cursor: 'pointer',
                }}
              >
                <div style={{ position: 'absolute', top: 2, left: sendEmail ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>Also send email</div>
                <div style={{ fontSize: 11.5, color: '#aaa' }}>
                  {sendEmail ? 'Email will be sent (requires SMTP config)' : 'Only in-app notification (default)'}
                </div>
              </div>
            </label>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim() || (audience === 'batch' && !batch)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: sending || !title.trim() || !message.trim() ? '#e0e0e0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: sending || !title.trim() || !message.trim() ? '#aaa' : '#fff',
              fontWeight: 800, fontSize: 15, transition: 'all 0.2s',
              boxShadow: sending || !title.trim() || !message.trim() ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            }}
          >
            {sending
              ? <><ClipLoader size={16} color="#aaa" /> Sending…</>
              : <><FiSend size={16} /> Send Broadcast to {selectedAudience?.label}</>}
          </button>

          {/* Send result summary */}
          {lastResult && (
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.2)',
              borderRadius: 14, padding: '16px 20px',
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#059669', marginBottom: 10 }}>
                ✅ Broadcast Sent!
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'In-App Notified', value: lastResult.data?.sent || 0, color: '#6366f1' },
                  { label: 'Audience',        value: lastResult.data?.audienceLabel, color: '#10b981' },
                  { label: 'Emails Sent',     value: lastResult.data?.emailResult?.sent ?? '—', color: '#f59e0b' },
                  { label: 'Email Failures',  value: lastResult.data?.emailResult?.failed ?? '—', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Templates + History ───── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Templates */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 12 }}>⚡ Quick Templates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(tpl)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 12px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, color: '#444', fontWeight: 500, textAlign: 'left', transition: 'background 0.1s' }}
                >
                  {tpl.label}
                  <FiChevronsRight size={13} color="#bbb" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Live Preview</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f8f8ff', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e', marginBottom: 4 }}>{title || '—'}</div>
                  <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.5 }}>{message || '—'}</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>Just now</div>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast history */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #f0f0f0', padding: '18px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a2e' }}>🕑 Broadcast History</div>
              {history.length > 0 && (
                <button
                  onClick={() => { setHistory([]); localStorage.removeItem('admin_broadcast_history'); }}
                  style={{ fontSize: 11, color: '#d97706', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: 13 }}>
                No broadcasts sent yet in this session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {history.map(item => <HistoryItem key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
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

export default AdminBroadcast;
