import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiUser, FiPhone, FiCheckCircle, FiChevronRight, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ActivationModal = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // Only show if user is logged in AND needsPasswordChange flag is set
  const show = user && user.needsPasswordChange;

  const [step, setStep] = useState(1); // 1: Password, 2: Details
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    name: user?.name || '',
    phone: user?.phone || '',
  });
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleNext = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.activateAccount({
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
      });

      if (res.data.success) {
        toast.success('🎉 Account activated! A confirmation email has been sent to you.', { duration: 5000 });
        // Update local auth state with fresh data (status Active, needsPasswordChange false)
        login(res.data.user, res.data.token);
        
        // Route to the appropriate dashboard
        const userRole = res.data.user.role?.toLowerCase() || '';
        if (userRole === 'admin') navigate('/admin/dashboard');
        else if (userRole === 'staff') navigate('/staff/dashboard');
        else if (userRole === 'student') navigate(`/student/home/${res.data.user._id}`);
        else if (userRole === 'alumni') navigate(`/alumni/home/${res.data.user._id}`);
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%', maxWidth: '480px', background: '#fff', borderRadius: '24px',
            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative'
          }}
        >
          {/* Progress Bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', display: 'flex' }}>
            <div style={{ flex: 1, background: '#c84022', transition: '0.3s' }} />
            <div style={{ flex: 1, background: step === 2 ? '#c84022' : '#eee', transition: '0.3s' }} />
          </div>

          <div style={{ padding: '40px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '64px', height: '64px', background: 'rgba(200,64,34,0.1)', 
                color: '#c84022', borderRadius: '18px', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                margin: '0 auto 16px'
              }}>
                {step === 1 ? <FiLock /> : <FiUser />}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>
                {step === 1 ? 'Set New Password' : 'Confirm Your Details'}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
                {step === 1 
                  ? (<>Your account (<strong style={{ color: '#c84022' }}>{user?.email}</strong>) was created with a temporary password. Set a strong new password to secure it.</>) 
                  : 'Almost there! Please verify that your contact information is correct.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                style={{
                  padding: '12px 16px', background: '#fff5f5', border: '1px solid #feb2b2',
                  borderRadius: '12px', color: '#c53030', fontSize: '13px', marginBottom: '24px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <FiAlertCircle /> {error}
              </motion.div>
            )}

            <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()}>
              {step === 1 ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Min 6 characters"
                        style={{
                          width: '100%', padding: '14px 16px', paddingRight: '45px',
                          border: '1.5px solid #e2e8f0', borderRadius: '12px',
                          outline: 'none', transition: 'border-color 0.2s', fontSize: '15px'
                        }}
                        autoFocus
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px'
                        }}
                      >
                        {showPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="Repeat password"
                      style={{
                        width: '100%', padding: '14px 16px',
                        border: '1.5px solid #e2e8f0', borderRadius: '12px',
                        outline: 'none', transition: 'border-color 0.2s', fontSize: '15px'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      width: '100%', padding: '16px', background: '#c84022', color: '#fff',
                      border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    Continue <FiChevronRight />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <FiUser style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={{
                          width: '100%', padding: '14px 16px', paddingLeft: '45px',
                          border: '1.5px solid #e2e8f0', borderRadius: '12px',
                          outline: 'none', fontSize: '15px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <FiPhone style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        style={{
                          width: '100%', padding: '14px 16px', paddingLeft: '45px',
                          border: '1.5px solid #e2e8f0', borderRadius: '12px',
                          outline: 'none', fontSize: '15px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      style={{
                        padding: '16px 24px', background: '#f1f5f9', color: '#475569',
                        border: 'none', borderRadius: '14px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1, padding: '16px', background: '#c84022', color: '#fff',
                        border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      {loading ? 'Activating...' : (
                        <>Activate Account <FiCheckCircle /></>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
          
          <div style={{ 
            padding: '20px 40px', background: '#f8fafc', borderTop: '1px solid #f1f5f9',
            textAlign: 'center', fontSize: '12px', color: '#94a3b8'
          }}>
            This is a one-time activation. Once finished, you will have full access.
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ActivationModal;
