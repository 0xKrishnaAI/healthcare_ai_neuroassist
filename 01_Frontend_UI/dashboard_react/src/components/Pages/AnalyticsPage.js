import React from 'react';
import { useApp } from '../../context/AppContext';
import { Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, 
  Treemap, AreaChart, Area 
} from 'recharts';
import { FaChartLine, FaBrain, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const AnalyticsPage = () => {
    const { state } = useApp();
    const { user } = state.auth;

    if (user?.role !== 'doctor') {
        return <Navigate to="/dashboard" replace />;
    }

    const distData = [
        { month: 'Oct', CN: 40, MCI: 24, AD: 10 },
        { month: 'Nov', CN: 30, MCI: 13, AD: 15 },
        { month: 'Dec', CN: 45, MCI: 28, AD: 8 },
        { month: 'Jan', CN: 50, MCI: 30, AD: 12 },
        { month: 'Feb', CN: 42, MCI: 22, AD: 18 },
        { month: 'Mar', CN: 35, MCI: 18, AD: 9 },
    ];

    const confData = [
        { range: '50-60%', count: 5 },
        { range: '60-70%', count: 12 },
        { range: '70-80%', count: 28 },
        { range: '80-90%', count: 85 },
        { range: '90-100%', count: 140 },
    ];

    const riskData = [
        { name: 'Under 50', size: 10, fill: '#00E5A0' },
        { name: '50-60', size: 30, fill: '#FFD166' },
        { name: '60-70', size: 50, fill: '#FFD166' },
        { name: '70-80', size: 85, fill: '#FF5E5E' },
        { name: '80+', size: 45, fill: '#FF5E5E' }
    ];

    return (
        <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto">
            <div className="bg-card p-6 rounded-3xl border border-white/5 shadow-xl flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">Clinical Analytics</h1>
                <p className="text-text-secondary text-sm">Aggregated neural markers and population-level insights</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Global Accuracy</p>
                  <p className="text-xl font-black text-cyan-400">98.4%</p>
                </div>
                <div className="text-right border-l border-white/10 pl-4">
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Latency Avg</p>
                  <p className="text-xl font-black text-white">0.82s</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* DIAGNOSIS TREND */}
                <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-8">
                      <FaChartLine className="text-cyan-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Diagnosis Staging (6M)</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={distData}>
                                <defs>
                                    <linearGradient id="colorAD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF5E5E" stopOpacity={0.3}/><stop offset="95%" stopColor="#FF5E5E" stopOpacity={0}/></linearGradient>
                                    <linearGradient id="colorCN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3}/><stop offset="95%" stopColor="#00E5A0" stopOpacity={0}/></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#3a5c80" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#3a5c80" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="AD" stroke="#FF5E5E" fillOpacity={1} fill="url(#colorAD)" strokeWidth={2} name="Alzheimer's" />
                                <Area type="monotone" dataKey="CN" stroke="#00E5A0" fillOpacity={1} fill="url(#colorCN)" strokeWidth={2} name="Normal" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CONFIDENCE DISTRIBUTION */}
                <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-8">
                      <FaBrain className="text-purple-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Confidence Spectrum</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={confData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="range" type="category" stroke="#3a5c80" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                />
                                <Bar dataKey="count" fill="#00C6FF" name="Scans" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* REVIEW TIME */}
                <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-8">
                      <FaClock className="text-emerald-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Mean Validation Latency</h3>
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-center bg-black/20 p-4 rounded-2xl flex-1 mr-2 border border-white/5">
                        <p className="text-[8px] text-text-secondary font-black uppercase tracking-widest">Avg TTR</p>
                        <p className="text-2xl font-black text-white">4.2h</p>
                      </div>
                      <div className="text-center bg-black/20 p-4 rounded-2xl flex-1 ml-2 border border-white/5">
                        <p className="text-[8px] text-text-secondary font-black uppercase tracking-widest">Compliance</p>
                        <p className="text-2xl font-black text-emerald-400">100%</p>
                      </div>
                    </div>
                    <div className="h-44 w-full opacity-50">
                        {/* Decorative bar chart placeholder */}
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distData}>
                                <Bar dataKey="AD" fill="#3a5c80" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RISK TREEMAP */}
                <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
                    <div className="flex items-center gap-2 mb-8">
                      <FaExclamationTriangle className="text-red-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Demographic Risk Map</h3>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={riskData}
                                dataKey="size"
                                stroke="#0d1f3c"
                                fill="#00C6FF"
                                content={(props) => {
                                    const { x, y, width, height, index, name } = props;
                                    const nodeFill = riskData[index]?.fill || '#00C6FF';
                                    return (
                                        <g>
                                            <rect 
                                              x={x} y={y} width={width} height={height} 
                                              style={{ fill: nodeFill, stroke: '#0d1f3c', strokeWidth: 2, opacity: 0.8 }} 
                                            />
                                            {width > 60 && height > 30 && (
                                                <text 
                                                  x={x + width / 2} y={y + height / 2} 
                                                  textAnchor="middle" fill="#000" 
                                                  fontSize={10} fontWeight="bold"
                                                  className="uppercase tracking-tighter"
                                                >
                                                    {name}
                                                </text>
                                            )}
                                        </g>
                                    );
                                }}
                            />
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsPage;
