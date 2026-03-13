import React, { createContext, useContext, useReducer, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

export const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('na_token');
    return fetch(API_BASE_URL + endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers
        }
    });
};

// Initial State
const initialState = {
    theme: (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) || 'medical',
    auth: {
        token: localStorage.getItem('na_token') || null,
        user: JSON.parse(localStorage.getItem('na_user') || 'null'),
        isLoading: true
    },
    language: (typeof window !== 'undefined' ? localStorage.getItem('language') : null) || 'en',
    notifications: [],
    isSidebarOpen: true,
    isProcessing: false,
    processStep: 0,
    processStatus: '',
    result: null,
    records: [],
};

// Reducer
const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_THEME':
            if (typeof window !== 'undefined') localStorage.setItem('theme', action.payload);
            return { ...state, theme: action.payload };
        case 'SET_LANGUAGE':
            if (typeof window !== 'undefined') localStorage.setItem('language', action.payload);
            return { ...state, language: action.payload };
        case 'TOGGLE_SIDEBAR':
            return { ...state, isSidebarOpen: !state.isSidebarOpen };
        case 'SET_PROCESSING':
            return { ...state, isProcessing: action.payload };
        case 'UPDATE_PROGRESS':
            return {
                ...state,
                processStep: action.payload.progress,
                processStatus: action.payload.status
            };
        case 'SET_RESULT':
            return { ...state, result: action.payload, isProcessing: false };
        case 'RESET_DASHBOARD':
            return { ...state, processStep: 0, processStatus: '', result: null };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [
                    { id: Date.now(), ...action.payload, time: 'Just now' },
                    ...state.notifications
                ]
            };
        case 'CLEAR_NOTIFICATIONS':
            return { ...state, notifications: [] };
        
        // New Auth Actions
        case 'SET_USER':
            return {
                ...state,
                auth: {
                    ...state.auth,
                    user: action.payload,
                    token: localStorage.getItem('na_token'), // Also sync token into state
                    isLoading: false
                }
            };
        case 'LOGOUT':
            localStorage.removeItem('na_token');
            localStorage.removeItem('na_user');
            window.location.href = '/login';
            return {
                ...state,
                auth: {
                    token: null,
                    user: null,
                    isLoading: false
                }
            };
        case 'AUTH_LOADED':
            return {
                ...state,
                auth: {
                    ...state.auth,
                    isLoading: false
                }
            };
        case 'SET_TOKEN':
            return {
                ...state,
                auth: {
                    ...state.auth,
                    token: action.payload,
                    isLoading: false
                }
            };
        default:
            return state;
    }
};

// Context
const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        document.documentElement.className = state.theme;
        if (state.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [state.theme]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
