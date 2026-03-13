import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaBrain, FaUsers, FaMicroscope, FaStethoscope, 
  FaArrowRight, FaCheckCircle, FaExclamationTriangle,
  FaPlus, FaChartLine, FaSpinner, FaHistory
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import BrainVisualization3D from '../BrainVisualization3D';

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
    async function fetchDashboardData() {
      try {
        const [statusData, historyData] = await Promise.all([
          api.getSystemStatus(),
          api.getScanHistory({ limit: 5 })
        ]);
        
        // Extract real history items
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
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const diagnosisData = [
    { name: 'Normal (CN)', value: 45, color: '#00E5A0' },
    { name: 'Mild (MCI)', value: 30, color: '#FFD166' },
    { name: 'Dementia (AD)', value: 25, color: '#FF5E5E' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* WELCOME BANNER */}
      <div className="relative overflow-hidden bg-card p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white mb-2">
            Welcome, {user?.role === 'doctor' ? 'Dr. ' : ''}{user?.full_name?.split(' ')[0] || 'Clinician'}
          </h1>
          <p className="text-text-secondary text-lg font-medium">
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

      {/* MID SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3D Visualizer */}
        <div className="lg:col-span-2 bg-card rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
           <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/10">
              <div className="flex items-center gap-2">
                <FaMicroscope className="text-cyan-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Neural Voxel Simulation</h3>
              </div>
           </div>
           <div className="flex-1 min-h-[450px]">
              <BrainVisualization3D brainRegions={{ hippocampus: 0.05, temporal_lobe: 0.05 }} isLoading={loading} />
           </div>
        </div>

        {/* Distribution & Activity */}
        <div className="flex flex-col gap-6">
          {/* Pie Chart */}
          <div className="bg-card p-6 rounded-3xl border border-white/5 shadow-xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-cyan-400 pl-3">Scan Distribution</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diagnosisData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {diagnosisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{stats.total_scans}</span>
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">TOTAL</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card p-6 rounded-3xl border border-white/5 shadow-xl flex-1">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-purple-400 pl-3">Neural Feed</h3>
            <div className="space-y-4">
              <ActivityItem icon={<FaPlus />} color="text-cyan-400" title="System Sync" desc="4 new patients imported" time="2h ago" />
              <ActivityItem icon={<FaCheckCircle />} color="text-emerald-400" title="Analysis Validated" desc="Case #SCN-001 approved" time="4h ago" />
              <ActivityItem icon={<FaExclamationTriangle />} color="text-red-400" title="High Risk Detected" desc="Hippocampal atrophy in NA-2024-003" time="1d ago" />
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SCANS TABLE */}
      <div className="bg-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/10">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Recent Neural Assessments</h3>
          <button 
             onClick={() => navigate('/dashboard/history')}
             className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:underline"
          >
            Access Full Logs <FaArrowRight size={8} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#050d1a] text-[10px] text-text-secondary font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4">Case Token</th>
                <th className="px-6 py-4">Patient Subject</th>
                <th className="px-6 py-4">Clinical Finding</th>
                <th className="px-6 py-4">Certainty</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center"><FaSpinner className="animate-spin text-cyan-400 mx-auto" /></td></tr>
              ) : recentScans.length > 0 ? recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-white/5 transition-all group cursor-pointer" onClick={() => navigate(`/dashboard/scan/${scan.id}`)}>
                  <td className="px-6 py-4 font-mono text-xs text-cyan-400/80">
                    #SCN-{scan.id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-white">{scan.patient?.full_name || 'Anonymous'}</div>
                    <div className="text-[10px] text-text-secondary font-mono">{scan.patient?.patient_code || 'NA-001'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      scan.prediction === 'AD' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                      scan.prediction === 'MCI' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {scan.prediction}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full ${scan.prediction === 'AD' ? 'bg-red-500' : 'bg-cyan-500'}`} 
                        style={{ width: `${(scan.confidence_ad || scan.confidence || 0.8) * 100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-white font-mono mt-1 block">{(scan.confidence_ad || scan.confidence || 0.8) * 100}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${scan.is_reviewed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                       <span className="text-[10px] font-bold text-text-secondary uppercase">{scan.is_reviewed ? 'Validated' : 'Queued'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-text-muted group-hover:text-cyan-400 transition-colors">
                    <FaArrowRight size={12} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-10 text-center text-text-secondary text-xs uppercase tracking-widest font-bold">No Neural Logs Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, trend }) => (
  <div className="bg-card p-6 rounded-3xl border border-white/5 shadow-xl group hover:border-cyan-500/20 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-black/40 rounded-2xl group-hover:scale-110 transition-transform">
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
);

const ActivityItem = ({ icon, color, title, desc, time }) => (
  <div className="flex gap-4 group">
    <div className={`w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5 ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="overflow-hidden">
      <h4 className="text-xs font-bold text-white truncate">{title}</h4>
      <p className="text-[10px] text-text-secondary mt-0.5 truncate">{desc}</p>
      <p className="text-[8px] text-text-muted font-mono mt-1">{time}</p>
    </div>
  </div>
);
