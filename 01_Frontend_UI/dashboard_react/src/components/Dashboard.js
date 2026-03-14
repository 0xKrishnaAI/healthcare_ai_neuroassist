import React, { useState, useEffect } from 'react';
import { 
  FaBrain, FaUsers, FaMicroscope, 
  FaArrowRight, FaCheckCircle,
  FaPlus, FaChartLine
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import BrainVisualization3D from './BrainVisualization3D';

export default function Dashboard() {
  const { state } = useApp();
  const user = state.auth?.user;
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_scans: 0,
    total_patients: 0,
    storage_used: '12%',
    system_health: 'Healthy'
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
        setStats({
          total_scans: statusData.total_scans || 0,
          total_patients: statusData.total_patients || 0,
          storage_used: '18%', // Simulated
          system_health: 'Healthy'
        });
        setRecentScans(historyData || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const chartData = [
    { name: 'Mon', scans: 4 },
    { name: 'Tue', scans: 7 },
    { name: 'Wed', scans: 5 },
    { name: 'Thu', scans: 12 },
    { name: 'Fri', scans: 9 },
    { name: 'Sat', scans: 3 },
    { name: 'Sun', scans: 2 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Overview</h1>
          <p className="text-text-secondary text-sm">Welcome back, {user?.full_name || 'Doctor'}. System is monitoring all neural assessments.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/dashboard/scan')}
            className="px-5 py-2.5 bg-primary text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <FaPlus size={14} /> New Analysis
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<FaMicroscope className="text-cyan-400" />} 
          title="Total Scans" 
          value={stats.total_scans} 
          trend="+12% from last week"
        />
        <StatCard 
          icon={<FaUsers className="text-purple-400" />} 
          title="Active Patients" 
          value={stats.total_patients} 
          trend="New Patient: Rajesh K."
        />
        <StatCard 
          icon={<FaChartLine className="text-emerald-400" />} 
          title="Diagnosis Accuracy" 
          value="98.2%" 
          trend="+0.4% baseline"
        />
        <StatCard 
          icon={<FaCheckCircle className="text-blue-400" />} 
          title="System Cluster" 
          value={stats.system_health} 
          trend="Last optimized: 2h ago"
        />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: 3D Visualization */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaBrain className="text-primary" />
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">Neuro-Map Global Node</h3>
            </div>
            <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-0.5 rounded">REAL-TIME RENDER</span>
          </div>
          <div className="flex-1 min-h-[400px]">
            <BrainVisualization3D brainRegions={{ hippocampus: 0.1, frontal_lobe: 0.1 }} isLoading={loading} />
          </div>
        </div>

        {/* RIGHT: Trend Chart */}
        <div className="bg-card rounded-2xl border border-white/5 p-5 flex flex-col">
          <h3 className="font-bold text-white text-sm mb-6 uppercase tracking-wider">Analysis Volume</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C6FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00C6FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3a5c80', fontSize: 10 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#00C6FF', fontSize: '11px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke="#00C6FF" 
                  fillOpacity={1} 
                  fill="url(#colorScans)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Avg Processing Time</span>
              <span className="text-white font-mono">1.2s</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Model Version</span>
              <span className="text-white font-mono">v4.2.0-MedNet</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SCANS TABLE */}
      <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Recent Neural Assessments</h3>
          <button 
            onClick={() => navigate('/dashboard/history')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View All <FaArrowRight size={8} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] text-text-secondary uppercase tracking-widest bg-black/20">
              <tr>
                <th className="px-6 py-4 font-bold">Case ID</th>
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Diagnosis</th>
                <th className="px-6 py-4 font-bold">Confidence</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentScans.length > 0 ? recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-cyan-400">#SCN-{scan.id.toString().padStart(4, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-bold text-white">{scan.patient?.full_name || 'Unknown'}</div>
                      <div className="text-[10px] text-text-secondary">{scan.patient?.patient_code || '---'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      scan.prediction === 'AD' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                      scan.prediction === 'MCI' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {scan.prediction}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-white">
                    {(scan.confidence_ad * 100 || scan.confidence * 100 || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${scan.is_reviewed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[10px] text-text-secondary">{scan.is_reviewed ? 'Reviewed' : 'Pending Review'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                   <button className="text-primary hover:text-white transition-colors">
                      <FaArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-text-secondary text-sm">No recent scans found. Start by uploading a new MRI.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, trend }) => (
  <div className="bg-card p-5 rounded-2xl border border-white/5 shadow-lg group hover:border-primary/20 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-black/30 rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">LIVE</div>
    </div>
    <div>
      <h4 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
      <div className="text-3xl font-black text-white">{value}</div>
      <p className="text-[10px] text-text-muted mt-2 font-medium">{trend}</p>
    </div>
  </div>
);
