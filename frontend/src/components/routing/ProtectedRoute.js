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

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') return <Navigate to={`/admin/home/${user._id || user.id}`} replace />;
        if (userRole === 'student') return <Navigate to={`/student/home/${user._id || user.id}`} replace />;
        return <Navigate to={`/alumni/home/${user._id || user.id}`} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

