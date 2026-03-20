import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
    return 'alumni';
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    userRole,
    login,
    logout,
    updateUser
  }), [user, userRole, login, logout, updateUser]);

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
