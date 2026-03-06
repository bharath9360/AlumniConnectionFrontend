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

    const login = (userData) => {
        storage.updateCurrentUser(userData); // Keep localStorage in sync
        setUser(userData);
    };

    const logout = () => {
        storage.logout();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
                <ClipLoader color="#c84022" size={50} />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
