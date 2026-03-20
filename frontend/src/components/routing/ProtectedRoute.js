import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, userRole } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If specific roles are required, check — otherwise allow any authenticated user
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to the user's own dashboard
        if (userRole === 'admin') return <Navigate to="/admin/home" replace />;
        return <Navigate to="/alumni/home" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

