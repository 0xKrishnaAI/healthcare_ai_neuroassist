import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { FaArrowLeft, FaBrain, FaFilePdf, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ScanDetailPage = () => {
    const { scanId } = useParams();
    const { state } = useApp();
    const { user } = state.auth;
    const navigate = useNavigate();

    const [scanData, setScanData] = useState(null);
    const [heatmapOpacity, setHeatmapOpacity] = useState(60);

    useEffect(() => {
        // Mock fetch
        setScanData({
            id: scanId || 'SCN-123456',
            date: '2024-03-12T10:30:00Z',
            patient: { id: 1, name: 'Rajesh Kumar', code: 'NA-2024-001' },
            model: 'Multi-Class (ResNet-18 3D)',
            prediction: 'MCI',
            conf_cn: 0.15,
            conf_mci: 0.73,
            conf_ad: 0.12,
            risk_score: 59.2,
            urgency: 'priority',
            status: 'pending',
            notes: '',
            processing_time: '12.4s'
        });
    }, [scanId]);

    if (!scanData) return <div className="p-8 text-center text-white">Loading scan details...</div>;

    const getPredictionColor = (pred) => {
        if (pred === 'CN') return 'text-success border-success/30 bg-success/10';
        if (pred === 'MCI') return 'text-warning border-warning/30 bg-warning/10';
        return 'text-danger border-danger/30 bg-danger/10';
    };

    return (
        <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
            
            {/* Nav & Header */}
            <div className="flex items-center gap-4 text-text-muted mb-2">
                <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
                    <FaArrowLeft /> Back
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Scan Analysis: {scanData.id}
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                            scanData.status === 'pending' ? 'bg-white/10 text-white border-white/20' : 
                            scanData.status === 'accepted' ? 'bg-success/20 text-success border-success/30' : 
                            'bg-warning/20 text-warning border-warning/30'
                        }`}>{scanData.status}</span>
                    </h1>
                    <p className="text-sm text-text-muted mt-1">Processed on {new Date(scanData.date).toLocaleString()} • Patient: <span className="text-white font-medium cursor-pointer hover:underline" onClick={() => navigate(`/dashboard/patients/${scanData.patient.id}`)}>{scanData.patient.name} ({scanData.patient.code})</span></p>
                </div>
                
                <div className="flex gap-3">
                    <button className="bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2">
                        <FaFilePdf /> Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Col: Results & Breakdown */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Primary Diagnosis */}
                    <div className={`rounded-2xl p-6 border shadow-xl relative overflow-hidden ${getPredictionColor(scanData.prediction)}`}>
                        <div className="absolute top-0 right-0 p-4">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                                scanData.urgency === 'urgent' ? 'bg-danger text-white' : 
                                scanData.urgency === 'priority' ? 'bg-warning text-[#0A0F1E]' : 
                                'bg-success text-[#0A0F1E]'
                            }`}>{scanData.urgency}</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">
                            {scanData.prediction === 'CN' ? '✓ Normal (CN)' :
                             scanData.prediction === 'MCI' ? '⚠ Warning: MCI' :
                             '⚡ Alert: Alzheimer\'s'}
                        </h2>
                        <div className="text-4xl font-bold text-white mt-4 flex items-end gap-1">
                            {(scanData.prediction === 'CN' ? scanData.conf_cn :
                              scanData.prediction === 'MCI' ? scanData.conf_mci :
                              scanData.conf_ad * 100).toFixed(1)}% 
                            <span className="text-sm text-white/70 font-normal pb-1 block">Confidence</span>
                        </div>
                        <div className="text-sm mt-4 pt-4 border-t border-white/10 flex justify-between">
                            <span className="opacity-80">Risk Score:</span>
                            <span className="font-bold">{scanData.risk_score.toFixed(1)} / 100</span>
                        </div>
                    </div>

                    {/* Probabilities */}
                    <div className="bg-[#0F2248] rounded-2xl p-6 border border-white/5 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Probability Breakdown</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'CN (Normal)', pct: scanData.conf_cn * 100, color: 'bg-success' },
                                { label: 'MCI (Mild)', pct: scanData.conf_mci * 100, color: 'bg-warning' },
                                { label: 'AD (Alzheimer\'s)', pct: scanData.conf_ad * 100, color: 'bg-danger' },
                            ].map(item => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white">{item.label}</span>
                                        <span className="font-bold text-white">{item.pct.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 space-y-2 text-xs text-text-muted">
                            <div className="flex justify-between"><span className="uppercase tracking-wider">Model Used:</span><span className="text-white">{scanData.model}</span></div>
                            <div className="flex justify-between"><span className="uppercase tracking-wider">Proc. Time:</span><span className="text-white">{scanData.processing_time}</span></div>
                        </div>
                    </div>
                </div>

                {/* Middle + Right Col: Viewer & Action */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Heatmap Viewer */}
                    <div className="bg-[#0F2248] rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white">Grad-CAM Spatial Explainability</h3>
                            <div className="flex items-center gap-3 w-48">
                                <label className="text-xs text-text-muted whitespace-nowrap">Heatmap Opacity</label>
                                <input 
                                    type="range" min="0" max="100" value={heatmapOpacity} onChange={e => setHeatmapOpacity(e.target.value)}
                                    className="w-full accent-primary bg-black/20 h-2 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        
                        <div className="w-full aspect-[16/9] md:aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden relative flex flex-col items-center justify-center">
                            <FaBrain className="text-white/10 text-9xl absolute" />
                            {/* Mock Overlay */}
                            <div className="absolute inset-0 bg-gradient-radial from-red-500/50 to-transparent mix-blend-screen transition-opacity" style={{ opacity: heatmapOpacity / 100, background: 'radial-gradient(circle at 40% 60%, rgba(255,94,94,0.6) 0%, rgba(0,0,0,0) 60%)' }}></div>
                            
                            {/* Slice Controls Overlay */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0A0F1E]/80 backdrop-blur border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 z-10">
                                <button className="text-white hover:text-primary">&lt;</button>
                                <span className="text-xs text-text-muted font-bold tracking-widest uppercase">Coronal Slice 42/128</span>
                                <button className="text-white hover:text-primary">&gt;</button>
                            </div>

                            <div className="absolute top-4 right-4 bg-[#0A0F1E]/80 backdrop-blur border border-white/10 rounded-lg p-2 text-[10px] text-white">
                                <p>R</p>
                            </div>
                            <div className="absolute top-4 left-4 bg-[#0A0F1E]/80 backdrop-blur border border-white/10 rounded-lg p-2 text-[10px] text-white">
                                <p>L</p>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Action Area */}
                    {user?.role === 'doctor' && (
                        <div className="bg-[#0F2248] rounded-2xl p-6 border border-white/5 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4">Clinical Disposition</h3>
                            
                            <div className="space-y-4">
                                <textarea 
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors mb-2 min-h-[100px] text-sm"
                                    placeholder="Add clinical observation notes regarding this analysis..."
                                ></textarea>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button className="w-full bg-success/20 hover:bg-success/30 text-success border border-success/30 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(0,229,160,0.1)]">
                                        <FaCheckCircle /> Accept Diagnosis
                                    </button>
                                    <button className="w-full bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(255,209,102,0.1)]">
                                        <FaExclamationTriangle /> Flag Review
                                    </button>
                                    <button className="w-full bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple border border-accent-purple/30 py-3 rounded-xl font-medium transition-colors text-sm shadow-[0_0_15px_rgba(123,47,190,0.1)]">
                                        Override Result
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ScanDetailPage;
