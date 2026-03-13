import React, { memo, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend, 
  Treemap, AreaChart, Area 
} from 'recharts';
import { FaChartLine, FaBrain, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const DIST_DATA = [
    { month: 'Oct', CN: 40, MCI: 24, AD: 10 },
    { month: 'Nov', CN: 30, MCI: 13, AD: 15 },
    { month: 'Dec', CN: 45, MCI: 28, AD: 8 },
    { month: 'Jan', CN: 50, MCI: 30, AD: 12 },
    { month: 'Feb', CN: 42, MCI: 22, AD: 18 },
    { month: 'Mar', CN: 35, MCI: 18, AD: 9 },
];

const CONF_DATA = [
    { range: '50-60%', count: 5 },
    { range: '60-70%', count: 12 },
    { range: '70-80%', count: 28 },
    { range: '80-90%', count: 85 },
    { range: '90-100%', count: 140 },
];

const RISK_DATA = [
    { name: 'Under 50', size: 10, fill: '#00E5A0' },
    { name: '50-60', size: 30, fill: '#FFD166' },
    { name: '60-70', size: 50, fill: '#FFD166' },
    { name: '70-80', size: 85, fill: '#FF5E5E' },
    { name: '80+', size: 45, fill: '#FF5E5E' }
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0d1f3c] border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-white text-xs font-bold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                        <span style={{ color: entry.color || '#fff' }}>{entry.name || entry.dataKey}:</span>
                        <span className="text-white">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomTreemapNode = memo((props) => {
    const { x, y, width, height, index, name, fill } = props;
    if (width < 30 || height < 30) return null; // Don't render tiny nodes
    return (
        <g>
            <rect 
                x={x} y={y} width={width} height={height} 
                style={{ fill, stroke: '#050d1a', strokeWidth: 3, opacity: 0.85, rx: 8, ry: 8 }} 
                className="hover:opacity-100 transition-opacity cursor-pointer"
            />
            {width > 60 && height > 30 && (
                <text 
                    x={x + width / 2} y={y + height / 2} 
                    textAnchor="middle" fill="#000" 
                    fontSize={10} fontWeight="900"
                    className="uppercase tracking-tighter mix-blend-color-burn"
                >
                    {name}
                </text>
            )}
        </g>
    );
});

const DiagnosisTrendChart = memo(() => (
    <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
        <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <FaChartLine className="text-cyan-400 text-lg" />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Diagnosis Staging</h3>
                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-0.5">6-Month Temporal Sequence</p>
            </div>
        </div>
        <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DIST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF5E5E" stopOpacity={0.4}/><stop offset="95%" stopColor="#FF5E5E" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorMCI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFD166" stopOpacity={0.4}/><stop offset="95%" stopColor="#FFD166" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorCN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00E5A0" stopOpacity={0.4}/><stop offset="95%" stopColor="#00E5A0" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" stroke="#3a5c80" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#3a5c80" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="AD" stroke="#FF5E5E" strokeWidth={3} fill="url(#colorAD)" name="Alzheimer's" activeDot={{r: 6, strokeWidth: 2, stroke: '#0d1f3c'}} />
                    <Area type="monotone" dataKey="MCI" stroke="#FFD166" strokeWidth={3} fill="url(#colorMCI)" name="Mild Cognitive Impairment" activeDot={{r: 6, strokeWidth: 2, stroke: '#0d1f3c'}} />
                    <Area type="monotone" dataKey="CN" stroke="#00E5A0" strokeWidth={3} fill="url(#colorCN)" name="Normal" activeDot={{r: 6, strokeWidth: 2, stroke: '#0d1f3c'}} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
));

const ConfidenceChart = memo(() => (
    <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
        <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <FaBrain className="text-purple-400 text-lg" />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Confidence Spectrum</h3>
                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-0.5">Model Certainty Distribution</p>
            </div>
        </div>
        <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CONF_DATA} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="range" type="category" stroke="#3a5c80" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Scans" radius={[0, 6, 6, 0]} barSize={24} activeBar={{ fill: '#00e5ff' }}>
                        {CONF_DATA.map((entry, index) => (
                            <cell key={`cell-${index}`} fill={`url(#colorGrad${index})`} />
                        ))}
                    </Bar>
                    <defs>
                        {CONF_DATA.map((_, i) => (
                            <linearGradient key={`colorGrad${i}`} id={`colorGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0a2a5e" />
                                <stop offset="100%" stopColor="#00C6FF" />
                            </linearGradient>
                        ))}
                    </defs>
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
));

const DemographicRiskMap = memo(() => (
    <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
        <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <FaExclamationTriangle className="text-red-400 text-lg" />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Demographic Risk Map</h3>
                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-0.5">Vulnerability by Age Cohort</p>
            </div>
        </div>
        <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <Treemap
                    data={RISK_DATA}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#050d1a"
                    content={<CustomTreemapNode />}
                />
            </ResponsiveContainer>
        </div>
    </div>
));

const MeanValidationLatency = memo(() => (
    <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
         <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <FaClock className="text-emerald-400 text-lg" />
            </div>
            <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-tight">Mean Validation Latency</h3>
                <p className="text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-0.5">Clinical Review Efficiency</p>
            </div>
        </div>
        
        <div className="flex items-center justify-between gap-6 mb-8 relative z-10">
            <div className="text-center bg-black/30 p-6 rounded-2xl flex-1 border border-white/5 shadow-inner">
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2">Avg Time-To-Review</p>
                <div className="flex justify-center items-end gap-1">
                    <p className="text-4xl font-black text-emerald-400">4.2</p>
                    <p className="text-sm font-bold text-emerald-400/50 mb-1">hrs</p>
                </div>
            </div>
            <div className="text-center bg-black/30 p-6 rounded-2xl flex-1 border border-white/5 shadow-inner">
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-2">Protocol Compliance</p>
                <div className="flex justify-center items-end gap-1">
                    <p className="text-4xl font-black text-white">100</p>
                    <p className="text-sm font-bold text-white/50 mb-1">%</p>
                </div>
            </div>
        </div>

        <div className="h-32 w-full mt-auto relative z-10">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DIST_DATA.slice(2)}>
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
                    <Bar dataKey="AD" fill="#10b981" radius={[8, 8, 8, 8]} barSize={12} opacity={0.6} activeBar={{ opacity: 1 }} />
                    <Bar dataKey="MCI" fill="#06b6d4" radius={[8, 8, 8, 8]} barSize={12} opacity={0.6} activeBar={{ opacity: 1 }} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
));

const AnalyticsPage = () => {
    const { state } = useApp();
    const { user } = state.auth;

    if (user?.role !== 'doctor') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="animate-fadeIn space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header / Key Metrics Banner */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                     <h1 className="text-3xl font-black text-white tracking-tight uppercase">Clinical Analytics</h1>
                     <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mt-2">Aggregated Neural Population Insights</p>
                </div>
                
                <div className="flex flex-wrap gap-8 relative z-10 backdrop-blur-md bg-black/20 p-4 rounded-3xl border border-white/10">
                    <div className="text-right px-4">
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-1">Global Accuracy</p>
                        <div className="flex items-center gap-2 justify-end">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                            <p className="text-3xl font-black text-white">98.4<span className="text-lg text-white/50">%</span></p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden sm:block" />
                    <div className="text-right px-4">
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-1">Latency Avg</p>
                        <p className="text-3xl font-black text-cyan-400">0.82<span className="text-lg text-cyan-400/50">s</span></p>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DiagnosisTrendChart />
                <ConfidenceChart />
                <MeanValidationLatency />
                <DemographicRiskMap />
            </div>
        </div>
    );
};

export default AnalyticsPage;
