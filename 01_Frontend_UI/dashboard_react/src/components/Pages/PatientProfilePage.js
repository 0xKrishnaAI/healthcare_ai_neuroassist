import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { 
  FaUser, FaEdit, FaHistory, FaBrain, 
  FaFilePdf, FaChevronLeft, FaChevronRight, FaSpinner,
  FaCalendarAlt, FaStethoscope
} from 'react-icons/fa';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, AreaChart, Area 
} from 'recharts';

const PatientProfilePage = () => {
    const { patientId } = useParams();
    const { state } = useApp();
    const { user } = state.auth;
    const navigate = useNavigate();
    
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const data = await api.getPatient(patientId);
                setPatient(data);
            } catch (err) {
                console.error("Failed to fetch patient:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPatientData();
    }, [patientId]);

    const getInitials = (name) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <FaSpinner className="animate-spin text-cyan-400 text-3xl mb-4" />
                <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Decrypting Patient Record...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400 font-bold">Patient record not found.</p>
                <button onClick={() => navigate('/dashboard/patients')} className="mt-4 text-cyan-400 hover:underline">Return to Directory</button>
            </div>
        );
    }

    // Prepare timeline data from scans
    const timelineData = (patient.scans || []).map(s => ({
        date: new Date(s.scan_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        score: s.prediction === 'AD' ? 2 : s.prediction === 'MCI' ? 1 : 0,
        result: s.prediction,
        confidence: (s.confidence_ad || s.confidence || 0.8) * 100
    })).reverse();

    return (
        <div className="animate-fadeIn space-y-6 max-w-7xl mx-auto">
            
            {/* Nav & Action */}
            <div className="flex items-center justify-between">
                <button 
                  onClick={() => navigate('/dashboard/patients')}
                  className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <FaChevronLeft /> Back to Directory
                </button>
                <div className="flex gap-3">
                   <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all flex items-center gap-2">
                      <FaEdit /> Modify Profile
                   </button>
                   <button className="px-4 py-2 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all flex items-center gap-2">
                      <FaBrain /> New Analysis
                   </button>
                </div>
            </div>

            {/* Top Info Card */}
            <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col md:flex-row gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
                
                <div className="shrink-0 flex flex-col items-center justify-center">
                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-4xl shadow-xl shadow-cyan-500/20 ring-4 ring-white/5">
                        {getInitials(patient.full_name)}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase">{patient.full_name}</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 mt-6">
                            <div>
                              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mb-1">Clinical ID</p>
                              <p className="text-sm font-bold text-cyan-400 font-mono">{patient.patient_code}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mb-1">Gender</p>
                              <p className="text-sm font-bold text-white">{patient.gender || 'Not Specified'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mb-1">Age / DOB</p>
                              <p className="text-sm font-bold text-white">{patient.age}Y • {patient.date_of_birth}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mb-1">Total Logs</p>
                              <p className="text-sm font-bold text-white">{patient.scans?.length || 0} Assessments</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                          <FaStethoscope size={12} className="text-purple-400" />
                          <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Medical Context</p>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed italic">
                          {patient.doctor_notes || "No clinical observations recorded for this subject currently."}
                        </p>
                        <button className="mt-auto text-[10px] text-cyan-400 font-bold hover:underline flex items-center gap-1 uppercase tracking-widest">
                          Update Notes <FaChevronRight size={8} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Longitudinal Timeline */}
            <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] border-l-2 border-cyan-400 pl-4">Cognitive Trajectory</h3>
                        <p className="text-[10px] text-text-secondary font-bold mt-1 ml-4 uppercase tracking-widest">Temporal Analysis of AI predictions</p>
                    </div>
                </div>
                
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData}>
                            <defs>
                              <linearGradient id="colorTrajectory" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00C6FF" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00C6FF" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                              dataKey="date" stroke="#3a5c80" fontSize={10} 
                              tickLine={false} axisLine={false} dy={10}
                            />
                            <YAxis 
                              domain={[0, 2]} stroke="#3a5c80" fontSize={10} 
                              tickLine={false} axisLine={false} dx={-10}
                              tickFormatter={val => val === 0 ? 'CN' : val === 1 ? 'MCI' : 'AD'} 
                            />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                               itemStyle={{ fontSize: '10px', color: '#00C6FF', fontWeight: 'bold' }}
                            />
                            <Area 
                              type="monotone" dataKey="score" stroke="#00C6FF" strokeWidth={3} 
                              fillOpacity={1} fill="url(#colorTrajectory)"
                              dot={{ stroke: '#0d1f3c', strokeWidth: 3, r: 5, fill: '#00C6FF' }} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Scan History Table */}
            <div className="bg-card rounded-3xl border border-white/5 border-b-0 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-black/10">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Assessment Chronicle</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#050d1a] border-b border-white/5">
                            <tr className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Result</th>
                                <th className="px-8 py-5">Confidence</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(patient.scans || []).map((s, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-all group cursor-pointer" onClick={() => navigate(`/dashboard/scan/${s.id}`)}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                          <FaCalendarAlt className="text-text-secondary" size={10} />
                                          <span className="text-xs font-bold text-white">{new Date(s.scan_date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-black text-xs">
                                        <span className={s.prediction === 'AD' ? 'text-red-500' : s.prediction === 'MCI' ? 'text-amber-500' : 'text-emerald-500'}>
                                          {s.prediction}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 font-mono text-xs text-text-secondary group-hover:text-white transition-colors">
                                        {((s.confidence_ad || s.confidence || 0.8) * 100).toFixed(1)}%
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${
                                          s.is_reviewed 
                                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        }`}>
                                            {s.is_reviewed ? 'VALIDATED' : 'QUEUED'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="text-xs font-black text-cyan-400 group-hover:underline">VIEW DETAIL</button>
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

export default PatientProfilePage;
