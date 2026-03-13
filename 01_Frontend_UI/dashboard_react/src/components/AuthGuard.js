import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AuthGuard = ({ children }) => {
    const { state, dispatch } = useApp();
    const [isVerifying, setIsVerifying] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('na_token');
            if (!token) {
                setIsVerifying(false);
                return;
            }

            try {
                const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    dispatch({ type: 'SET_USER', payload: userData });
                    localStorage.setItem('na_user', JSON.stringify(userData));
                } else {
                    // Token invalid or expired
                    dispatch({ type: 'LOGOUT' });
                }
            } catch (error) {
                console.error("Auth verification error:", error);
                // On network error keep token until we can verify? No, let's keep it safe.
                // But for a hackathon, let's avoid logging out on network error alone.
            } finally {
                setIsVerifying(false);
                dispatch({ type: 'AUTH_LOADED' });
            }
        };

        verifyToken();
    }, [dispatch]);

    if (isVerifying) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-primary-bg">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-text-primary text-xl font-bold animate-pulse">NeuroAssist</p>
                </div>
            </div>
        );
    }

    if (!state.auth.token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AuthGuard;
