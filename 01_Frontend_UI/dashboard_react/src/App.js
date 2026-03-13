import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

import AuthGuard from './components/AuthGuard';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header'; // TopNavbar

import DashboardHome from './components/Pages/DashboardHome';
import ScanUploadPage from './components/Pages/ScanUploadPage';
import ScanDetailPage from './components/Pages/ScanDetailPage';
import PatientsPage from './components/Pages/PatientsPage';
import PatientProfilePage from './components/Pages/PatientProfilePage';
import ScanHistoryPage from './components/Pages/ScanHistoryPage';
import AnalyticsPage from './components/Pages/AnalyticsPage';
import SettingsPage from './components/Pages/SettingsPage';

const Layout = () => {
    return (
        <div className="flex h-screen w-full bg-primary-bg overflow-hidden relative font-sans text-text-primary">
            {/* Background Blobs (Decoration) */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-blob"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none animate-blob animation-delay-2000"></div>

            <Sidebar />

            <div className="flex-1 flex flex-col md:ml-[260px] transition-all duration-300 h-full relative z-10 w-full overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scroll-smooth custom-scrollbar">
                    <Header />

                    {/* Main Content Area */}
                    <main className="max-w-7xl mx-auto pb-10 min-h-[calc(100vh-140px)] w-full">
                        <Outlet />
                    </main>
                </div>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

function App() {
    return (
        <AppProvider>
            <Router>
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
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AppProvider>
    );
}

export default App;
