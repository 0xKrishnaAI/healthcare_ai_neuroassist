import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, cardVariants } from '../utils/animations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedical, faChevronDown, faChevronUp, faRedo, faSearch, faCalendarAlt, faMicroscope } from '@fortawesome/free-solid-svg-icons';
import { useApp } from '../context/AppContext';

const Records = () => {
    const { state } = useApp();
    const [expandedId, setExpandedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock records if empty state
    const records = state.records?.length > 0 ? state.records : [
        { id: 'PAT-001', date: '2023-10-15', type: 'MRI Scan', result: { label: 'AD', confidence: 0.95, color: 'danger' } },
        { id: 'PAT-002', date: '2023-10-18', type: 'MRI Scan', result: { label: 'CN', confidence: 0.98, color: 'success' } },
        { id: 'PAT-003', date: '2023-10-20', type: 'MRI Scan', result: { label: 'MCI', confidence: 0.72, color: 'warning' } },
    ];

    const filteredRecords = records.filter(r =>
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.result.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Patient Records</h2>
                    <p className="text-sm text-gray-500">History of uploaded scans and analysis results</p>
                </div>
                <div className="relative w-full md:w-64">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                    />
                </div>
            </div>

            {/* Records Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-4">
                {filteredRecords.map((record, index) => (
                    <motion.div
                        key={record.id}
                        variants={cardVariants}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`glass p-4 cursor-pointer border-l-4 ${record.result.color === 'danger' ? 'border-l-red-500' : record.result.color === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'} hover:shadow-md transition-all`}
                        onClick={() => toggleExpand(record.id)}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                    <FontAwesomeIcon icon={faFileMedical} className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{record.id}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        <span>{record.date}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{record.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.result.label === 'AD' ? 'bg-red-100 text-red-600' :
                                    record.result.label === 'MCI' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {record.result.label}
                                </span>
                                <FontAwesomeIcon
                                    icon={expandedId === record.id ? faChevronUp : faChevronDown}
                                    className="text-gray-400"
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedId === record.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-4 mt-4 border-t border-gray-100 grid md:grid-cols-3 gap-6">
                                        {/* Result Details */}
                                        <div className="col-span-2 space-y-3">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">Analysis Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Confidence Score</p>
                                                    <p className="font-mono font-bold text-gray-800 text-lg">{(record.result.confidence * 100).toFixed(1)}%</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Model Used</p>
                                                    <p className="font-medium text-gray-800">MedicalNet ResNet-10 (3D)</p>
                                                </div>
                                                <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Clinical Notes</p>
                                                    <p className="text-gray-600 mt-1">
                                                        Analysis indicates patterns consistent with {record.result.label === 'CN' ? 'normal aging' : record.result.label === 'MCI' ? 'early cognitive decline' : 'Alzheimer\'s pathology'}.
                                                        Correlate with clinical history.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col justify-center gap-3 border-l border-gray-100 pl-6">
                                            <button className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                                                <FontAwesomeIcon icon={faMicroscope} /> View Full Report
                                            </button>
                                            <button className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                                <FontAwesomeIcon icon={faRedo} /> Re-Analyze
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {filteredRecords.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    No records found matching your search.
                </div>
            )}
        </motion.div>
    );
};

export default Records;
