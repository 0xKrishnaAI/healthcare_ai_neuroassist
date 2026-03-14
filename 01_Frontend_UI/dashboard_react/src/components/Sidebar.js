import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, FaBrain, FaUsers, FaHistory, 
  FaChartBar, FaCog, FaBell, FaSignOutAlt, 
  FaWaveSquare, FaExclamationTriangle 
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';

const Sidebar = () => {
  const { state, dispatch } = useApp();
  const user = state.auth?.user;

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome, exact: true },
    { path: '/dashboard/scan', label: 'Analysis Hub', icon: FaBrain },
    { path: '/dashboard/patients', label: 'Patient Registry', icon: FaUsers },
    { path: '/dashboard/history', label: 'Assessment Logs', icon: FaHistory },
    { path: '/dashboard/analytics', label: 'System Analytics', icon: FaChartBar },
    { path: '/dashboard/settings', label: 'Settings', icon: FaCog },
    { path: '/dashboard/sos', label: 'SOS Emergency', icon: FaExclamationTriangle, isError: true },
  ];

  const handleLogout = () => {
    if (window.confirm('Secure logout from Clinical Node?')) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-[#050d1a] border-r border-white/5 shadow-2xl z-50 flex flex-col justify-between transition-all duration-300 ${state.isSidebarOpen ? 'w-[280px]' : 'w-[80px]'} hidden md:flex`}>
      
      <div className="flex flex-col h-full">
        {/* BRAND AREA */}
        <div className="p-6 mb-2 flex items-center gap-3">
          <div className="w-12 h-12 min-w-[48px] bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group hover:scale-105 transition-transform cursor-pointer">
            <FaBrain className="text-white text-2xl" />
          </div>
          {state.isSidebarOpen && (
            <div className="overflow-hidden animate-fadeIn">
              <h1 className="text-xl font-black text-white tracking-tight">Neuro<span className="text-cyan-400">Assist</span></h1>
              <p className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest">Clinical Node</p>
            </div>
          )}
        </div>

        {/* ACTIVE USER PANEL */}
        {state.isSidebarOpen && user && (
          <div className="px-5 mb-8">
            <div className="bg-[#0d1f3c] p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <FaWaveSquare className="text-3xl text-cyan-400" />
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-inner shrink-0 ring-2 ring-white/10">
                  {getInitials(user.full_name)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] uppercase font-bold text-cyan-400/80 tracking-widest leading-none">
                      {user.role} ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
                  ${isActive
                    ? (link.isError ? 'bg-red-500 text-black font-bold shadow-lg shadow-red-500/20' : 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/20')
                    : (link.isError ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-text-secondary hover:bg-white/5 hover:text-white')
                  }
                `}
                title={!state.isSidebarOpen ? link.label : ""}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`text-xl transition-transform group-hover:scale-110 ${!state.isSidebarOpen ? 'mx-auto' : ''}`} />
                    {state.isSidebarOpen && (
                      <span className={`text-sm tracking-wide ${link.isError && !isActive ? 'font-bold' : ''}`}>{link.label}</span>
                    )}
                    {/* Active Glow Dot */}
                    {state.isSidebarOpen && (
                       <div className={`ml-auto w-1 h-1 rounded-full bg-black opacity-0 transition-opacity`} />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <button 
             className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-text-secondary hover:bg-white/5 hover:text-white transition-all group"
          >
            <div className="relative">
              <FaBell className="text-xl group-hover:rotate-12 transition-transform" />
              {state.notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#050d1a] rounded-full" />
              )}
            </div>
            {state.isSidebarOpen && <span className="text-sm font-medium">Alert Notifications</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all mt-1 group"
          >
            <FaSignOutAlt className="text-xl group-hover:-translate-x-1 transition-transform" />
            {state.isSidebarOpen && <span className="text-sm font-bold">Secure Logout</span>}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 198, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 198, 255, 0.2); }
      `}</style>
    </aside>
  );
};

export default Sidebar;
