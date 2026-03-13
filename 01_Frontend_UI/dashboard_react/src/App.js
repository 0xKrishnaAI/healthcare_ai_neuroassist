import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import AuthGuard from './components/AuthGuard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { FaSpinner } from 'react-icons/fa';

// Lazy load heavy components
const NeuroAssistIntro = lazy(() => import('./components/Intro/NeuroAssistIntro'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const DashboardHome = lazy(() => import('./components/Pages/DashboardHome'));
const ScanUploadPage = lazy(() => import('./components/Pages/ScanUploadPage'));
const ScanDetailPage = lazy(() => import('./components/Pages/ScanDetailPage'));
const PatientsPage = lazy(() => import('./components/Pages/PatientsPage'));
const PatientProfilePage = lazy(() => import('./components/Pages/PatientProfilePage'));
const ScanHistoryPage = lazy(() => import('./components/Pages/ScanHistoryPage'));
const AnalyticsPage = lazy(() => import('./components/Pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./components/Pages/SettingsPage'));
const SOSPage = lazy(() => import('./components/Pages/SOSPage'));
const ChatBot = lazy(() => import('./components/ChatBot'));

const PageLoader = () => (
    <div className="flex h-full w-full items-center justify-center bg-primary-bg/50 backdrop-blur-sm">
        <FaSpinner className="animate-spin text-cyan-400 text-3xl" />
    </div>
);

const Layout = () => {
    return (
        <div className="flex h-screen w-full bg-primary-bg overflow-hidden relative font-sans text-text-primary">
            {/* Background Blobs (Decoration) - Reduced blur and optimized */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] pointer-events-none will-change-transform"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[100px] pointer-events-none will-change-transform"></div>

            <Sidebar />

            <div className="flex-1 flex flex-col md:ml-[260px] transition-all duration-300 h-full relative z-10 w-full overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scroll-smooth custom-scrollbar">
                    <Header />

                    <main className="max-w-7xl mx-auto pb-10 min-h-[calc(100vh-140px)] w-full relative">
                        <Suspense fallback={<PageLoader />}>
                            <Outlet />
                            {/* FLOATING AI CHAT GLOBAL INJECTION */}
                            <ChatBot />
                        </Suspense>
                    </main>
                </div>
            </div>
        </div>
    );
};

function App() {
    const [introFinished, setIntroFinished] = useState(false);

    if (!introFinished) {
        return (
            <Suspense fallback={<div className="fixed inset-0 bg-[#05070a]" />}>
                <NeuroAssistIntro onIntroComplete={() => setIntroFinished(true)} />
            </Suspense>
        );
    }

    return (
        <AppProvider>
            <Router>
                <Suspense fallback={<div className="fixed inset-0 bg-[#050d1a]" />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={
                            <AuthGuard><Layout /></AuthGuard>
                        }>
                            <Route index element={<DashboardHome />} />
                            <Route path="scan" element={<ScanUploadPage />} />
                            <Route path="scan/:scanId" element={<ScanDetailPage />} />
                            <Route path="patients" element={<PatientsPage />} />
                            <Route path="patients/:patientId" element={<PatientProfilePage />} />
                            <Route path="history" element={<ScanHistoryPage />} />
                            <Route path="analytics" element={<AnalyticsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="sos" element={<SOSPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </Router>
        </AppProvider>
    );
}

export default App;

