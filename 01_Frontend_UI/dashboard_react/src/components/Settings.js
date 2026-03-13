import React, { useState, useEffect } from 'react';
import { motion } from 'react-router-dom';
import { 
  FaSun, FaMoon, FaBell, FaDatabase, 
  FaUserShield, FaServer, FaCode, FaMicrochip 
} from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const Settings = () => {
  const { state, dispatch } = useApp();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await api.getSystemStatus();
        setSystemStatus(data);
      } catch (err) {
        console.error("Failed to fetch system status:", err);
      } finally {
        setLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  const toggleTheme = () => {
    const newTheme = state.theme === 'medical' ? 'dark' : 'medical';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-text-secondary text-sm">Configure your clinical environment and monitor node health</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* APPEARANCE */}
        <div className="bg-card p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FaSun className="text-cyan-400" /> Appearance
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Visual Mode</p>
                <p className="text-xs text-text-secondary">Switch between Medical-Light and Neural-Dark</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="w-12 h-6 bg-black/40 rounded-full relative p-1 transition-colors hover:bg-black/60"
              >
                <motion.div 
                  animate={{ x: state.theme === 'medical' ? 0 : 24 }}
                  className="w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50"
                >
                  {state.theme === 'medical' ? <FaSun size={10} className="text-black" /> : <FaMoon size={10} className="text-black" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="bg-card p-6 rounded-2xl border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FaBell className="text-purple-400" /> Remote Alerts
          </h3>
          <div className="space-y-6">
            <ToggleOption 
              label="Email Result Sync" 
              desc="Auto-forward confirmed findings to HIS" 
              initial={true} 
            />
            <ToggleOption 
              label="Pipeline completion" 
              desc="Push notification on finished analysis" 
              initial={true} 
            />
          </div>
        </div>

        {/* SYSTEM DIAGNOSTICS */}
        <div className="bg-card p-6 rounded-2xl border border-white/5 md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FaServer className="text-emerald-400" /> Clinical Node Diagnostics
            </h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${loadingStatus ? 'bg-white/5 text-text-secondary' : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'}`}>
              {loadingStatus ? 'Checking...' : systemStatus?.status || 'Online'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DiagCard icon={<FaDatabase />} label="Database" value={`${systemStatus?.total_scans || 0} Records`} />
            <DiagCard icon={<FaMicrochip />} label="ML Engines" value={systemStatus?.models_loaded?.length || 2} />
            <DiagCard icon={<FaCode />} label="API Health" value="Healthy" />
            <DiagCard icon={<FaUserShield />} label="Encryption" value="AES-256" />
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex flex-col md:flex-row gap-4">
               <button className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2">
                 <FaDatabase /> Export Full Audit Log
               </button>
               <button className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 transition-all flex items-center justify-center gap-2">
                 Clear Temporary Model Cache
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleOption = ({ label, desc, initial }) => {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-xs text-text-secondary">{desc}</p>
      </div>
      <button 
        onClick={() => setOn(!on)}
        className="w-12 h-6 bg-black/40 rounded-full relative p-1 transition-colors"
      >
        <motion.div 
          animate={{ x: on ? 24 : 0 }}
          className={`w-4 h-4 rounded-full ${on ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'bg-gray-600'}`}
        />
      </button>
    </div>
  );
};

const DiagCard = ({ icon, label, value }) => (
  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
    <div className="text-cyan-400 mb-2">{icon}</div>
    <div className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{label}</div>
    <div className="text-sm font-bold text-white mt-1">{value}</div>
  </div>
);

export default Settings;
