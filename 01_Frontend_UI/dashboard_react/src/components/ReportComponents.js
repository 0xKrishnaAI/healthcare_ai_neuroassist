import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPrint, faFileMedicalAlt, faHospital, faUserMd, faBrain, faNotesMedical, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell
} from 'recharts';

/**
 * Printable Report Layout (Hidden from view, used by react-to-print)
 */
export const PrintLayout = forwardRef(({ result, date }, ref) => {
    if (!result) return null;

    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans h-full w-full" style={{ padding: '40px' }}>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-gray-800 pb-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="text-3xl text-blue-600">
                        <FontAwesomeIcon icon={faHospital} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold uppercase tracking-wider">NeuroAssist Medical Center</h1>
                        <p className="text-sm text-gray-500">Department of Neurology & Radiology</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">AUTOMATED DIAGNOSTIC REPORT</h2>
                    <p className="text-sm text-gray-600">Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">Date: {date}</p>
                </div>
            </div>

            {/* Patient Info */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserMd} /> Patient Demographics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold">Patient Name:</span> John Doe (Anonymous)</div>
                    <div><span className="font-semibold">Patient ID:</span> P-2024-001</div>
                    <div><span className="font-semibold">Scan Type:</span> MRI (T1-Weighted)</div>
                    <div><span className="font-semibold">Age/Gender:</span> 72 / Male</div>
                </div>
            </div>

            {/* Diagnosis Section */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-300 pb-1 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBrain} className="text-blue-600" /> AI Diagnostic Summary
                </h3>
                <div className={`p-6 rounded-xl border-l-4 ${result.color === 'danger' ? 'bg-red-50 border-red-500' : result.color === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-emerald-50 border-emerald-500'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Primary Classification</p>
                            <h2 className={`text-3xl font-black ${result.color === 'danger' ? 'text-red-700' : result.color === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {result.full}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Model Confidence</p>
                            <p className="text-3xl font-black text-gray-800">{(result.confidence * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-700 leading-relaxed text-sm">
                        Analysis of the input MRI scan utilizing 3D Convolutional Neural Networks (ResNet-10 Architecture) indicates patterns consistent with
                        <span className="font-bold"> {result.full}</span>.
                        Key biomarkers suggest {result.atrophy > 50 ? 'significant' : 'mild'} hippocampal atrophy and ventricular enlargement.
                    </p>
                </div>
            </div>

            {/* Biomarker Data */}
            <div className="mb-8 p-4 border border-gray-200 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faNotesMedical} className="text-blue-600" /> Quantitative Biomarkers
                </h3>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-4 py-2">Region of Interest</th>
                            <th className="px-4 py-2">Measured Value (Normalized)</th>
                            <th className="px-4 py-2">Reference Range (CN)</th>
                            <th className="px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr>
                            <td className="px-4 py-3 font-medium">Hippocampal Volume</td>
                            <td className="px-4 py-3 text-red-600 font-bold">{result.atrophy.toFixed(1)}% (Atrophy)</td>
                            <td className="px-4 py-3 text-gray-500">&lt; 25%</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">ABNORMAL</span></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-medium">Amyloid Beta Load</td>
                            <td className="px-4 py-3 text-red-600 font-bold">{result.amyloid.toFixed(1)}%</td>
                            <td className="px-4 py-3 text-gray-500">&lt; 20%</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">HIGH</span></td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-medium">Whole Brain Volume</td>
                            <td className="px-4 py-3 text-gray-800 font-bold">{(100 - (result.atrophy * 0.3)).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-gray-500">&gt; 80%</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">NORMAL</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 left-10 right-10 text-center border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-400 uppercase font-bold">Generated by NeuroAssist AI • Not for primary diagnosis</p>
                <p className="text-[10px] text-gray-400 mt-1">This report is an assistive tool generated by AI. All findings must be verified by a board-certified radiologist.</p>
            </div>
        </div>
    );
});


/**
 * Modal Overlay for Viewing Report
 */
export const ReportModal = ({ isOpen, onClose, result, onPrint }) => {
    if (!isOpen || !result) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFileMedicalAlt} className="text-primary" />
                                Comprehensive Analysis Report
                            </h2>
                            <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onPrint}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                            >
                                <FontAwesomeIcon icon={faPrint} /> Print / Save PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        <div className="grid grid-cols-3 gap-8">
                            {/* Left Col: Patient & Summary */}
                            <div className="col-span-1 space-y-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-500 uppercase mb-3">Diagnostic Result</h4>
                                    <div className="text-center py-2">
                                        <div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-2 ${result.color === 'danger' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {result.label} Detected
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-800">{result.full}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">Patient Details</h4>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                        <div className="flex justify-between mb-1"><span className="text-gray-500">ID:</span> <span className="font-mono text-gray-700">P-X829-22</span></div>
                                        <div className="flex justify-between mb-1"><span className="text-gray-500">Age:</span> <span className="font-mono text-gray-700">72</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Scan:</span> <span className="font-mono text-gray-700">MRI-T1w</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Charts & Detailed Markers */}
                            <div className="col-span-2 space-y-8">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
                                        Biomarker Analysis Visuals
                                    </h4>
                                    <div className="h-64 w-full bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Hippocampus', val: result.atrophy, cn: 25 },
                                                { name: 'Amyloid', val: result.amyloid, cn: 20 },
                                                { name: 'Ventricles', val: result.atrophy * 0.8, cn: 30 },
                                                { name: 'Cortex', val: result.atrophy * 0.5, cn: 15 }
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Bar dataKey="val" name="Patient Value" radius={[4, 4, 0, 0]}>
                                                    {
                                                        [0, 1, 2, 3].map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={result.color === 'danger' ? '#ef4444' : '#10b981'} />
                                                        ))
                                                    }
                                                </Bar>
                                                <Bar dataKey="cn" name="Normal Reference" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 text-center italic">Figure 1: Comparison of patient biomarker levels (Colored) vs Healthy Control average (Grey).</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Clinical Interpretation</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        The patient exhibits elevated atrophy markers in the medial temporal lobe, specifically the hippocampus ({(result.atrophy).toFixed(1)}th percentile severity).
                                        This pattern is strongly correlated with early-stage Alzheimer's pathology. Recommendation for PET scan to confirm amyloid deposition and cognitive baseline testing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                        <button className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium" onClick={onClose}>Close</button>
                        <button className="px-6 py-2 text-sm bg-primary text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30" onClick={onPrint}>
                            Download Full Report
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
