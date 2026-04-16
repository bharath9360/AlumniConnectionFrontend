import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, userRole, logout } = useAuth();
    const token = localStorage.getItem('alumni_token');
    const valid = isTokenValid(token);

    useEffect(() => {
        if (user && !valid) {
            logout();
        }
    }, [user, valid, logout]);

    if (!user || !valid) {
        return <Navigate to="/login" replace />;
    }

    // ── Block self-registered pending users (no temp password = not bulk-imported)
    // Bulk-imported pending users (needsPasswordChange=true) are handled by ActivationModal overlay
    // so we let them through here — the overlay covers the entire screen.
    if (user.status === 'Pending' && !user.needsPasswordChange) {
        // Self-registered user awaiting admin approval — no access to protected pages
        return <Navigate to="/login" replace state={{ pendingApproval: true }} />;
    }

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin')   return <Navigate to={`/admin/home/${user._id || user.id}`} replace />;
        if (userRole === 'student') return <Navigate to={`/student/home/${user._id || user.id}`} replace />;
        if (userRole === 'staff')   return <Navigate to="/staff/dashboard" replace />;
        return <Navigate to={`/alumni/home/${user._id || user.id}`} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
