import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { ClipLoader } from 'react-spinners';

const AuthContext = createContext(null);

const TOKEN_KEY = 'alumni_token';
const USER_KEY = 'alumni_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on app init ─────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          throw new Error('Token expired');
        }
        setUser(JSON.parse(storedUser));
      } catch (_) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  // ── Login: store token + user ─────────────────────────────
  const login = useCallback((userData, token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── Logout: clear everything ──────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // ── Handle session expiry dispatched by Axios interceptor ─
  // We use a ref so the event listener always sees latest logout/user
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  useEffect(() => {
    const handler = (e) => {
      logoutRef.current();
      // e.detail.redirectTo is set by api.js based on the expired role
      const redirectTo = e?.detail?.redirectTo || '/login';
      // Navigate using the React Router history if inside a router,
      // otherwise we fall back gracefully (edge case during crash recovery)
      try {
        window.dispatchEvent(new CustomEvent('alumni:navigate', { detail: { to: redirectTo } }));
      } catch (_) {}
    };
    window.addEventListener('alumni:session-expired', handler);
    return () => window.removeEventListener('alumni:session-expired', handler);
  }, []);

  // ── Update user in state + localStorage (for profile edits) ─
  const updateUser = useCallback((updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
    setUser(merged);
  }, [user]);

  // ── Derived role ──────────────────────────────────────────
  const userRole = useMemo(() => {
    if (!user) return 'guest';
    const rawRole = (user.role || '').toLowerCase();
    if (rawRole === 'admin' || rawRole === 'administrator') return 'admin';
    if (rawRole === 'student') return 'student';
    if (rawRole === 'staff')   return 'staff';
    return 'alumni';
  }, [user]);

  // ── Resolve any image URL to absolute (handles relative paths) ─
  const resolveImageUrl = useCallback((url) => {
    if (!url || !url.trim()) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    return `${base}${url}`;
  }, []);

  const contextValue = useMemo(() => ({
    user,
    userRole,
    login,
    logout,
    updateUser,
    resolveImageUrl
  }), [user, userRole, login, logout, updateUser, resolveImageUrl]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
        <ClipLoader color="#c84022" size={50} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
