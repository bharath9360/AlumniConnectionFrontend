/**
 * NavigationSync.js
 * ─────────────────────────────────────────────────────────────
 * A tiny headless component mounted inside <Router> that listens
 * for the 'alumni:navigate' custom DOM event dispatched by
 * AuthContext when a session expires (401).
 *
 * This bridges the gap between the Axios interceptor (outside React)
 * and React Router's navigate() (inside React)  without causing
 * hard page reloads.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationSync = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const to = e?.detail?.to;
      if (to) navigate(to, { replace: true });
    };
    window.addEventListener('alumni:navigate', handler);
    return () => window.removeEventListener('alumni:navigate', handler);
  }, [navigate]);

  return null; // renders nothing
};

export default NavigationSync;
