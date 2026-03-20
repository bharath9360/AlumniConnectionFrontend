import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';


const ProtectedRoute = ({ allowedRoles = [] }) => {
    const { user, userRole } = useAuth();

    if (!user) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // User logged in but does not have the required role
        // Redirect to their respective home dashboard instead of showing a blank page
        if (userRole === 'admin') return <Navigate to="/admin/home" replace />;
        return <Navigate to="/alumni/home" replace />;
    }

    // Render child routes
    return <Outlet />;
};

export default ProtectedRoute;
