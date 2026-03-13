import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { 
  FaSearch, FaFilter, FaDownload, FaEye, 
  FaCalendarAlt, FaSpinner, FaMicroscope, FaUser 
} from 'react-icons/fa';

const ScanHistoryPage = () => {
    const { state } = useApp();
    const navigate = useNavigate();
    const [scans, setScans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await api.getScanHistory();
                // Ensure data is an array
                const items = data.items || data || [];
                setScans(items);
            } catch (err) {
                console.error("History fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredScans = scans.filter(s => {
        const name = s.patient?.full_name || '';
        const id = s.id?.toString() || '';
        const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || id.includes(searchTerm);
        const matchStatus = statusFilter === 'all' || (statusFilter === 'reviewed' ? s.is_reviewed : !s.is_reviewed);
        return matchSearch && matchStatus;
    });

    return (
        <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-card p-6 rounded-3xl border border-white/5 shadow-xl">
                <div>
                   <h1 className="text-2xl font-black text-white">Neural Assessment Logs</h1>
                   <p className="text-text-secondary text-sm">Longitudinal record of all clinical analysis sessions</p>
                </div>
                
                <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[240px]">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                            type="text" placeholder="Search Patient Token or Case ID..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-text-muted focus:border-cyan-500/30 outline-none transition-all font-medium"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <select 
                        className="bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs text-white font-bold outline-none focus:border-cyan-500/30 cursor-pointer min-w-[140px]"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">ANY STATUS</option>
                        <option value="pending">PENDING</option>
                        <option value="reviewed">VALIDATED</option>
                    </select>

                    <button className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold py-3 px-6 rounded-2xl border border-cyan-500/20 transition-all flex items-center justify-center gap-2 text-xs">
                        <FaDownload /> EXPORT ISO-LOG
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#050d1a] border-b border-white/5">
                            <tr className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">
                                <th className="px-6 py-5">Case ID</th>
                                <th className="px-6 py-5">Timestamp</th>
                                <th className="px-6 py-5">Subject</th>
                                <th className="px-6 py-5">Finding</th>
                                <th className="px-6 py-5">Certainty</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr><td colSpan="7" className="p-12 text-center"><FaSpinner className="animate-spin text-cyan-400 mx-auto text-2xl" /></td></tr>
                            ) : filteredScans.length === 0 ? (
                                <tr><td colSpan="7" className="p-12 text-center text-text-secondary text-xs font-bold uppercase tracking-widest leading-loose">No Clinical Records Found Matching Criteria</td></tr>
                            ) : filteredScans.map((s) => (
                                <tr key={s.id} className="hover:bg-white/5 transition-all group cursor-pointer" onClick={() => navigate(`/dashboard/scan/${s.id}`)}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-black/40 rounded-lg text-cyan-400 border border-white/5">
                                            <FaMicroscope size={12} />
                                          </div>
                                          <span className="font-mono text-xs text-white font-bold">#SCN-{s.id.toString().padStart(4, '0')}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-[10px] text-text-secondary font-mono font-bold">
                                       {new Date(s.scan_date || s.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center text-white border border-white/10">
                                            <FaUser size={10} />
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-white leading-tight">{s.patient?.full_name}</p>
                                            <p className="text-[10px] text-text-secondary font-mono">{s.patient?.patient_code}</p>
                                          </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-xs">
                                        <span className={
                                          s.prediction === 'AD' ? 'text-red-500' : 
                                          s.prediction === 'MCI' ? 'text-amber-500' : 
                                          'text-emerald-500'
                                        }>
                                            {s.prediction}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                          <div className="w-16 bg-white/5 h-1 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400" style={{ width: `${(s.confidence_ad || s.confidence || 0.8) * 100}%` }} />
                                          </div>
                                          <span className="text-[10px] text-white font-mono font-bold">{(s.confidence_ad || s.confidence || 0.8 * 100).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${
                                          s.is_reviewed 
                                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {s.is_reviewed ? 'VALIDATED' : 'QUEUED'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2.5 bg-black/40 rounded-xl text-text-muted group-hover:text-cyan-400 group-hover:bg-cyan-400/10 border border-white/5 transition-all">
                                            <FaEye size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ScanHistoryPage;
