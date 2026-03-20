import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { ClipLoader } from 'react-spinners';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize user from storage on mount
        const storedUser = storage.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = React.useCallback((userData) => {
        storage.updateCurrentUser(userData); // Keep localStorage in sync
        setUser(userData);
    }, []);

    const logout = React.useCallback(() => {
        storage.logout();
        setUser(null);
    }, []);

    // Determine the active user role dynamically to avoid calculating it in every component
    const userRole = React.useMemo(() => {
        if (!user) return 'guest';
        const rawRole = (user.role || '').toLowerCase();
        if (rawRole === 'admin' || rawRole === 'administrator') return 'admin';
        if (rawRole === 'student') return 'student';
        return 'alumni';
    }, [user]);

    // Memoize the context value to prevent unnecessary re-renders in consuming components
    const contextValue = React.useMemo(() => ({
        user,
        userRole,
        login,
        logout
    }), [user, userRole, login, logout]);

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
