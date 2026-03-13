import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { 
  FaUserPlus, FaSearch, FaUser, 
  FaCalendarAlt, FaChevronRight, FaSpinner 
} from 'react-icons/fa';

const PatientsPage = () => {
    const { state } = useApp();
    const { user } = state.auth;
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadPatients = async () => {
            try {
                const data = await api.getPatients();
                setPatients(data || []);
            } catch (e) {
                console.error("Failed to load patients:", e);
                // Fallback demo data
                setPatients([
                  { id: 1, patient_code: 'NA-2024-001', full_name: 'Meera Iyer', date_of_birth: '1952-07-22', age: 71, last_diagnosis: 'CN', scan_count: 2 },
                  { id: 2, patient_code: 'NA-2024-002', full_name: 'Suresh Patel', date_of_birth: '1948-11-03', age: 75, last_diagnosis: 'AD', scan_count: 3 },
                  { id: 3, patient_code: 'NA-2024-003', full_name: 'Lakshmi Devi', date_of_birth: '1960-04-18', age: 63, last_diagnosis: 'MCI', scan_count: 1 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        loadPatients();
    }, []);

    const filteredPatients = patients.filter(p => 
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.patient_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-3xl border border-white/5 shadow-xl">
                <div>
                   <h1 className="text-2xl font-black text-white">Patient Registry</h1>
                   <p className="text-text-secondary text-sm">Centralized clinical demographic and longitudinal management</p>
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input 
                            type="text" placeholder="Search by name or clinical ID..."
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs text-white placeholder-text-muted focus:border-cyan-500/30 outline-none transition-all font-medium"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                      onClick={() => navigate('/dashboard/scan')}
                      className="bg-cyan-500 text-black font-black py-3 px-6 rounded-2xl shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap text-xs uppercase"
                    >
                        <FaUserPlus /> Onboard Patient
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    [1,2,3,4].map(i => <div key={i} className="bg-card rounded-3xl h-64 border border-white/5 animate-shimmer"></div>)
                ) : filteredPatients.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-text-secondary flex flex-col items-center">
                        <FaUser className="text-5xl mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Zero Subjects Found in Directory</p>
                    </div>
                ) : (
                    filteredPatients.map(p => (
                        <div 
                            key={p.id} 
                            className="bg-card rounded-3xl p-6 border border-white/5 hover:border-cyan-500/30 shadow-xl transition-all cursor-pointer group relative flex flex-col h-full"
                            onClick={() => navigate(`/dashboard/patients/${p.id}`)}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                                    {(p.full_name || 'U').split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border tracking-widest ${
                                  p.last_diagnosis === 'AD' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                  p.last_diagnosis === 'MCI' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                }`}>
                                    {p.last_diagnosis || 'NEW'}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-black text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{p.full_name}</h3>
                            <p className="text-[10px] text-cyan-400/60 font-mono font-bold">{p.patient_code}</p>
                            
                            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                                <div>
                                    <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest mb-1">Assessments</p>
                                    <p className="text-sm text-white font-black">{p.scan_count || 0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest mb-1">Age</p>
                                    <p className="text-sm text-white font-black">{p.age || '---'}</p>
                                </div>
                            </div>

                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                               <FaChevronRight className="text-cyan-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PatientsPage;
