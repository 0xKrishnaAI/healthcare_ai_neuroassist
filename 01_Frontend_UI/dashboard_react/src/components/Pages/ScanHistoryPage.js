import React, { useState, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  FaSearch, FaFilter, FaDownload, FaEye, 
  FaCalendarAlt, FaSpinner, FaMicroscope, FaUser 
} from 'react-icons/fa';

const ScanHistoryPage = () => {
    const navigate = useNavigate();
    const [scans, setScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        let isMounted = true;
        const fetchHistory = async () => {
             try {
                 const data = await api.getScanHistory();
                 if (!isMounted) return;
                 const items = data.items || data || [];
                 setScans(items);
             } catch (err) {
                 console.error("History fetch error:", err);
             } finally {
                 if (isMounted) setIsLoading(false);
             }
        };
        fetchHistory();
        return () => { isMounted = false; };
    }, []);

    const filteredScans = useMemo(() => {
        return scans.filter(s => {
            const name = s.patient?.full_name?.toLowerCase() || '';
            const id = s.id?.toString() || '';
            const searchLower = searchTerm.toLowerCase();
            const matchSearch = name.includes(searchLower) || id.includes(searchLower);
            const matchStatus = statusFilter === 'all' || (statusFilter === 'reviewed' ? s.is_reviewed : !s.is_reviewed);
            return matchSearch && matchStatus;
        });
    }, [scans, searchTerm, statusFilter]);

    return (
        <div className="animate-fadeIn space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header Area */}
            <div className="bg-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 w-full xl:w-auto">
                   <h1 className="text-3xl font-black text-white tracking-tight uppercase">Neural Assessment Logs</h1>
                   <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.3em] mt-2">Longitudinal Record of Clinical AI Sessions</p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full xl:w-auto relative z-10 bg-black/20 p-2 sm:p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <div className="relative flex-1 min-w-[240px]">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" />
                        <input 
                            type="text" placeholder="Search Subject Token or Case ID..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder-text-muted focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all shadow-inner"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="relative min-w-[160px]">
                        <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500/50" />
                        <select 
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-[10px] text-white font-black tracking-widest uppercase outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 cursor-pointer appearance-none shadow-inner"
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Any Status</option>
                            <option value="pending">Pending Review</option>
                            <option value="reviewed">System Validated</option>
                        </select>
                    </div>

                    <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black py-3 px-6 rounded-2xl shadow-[0_0_20px_rgba(0,198,255,0.2)] hover:shadow-[0_0_30px_rgba(0,198,255,0.4)] transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] active:scale-95 whitespace-nowrap">
                        <FaDownload size={14} /> Export Datacore
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-card rounded-[2.5rem] p-4 sm:p-8 border border-white/5 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="overflow-x-auto relative z-10 custom-scrollbar pb-4">
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-white/5 align-bottom">
                            <tr className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">Case Protocol</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">Timestamp</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">Subject Identity</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">AI Finding</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">Algorithmic Certainty</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap">Validation</th>
                                <th className="px-6 py-4 pb-6 whitespace-nowrap text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <FaSpinner className="animate-spin text-cyan-500 text-3xl" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] animate-pulse">Decrypting Datacore...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredScans.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-20 text-center">
                                       <div className="bg-black/20 border border-white/5 p-8 rounded-3xl max-w-sm mx-auto flex flex-col items-center">
                                            <FaSearch className="text-4xl text-text-muted/30 mb-4" />
                                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] leading-relaxed">No clinical records found matching designated criteria.</p>
                                       </div>
                                    </td>
                                </tr>
                            ) : filteredScans.map((s) => {
                                const confidence = (s.confidence_ad || s.confidence || 0.8) * 100;
                                const predColor = s.prediction === 'AD' ? 'text-red-500' : s.prediction === 'MCI' ? 'text-amber-500' : 'text-emerald-500';
                                const predBg = s.prediction === 'AD' ? 'bg-red-500' : s.prediction === 'MCI' ? 'bg-amber-500' : 'bg-emerald-500';

                                return (
                                    <tr key={s.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => navigate(`/dashboard/scan/${s.id}`)}>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,198,255,0.1)]">
                                                <FaMicroscope size={14} />
                                              </div>
                                              <span className="font-mono text-xs text-white font-black tracking-widest decoration-cyan-500/30 group-hover:underline underline-offset-4">S-{s.id.toString().padStart(5, '0')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-[10px] text-text-secondary font-black uppercase tracking-widest">
                                                <FaCalendarAlt size={10} className="text-white/30" />
                                                {new Date(s.scan_date || s.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-text-muted border border-white/5 group-hover:border-white/20 transition-colors">
                                                <FaUser size={12} />
                                              </div>
                                              <div>
                                                <p className="text-xs font-black text-white leading-none mb-1 uppercase tracking-tight">{s.patient?.full_name}</p>
                                                <p className="text-[10px] text-cyan-400/60 font-mono font-bold">{s.patient?.patient_code}</p>
                                              </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${predBg} shadow-[0_0_8px_${predBg}] animate-pulse`} />
                                                <span className={`font-black text-sm tracking-tighter ${predColor}`}>
                                                    {s.prediction}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                              <div className="w-24 bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <div className={`h-full ${predBg} transition-all duration-1000`} style={{ width: `${confidence}%` }} />
                                              </div>
                                              <span className="text-xs text-white font-mono font-black">{confidence.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {s.is_reviewed ? (
                                                <span className="px-3 py-1.5 rounded-md text-[9px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)] flex items-center gap-1.5 w-min">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-400" /> VALIDATED
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-md text-[9px] font-black tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] flex items-center gap-1.5 w-min">
                                                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" /> QUEUED
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <button className="p-3 bg-white/5 rounded-xl text-text-muted group-hover:text-cyan-400 group-hover:bg-cyan-500/20 border border-transparent group-hover:border-cyan-500/30 transition-all shadow-lg">
                                                <FaEye size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default memo(ScanHistoryPage);
