import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaUserCircle, FaCog, FaSignOutAlt, FaTimes, FaBars, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state, dispatch } = useApp();
    const user = state.auth?.user;
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const getPageTitle = (path) => {
        if (path === '/dashboard') return 'Assessment Dashboard';
        if (path.startsWith('/dashboard/scan')) return 'Analysis Hub';
        if (path === '/dashboard/patients') return 'Patient Registry';
        if (path === '/dashboard/history') return 'Neural Logs';
        if (path === '/dashboard/analytics') return 'Statistical Insights';
        if (path === '/dashboard/settings') return 'System Configuration';
        return 'NeuroAssist';
    };

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-40 bg-[#050d1a]/80 backdrop-blur-xl border-b border-white/5 mx-[-24px] px-8 py-3 mb-8 transition-all duration-300">
            <div className="flex items-center justify-between">
                
                {/* LEFT: TITLE & BREADCRUMB */}
                <div className="flex items-center gap-4">
                    <button 
                        className="md:hidden text-white hover:text-cyan-400 p-2 bg-white/5 rounded-lg transition-colors focus:outline-none"
                        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
                    >
                        <FaBars />
                    </button>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                          {getPageTitle(location.pathname)}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-cyan-400" />
                        <span className="text-[10px] text-text-secondary font-bold font-mono">NODE_TX_001</span>
                      </div>
                    </div>
                </div>

                {/* RIGHT: SEARCH & USER */}
                <div className="flex items-center gap-6">
                    
                    {/* Search */}
                    <div className="hidden lg:flex items-center bg-black/40 px-4 py-2 rounded-xl border border-white/5 focus-within:border-cyan-500/30 transition-all group w-72">
                        <FaSearch className="text-text-muted mr-3 group-focus-within:text-cyan-400 transition-colors" size={12} />
                        <input
                            type="text"
                            placeholder="Find records or datasets..."
                            className="bg-transparent border-none outline-none text-xs w-full placeholder-text-muted text-white font-medium"
                        />
                    </div>

                    {/* Stats mini bar */}
                    <div className="hidden xl:flex items-center gap-4 px-4 border-l border-white/5 border-r">
                       <div className="text-center">
                         <p className="text-[8px] text-text-secondary font-bold uppercase tracking-widest">Latency</p>
                         <p className="text-[10px] text-emerald-400 font-mono font-bold">12ms</p>
                       </div>
                       <div className="text-center">
                         <p className="text-[8px] text-text-secondary font-bold uppercase tracking-widest">Uptime</p>
                         <p className="text-[10px] text-white font-mono font-bold">99.9%</p>
                       </div>
                    </div>

                    {/* Desktop profile */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                className="relative p-2.5 text-text-secondary hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <FaBell size={18} />
                                {state.notifications?.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(0,198,255,0.8)]"></span>
                                )}
                            </button>
                            
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 15 }}
                                        className="absolute right-0 mt-4 w-80 bg-[#0d1f3c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Clinical Alerts</h3>
                                            <button className="text-[10px] text-cyan-400 font-bold hover:underline">Mark All Read</button>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {(!state.notifications || state.notifications.length === 0) ? (
                                                <div className="p-8 text-center text-text-muted text-xs">Zero pending alerts</div>
                                            ) : (
                                                state.notifications.map((n, i) => (
                                                  <div key={i} className="p-4 hover:bg-white/5 border-b border-white/5 transition-colors">
                                                    <p className="text-xs text-white leading-relaxed">{n.text}</p>
                                                    <p className="text-[10px] text-text-secondary mt-1 font-mono">Just now</p>
                                                  </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-8 w-px bg-white/5 mx-1" />

                        <button 
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-lg group-hover:scale-105 transition-transform">
                                {getInitials(user?.full_name)}
                            </div>
                            <div className="hidden sm:block text-left">
                              <p className="text-xs font-bold text-white leading-tight">{user?.full_name?.split(' ')[0] || 'Clinician'}</p>
                              <p className="text-[10px] text-text-secondary font-medium">Verified Doctor</p>
                            </div>
                            <FaChevronDown size={10} className={`text-text-muted transition-transform ${showProfile ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfile && (
                <div className="absolute right-8 mt-2 z-[60]">
                   <div className="fixed inset-0" onClick={() => setShowProfile(false)} />
                   <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative w-56 bg-[#0d1f3c] border border-white/10 rounded-2xl shadow-2xl p-2"
                   >
                      <button 
                        onClick={() => { setShowProfile(false); navigate('/dashboard/settings'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-xs font-bold text-white transition-all"
                      >
                         <FaCog className="text-cyan-400" /> Account Settings
                      </button>
                      <button 
                        onClick={() => { handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-xs font-bold text-red-400 transition-all mt-1"
                      >
                         <FaSignOutAlt /> Terminate Session
                      </button>
                   </motion.div>
                </div>
              )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
