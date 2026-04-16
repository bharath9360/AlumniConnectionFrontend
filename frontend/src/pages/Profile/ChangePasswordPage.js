import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Strength meter ───────────────────────────────────────────
const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
};

const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#2b6cb0'];

const ChangePasswordPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getStrength(form.newPw);

  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  const handleChange = (e) => {
    setError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.current)         return 'Current password is required.';
    if (!form.newPw)           return 'New password is required.';
    if (form.newPw.length < 6) return 'New password must be at least 6 characters.';
    if (form.newPw === form.current) return 'New password must be different from current.';
    if (form.newPw !== form.confirm) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      await authService.changePassword(form.current, form.newPw);
      setSuccess(true);
      toast.success('Password changed successfully! 🔐');
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Input field component ────────────────────────────────────
  const PasswordField = ({ label, name, placeholder }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }} />
        <input
          type={show[name] ? 'text' : 'password'}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={loading || success}
          style={{
            width: '100%', padding: '13px 44px',
            border: '1.5px solid #e2e8f0', borderRadius: 12,
            fontSize: 15, outline: 'none', transition: 'border-color 0.2s',
            background: '#fafafa',
          }}
          onFocus={e => e.target.style.borderColor = '#c84022'}
          onBlur={e =>  e.target.style.borderColor = '#e2e8f0'}
        />
        <button
          type="button"
          onClick={() => toggle(name)}
          style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 17, display: 'flex' }}
        >
          {show[name] ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: 460 }}
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', marginBottom: 22, padding: 0 }}
        >
          <FiArrowLeft size={15} /> Back
        </button>

        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.09)', overflow: 'hidden' }}>
          {/* Header strip */}
          <div style={{ background: 'linear-gradient(135deg, #c84022, #e85d38)', padding: '28px 32px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <FiLock size={24} color="#fff" />
            </div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: 22, fontWeight: 800 }}>Change Password</h2>
            <p style={{ color: 'rgba(255,255,255,0.78)', margin: '6px 0 0', fontSize: 13.5 }}>
              Logged in as <strong>{user?.email}</strong>
            </p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px 32px 28px' }}>

            {/* Success state */}
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '16px 0 8px' }}
              >
                <FiCheckCircle size={52} color="#38a169" style={{ marginBottom: 14 }} />
                <h4 style={{ fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>Password Updated!</h4>
                <p style={{ color: '#888', fontSize: 14 }}>Redirecting you back…</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 10, padding: '11px 14px', marginBottom: 22, fontSize: 13.5, color: '#c53030' }}
                  >
                    <FiAlertCircle size={15} /> {error}
                  </motion.div>
                )}

                <PasswordField label="Current Password"  name="current" placeholder="Your current password" />
                <PasswordField label="New Password"      name="newPw"   placeholder="Min 6 characters" />

                {/* Strength bar */}
                {form.newPw && (
                  <div style={{ marginTop: -12, marginBottom: 20 }}>
                    <div style={{ height: 4, borderRadius: 4, background: '#f0f0f0', marginBottom: 5 }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${(strength / 5) * 100}%`, background: strengthColor[strength], transition: 'all 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: strengthColor[strength], fontWeight: 600 }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                )}

                <PasswordField label="Confirm New Password" name="confirm" placeholder="Repeat new password" />

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 13,
                    background: loading ? '#e88c77' : '#c84022',
                    color: '#fff', border: 'none', fontWeight: 700,
                    fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', marginTop: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {loading ? (
                    <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Updating…</>
                  ) : (
                    <><FiLock size={15} />Update Password</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>

      {/* keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ChangePasswordPage;
