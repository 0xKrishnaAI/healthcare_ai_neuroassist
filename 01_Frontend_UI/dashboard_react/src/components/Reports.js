import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChartBar, faTable, faSortUp, faSortDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getMockReports } from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = { CN: '#00E5A0', MCI: '#FFD166', AD: '#FF5E5E' };

const METRICS_DATA = [
    { class: 'CN', precision: 92, recall: 83, f1: 87, support: 13 },
    { class: 'MCI', precision: 70, recall: 70, f1: 70, support: 10 },
    { class: 'AD', precision: 56, recall: 67, f1: 56, support: 6 }
];


const CLASS_DISTRIBUTION = [
    { name: 'CN (Healthy)', value: 42, color: COLORS.CN },
    { name: 'MCI (Early)', value: 60, color: COLORS.MCI },
    { name: 'AD (Alzheimer\'s)', value: 28, color: COLORS.AD }
];

const TRAINING_CURVES = [
    { epoch: 1, trainLoss: 1.2, valLoss: 1.3, trainAcc: 45, valAcc: 40 },
    { epoch: 10, trainLoss: 0.5, valLoss: 0.6, trainAcc: 75, valAcc: 68 },
    { epoch: 20, trainLoss: 0.2, valLoss: 0.42, trainAcc: 92, valAcc: 74 },
    { epoch: 25, trainLoss: 0.15, valLoss: 0.40, trainAcc: 95, valAcc: 72 }
];

const ReportTable = memo(({ reports, sortField, sortOrder, handleSort, searchQuery, setSearchQuery }) => (
    <div className="bg-card overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <div className="relative max-w-md w-full">
                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Filter by Case ID or Assessment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/30 transition-all font-medium"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-[#050d1a]/50 text-[10px] text-text-muted font-black uppercase tracking-[0.2em]">
                    <tr>
                        {[
                            { key: 'id', label: 'Case Token' },
                            { key: 'date', label: 'Timestamp' },
                            { key: 'pred', label: 'Finding' },
                            { key: 'conf', label: 'Certainty' },
                            { key: 'status', label: 'Registry' },
                        ].map(col => (
                            <th
                                key={col.key}
                                onClick={() => handleSort(col.key)}
                                className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {col.label}
                                    {sortField === col.key && (
                                        <FontAwesomeIcon icon={sortOrder === 'asc' ? faSortUp : faSortDown} className="text-cyan-400" />
                                    )}
                                </div>
                            </th>
                        ))}
                        <th className="p-6">Intervention</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                    {reports.map((report, idx) => (
                        <tr key={report.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-6 font-mono font-bold text-cyan-400/80 tracking-tighter underline underline-offset-4 decoration-cyan-500/20">{report.id}</td>
                            <td className="p-6 text-text-secondary font-medium">{new Date(report.date).toLocaleDateString()}</td>
                            <td className="p-6">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                    report.pred === 'CN' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' :
                                    report.pred === 'MCI' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/10' : 
                                    'bg-red-500/10 text-red-500 shadow-red-500/10'
                                }`}>
                                    {report.pred}
                                </span>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-20 bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5 p-px">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ 
                                                width: `${report.conf}%`,
                                                background: report.conf >= 90 ? COLORS.CN : report.conf >= 50 ? COLORS.MCI : COLORS.AD
                                            }}
                                        />
                                    </div>
                                    <span className="font-bold font-mono text-white text-xs">
                                        {report.conf}%
                                    </span>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'Complete' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-gray-500'}`} />
                                    <span className="text-[10px] uppercase font-black text-text-secondary tracking-widest">{report.status}</span>
                                </div>
                            </td>
                            <td className="p-6">
                                <button className="text-cyan-400 hover:text-white font-black text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 transition-all underline underline-offset-4 decoration-cyan-500/30">
                                    Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
));

const PerformanceCharts = memo(() => (
    <div className="grid lg:grid-cols-2 gap-6 animate-fadeIn pb-10">
        <div className="bg-card p-8 rounded-3xl border border-white/5 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-l-2 border-purple-500 pl-4">Confusion Matrix Insights</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={METRICS_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="class" tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="rgba(255,255,255,0.05)" />
                    <YAxis domain={[0, 100]} tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="rgba(255,255,255,0.05)" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1f3c', border: 'none', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff', fontSize: 10 }} />
                    <Legend />
                    <Bar dataKey="precision" fill="#8b5cf6" name="Precision" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="recall" fill="#06b6d4" name="Recall" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="f1" fill="#10b981" name="F1-Score" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-white/5 shadow-2xl">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-l-2 border-emerald-500 pl-4">Distribution Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={CLASS_DISTRIBUTION} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                        {CLASS_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0d1f3c', border: 'none', borderRadius: 16, color: '#fff', fontSize: 10 }} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-6">
                {CLASS_DISTRIBUTION.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }}></div>
                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{item.name.split(' ')[0]}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Training Curves */}
        <div className="bg-card p-8 rounded-3xl border border-white/5 shadow-2xl lg:col-span-2">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 border-l-2 border-cyan-500 pl-4">ResNet-10 Optimization Curves</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={TRAINING_CURVES}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="epoch" tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="rgba(255,255,255,0.05)" />
                    <YAxis tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="rgba(255,255,255,0.05)" />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1f3c', border: 'none', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontSize: 10 }} />
                    <Legend />
                    <Line type="monotone" dataKey="trainAcc" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Train Acc %" />
                    <Line type="monotone" dataKey="valAcc" stroke="#00C6FF" strokeWidth={3} dot={{ r: 4, fill: '#00C6FF' }} name="Validation Acc %" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
));

const Reports = () => {
    const rawReports = useMemo(() => getMockReports(), []);
    const [viewMode, setViewMode] = useState('table');
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [classMode, setClassMode] = useState('multi');

    const filteredReports = useMemo(() => {
        return rawReports
            .filter(r => r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.pred.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                const order = sortOrder === 'asc' ? 1 : -1;
                if (sortField === 'conf') return (a.conf - b.conf) * order;
                return (a[sortField]?.toString() || '').localeCompare(b[sortField]?.toString() || '') * order;
            });
    }, [rawReports, searchQuery, sortField, sortOrder]);

    const handleSort = (field) => {
        if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortOrder('desc'); }
    };

    const handleExport = () => {
        const csv = [
            ['Case ID', 'Date', 'Prediction', 'Confidence', 'Status'].join(','),
            ...filteredReports.map(r => [r.id, r.date, r.pred, r.conf, r.status].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'NeuroAssist_Diagnosis_Logs.csv';
        a.click();
    };

    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">DIAGNOSTIC ARCHIVE</h2>
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em] mt-1">AI-Powered Historical Record Registry</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="bg-black/40 p-1 rounded-2xl border border-white/5 flex shadow-xl">
                        <button onClick={() => setViewMode('table')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-cyan-500 text-black' : 'text-text-muted hover:text-white'}`}>
                            <FontAwesomeIcon icon={faTable} className="mr-2" />Table
                        </button>
                        <button onClick={() => setViewMode('charts')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'charts' ? 'bg-cyan-500 text-black' : 'text-text-muted hover:text-white'}`}>
                            <FontAwesomeIcon icon={faChartBar} className="mr-2" />Analytics
                        </button>
                    </div>

                    <div className="bg-black/40 p-1 rounded-2xl border border-white/5 flex shadow-xl">
                        <button onClick={() => setClassMode('binary')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${classMode === 'binary' ? 'bg-emerald-500 text-black shadow-emerald-500/20 shadow-lg' : 'text-text-muted hover:text-emerald-400'}`}>Binary</button>
                        <button onClick={() => setClassMode('multi')} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${classMode === 'multi' ? 'bg-purple-500 text-white shadow-purple-500/20 shadow-lg' : 'text-text-muted hover:text-purple-400'}`}>Multi</button>
                    </div>

                    <button onClick={handleExport} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black rounded-2xl shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-[1.02]">
                        <FontAwesomeIcon icon={faDownload} /> Export Logs
                    </button>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="bg-card p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none" />
                <div className="flex flex-wrap gap-10 relative z-10">
                    <div>
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest block mb-1">Classifier Integrity</span>
                        <div className="flex items-center gap-3">
                           <span className={`text-2xl font-black ${classMode === 'binary' ? 'text-emerald-400' : 'text-purple-400'}`}>
                             {classMode === 'binary' ? '87.0%' : '72.4%'}
                           </span>
                           <span className="text-[9px] font-black text-text-muted uppercase">Balanced Accuracy</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest block mb-1">Process Latency</span>
                        <div className="flex items-center gap-3">
                           <span className="text-2xl font-black text-white">42ms</span>
                           <span className="text-[9px] font-black text-text-muted uppercase">Engine Inference</span>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-2 rounded-2xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-black text-cyan-400 tracking-[0.2em] uppercase">Status: Sychronized</span>
                </div>
            </div>

            {viewMode === 'table' ? (
                <ReportTable 
                    reports={filteredReports}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    handleSort={handleSort}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            ) : (
                <PerformanceCharts />
            )}
        </motion.div>
    );
};

export default Reports;
