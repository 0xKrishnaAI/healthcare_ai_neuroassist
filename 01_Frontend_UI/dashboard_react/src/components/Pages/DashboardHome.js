import React, { useState, useEffect, memo } from 'react';
import { 
  FaBrain, FaUsers, FaArrowRight, FaCheckCircle, 
  FaExclamationTriangle, FaPlus, FaSpinner,
  FaServer, FaNetworkWired, FaDatabase, FaShieldAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

const DIAGNOSIS_DATA = [
    { name: 'Normal (CN)', value: 45, color: '#00E5A0' },
    { name: 'Mild (MCI)', value: 30, color: '#FFD166' },
    { name: 'Dementia (AD)', value: 25, color: '#FF5E5E' },
];

const StatCard = memo(({ icon, title, value, trend }) => (
  <div className="bg-card p-6 rounded-2xl border border-white/5 shadow-lg group hover:border-cyan-500/20 transition-all duration-300 ease-out hover:scale-[1.03] will-change-transform">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-black/40 rounded-xl group-hover:scale-110 transition-transform duration-300 ease-out">
        {icon}
      </div>
      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
    </div>
    <div>
      <h4 className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">{title}</h4>
      <div className="text-3xl font-black text-white">{value}</div>
      <p className="text-[10px] text-text-muted mt-2 font-bold italic">{trend}</p>
    </div>
  </div>
));

const ActivityItem = memo(({ icon, color, title, desc, time }) => (
  <div className="flex gap-4 group cursor-pointer transition-opacity duration-300 ease-out hover:opacity-80">
    <div className={`w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5 ${color} group-hover:scale-110 transition-transform duration-300 ease-out will-change-transform`}>
      {icon}
    </div>
    <div className="overflow-hidden">
      <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 ease-out truncate">{title}</h4>
      <p className="text-[10px] text-text-secondary mt-0.5 truncate">{desc}</p>
      <p className="text-[8px] text-text-muted font-mono mt-1">{time}</p>
    </div>
  </div>
));

const SystemStatusItem = memo(({ icon, label, status_text, color }) => (
  <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
     <div className="flex items-center gap-3">
        <div className={`text-${color}-400`}>{icon}</div>
        <div className="text-xs font-bold text-white uppercase tracking-widest">{label}</div>
     </div>
     <div className={`text-[10px] font-black text-${color}-400 uppercase tracking-widest`}>{status_text}</div>
  </div>
));

export default function DashboardHome() {
  const { state } = useApp();
  const user = state.auth?.user;
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_scans: 0,
    total_patients: 0,
    pending_review: 0,
    high_risk: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboardData() {
      try {
        const [statusData, historyData] = await Promise.all([
          api.getSystemStatus(),
          api.getScanHistory({ limit: 5 })
        ]);
        
        if (!isMounted) return;

        const items = historyData.items || historyData || [];
        
        setStats({
          total_scans: statusData.total_scans || 0,
          total_patients: statusData.total_patients || 0,
          pending_review: items.filter(s => !s.is_reviewed).length,
          high_risk: items.filter(s => s.prediction === 'AD').length
        });
        setRecentScans(items);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden bg-card p-8 rounded-2xl border border-white/5 shadow-2xl">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">
            Welcome, {user?.role === 'doctor' ? 'Dr. ' : ''}{user?.full_name?.split(' ')[0] || 'Clinician'}
          </h1>
          <p className="text-text-secondary text-sm font-medium">
             Node <span className="text-cyan-400 font-mono">NA-ALPHA-01</span> is synchronized. {stats.pending_review} findings await your validation.
          </p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FaBrain className="text-cyan-400" />} 
          title="Total Assessments" 
          value={stats.total_scans} 
          trend="System Baseline: Stable"
        />
        <StatCard 
          icon={<FaUsers className="text-purple-400" />} 
          title="Patient Registry" 
          value={stats.total_patients} 
          trend="Last added: Rajesh K."
        />
        <StatCard 
          icon={<FaExclamationTriangle className="text-red-400" />} 
          title="High Risk Alerts" 
          value={stats.high_risk} 
          trend="Immediate Review Req."
        />
        <StatCard 
          icon={<FaCheckCircle className="text-emerald-400" />} 
          title="System Integrity" 
          value="99.9%" 
          trend="Latency: 12ms"
        />
      </div>

      {/* CLEAN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SYSTEM STATUS (Replaces 3D Brain) */}
        <div className="lg:col-span-1 bg-card p-6 rounded-2xl border border-white/5 shadow-lg relative transition-transform duration-300 hover:-translate-y-1">
           <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-emerald-400 pl-3">Live System Status</h3>
           <div className="space-y-4">
              <SystemStatusItem icon={<FaServer />} label="Core Compute" status_text="Online" color="emerald" />
              <SystemStatusItem icon={<FaDatabase />} label="Database" status_text="Connected" color="cyan" />
              <SystemStatusItem icon={<FaNetworkWired />} label="Inference Engine" status_text="Active" color="purple" />
              <SystemStatusItem icon={<FaShieldAlt />} label="Security" status_text="Encrypted" color="emerald" />
           </div>
           
           <h3 className="text-xs font-black text-white uppercase tracking-widest mt-8 mb-6 px-1 border-l-2 border-cyan-400 pl-3">Scan Distribution</h3>
           <div className="h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DIAGNOSIS_DATA}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {DIAGNOSIS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1f3c', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white">{stats.total_scans}</span>
              </div>
            </div>
        </div>

        {/* NEURAL FEED */}
        <div className="lg:col-span-1 bg-card p-6 rounded-2xl border border-white/5 shadow-lg relative transition-transform duration-300 hover:-translate-y-1">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-purple-400 pl-3">Neural Feed</h3>
            <div className="space-y-6">
              <ActivityItem icon={<FaPlus />} color="text-cyan-400" title="System Sync" desc="4 new patients imported" time="2h ago" />
              <ActivityItem icon={<FaCheckCircle />} color="text-emerald-400" title="Analysis Validated" desc="Case #SCN-001 approved" time="4h ago" />
              <ActivityItem icon={<FaExclamationTriangle />} color="text-red-400" title="High Risk Detected" desc="Hippocampal atrophy in NA-2024-003" time="1d ago" />
              <ActivityItem icon={<FaBrain />} color="text-blue-400" title="Model Update" desc="Multi-class classifier synced" time="2d ago" />
            </div>
        </div>

        {/* RECENT SCANS TABLE (Moved up for cleaner layout) */}
        <div className="lg:col-span-1 bg-card rounded-2xl border border-white/5 shadow-lg overflow-hidden relative transition-transform duration-300 hover:-translate-y-1 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/10">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Logs</h3>
                <button 
                  onClick={() => navigate('/dashboard/history')}
                  className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:underline"
                >
                  <FaArrowRight size={10} />
                </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
                {loading ? (
                    <div className="flex justify-center p-10"><FaSpinner className="animate-spin text-cyan-400" /></div>
                ) : recentScans.length > 0 ? (
                    <div className="space-y-2">
                        {recentScans.map((scan) => (
                            <div key={scan.id} onClick={() => navigate(`/dashboard/scan/${scan.id}`)} className="bg-black/20 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between border border-transparent hover:border-white/10">
                                <div>
                                    <div className="text-xs font-bold text-white">{scan.patient?.full_name || 'Anonymous'}</div>
                                    <div className="font-mono text-[9px] text-cyan-400">#SCN-{scan.id.toString().padStart(4, '0')}</div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${scan.prediction === 'AD' ? 'bg-red-500/10 text-red-500 border-red-500/20' : scan.prediction === 'MCI' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                        {scan.prediction}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center text-text-secondary text-xs uppercase tracking-widest font-bold">No Neural Logs</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
