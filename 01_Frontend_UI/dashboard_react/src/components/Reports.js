import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faChartBar, faTable, faSortUp, faSortDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getMockReports } from '../utils/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Colors for classes
const COLORS = {
    CN: '#28a745',
    MCI: '#ffc107',
    AD: '#dc3545'
};

// Mock metrics data based on DL results
const metricsData = [
    { class: 'CN', precision: 92, recall: 83, f1: 87, support: 13 },
    { class: 'MCI', precision: 70, recall: 70, f1: 70, support: 10 },
    { class: 'AD', precision: 56, recall: 67, f1: 56, support: 6 }
];

const overallMetrics = [
    { name: 'Balanced Accuracy', value: 72.41 },
    { name: 'Macro F1-Score', value: 71.56 },
    { name: 'AUC-ROC', value: 82.34 },
    { name: 'Confidence Avg', value: 78.5 }
];

const classDistribution = [
    { name: 'CN (Healthy)', value: 42, color: COLORS.CN },
    { name: 'MCI (Early)', value: 60, color: COLORS.MCI },
    { name: 'AD (Alzheimer\'s)', value: 28, color: COLORS.AD }
];

const trainingCurves = [
    { epoch: 1, trainLoss: 1.2, valLoss: 1.3, trainAcc: 45, valAcc: 40 },
    { epoch: 5, trainLoss: 0.8, valLoss: 0.9, trainAcc: 62, valAcc: 58 },
    { epoch: 10, trainLoss: 0.5, valLoss: 0.6, trainAcc: 75, valAcc: 68 },
    { epoch: 15, trainLoss: 0.3, valLoss: 0.45, trainAcc: 85, valAcc: 72 },
    { epoch: 20, trainLoss: 0.2, valLoss: 0.42, trainAcc: 92, valAcc: 74 },
    { epoch: 25, trainLoss: 0.15, valLoss: 0.40, trainAcc: 95, valAcc: 72 }
];

const Reports = () => {
    const reports = getMockReports();
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'charts'
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [classMode, setClassMode] = useState('multi'); // 'binary' or 'multi'

    // Sort and filter reports
    const filteredReports = reports
        .filter(r => r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.pred.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1;
            if (sortField === 'conf') return (a.conf - b.conf) * order;
            return a[sortField]?.localeCompare?.(b[sortField]) * order || 0;
        });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const handleExport = () => {
        const csv = [
            ['Patient ID', 'Date', 'Prediction', 'Confidence', 'Status'].join(','),
            ...filteredReports.map(r => [r.id, r.date, r.pred, r.conf, r.status].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'NeuroAssist_reports.csv';
        a.click();
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Diagnostic Reports</h2>
                    <p className="text-sm text-gray-500">AI-generated analysis from MedicalNet ResNet-10</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {/* View Toggle */}
                    <div className="flex bg-white rounded-xl shadow-sm p-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'table' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FontAwesomeIcon icon={faTable} className="mr-2" />Table
                        </button>
                        <button
                            onClick={() => setViewMode('charts')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'charts' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FontAwesomeIcon icon={faChartBar} className="mr-2" />Charts
                        </button>
                    </div>

                    {/* Classification Mode Toggle */}
                    <div className="flex bg-white rounded-xl shadow-sm p-1">
                        <button
                            onClick={() => setClassMode('binary')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${classMode === 'binary' ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Binary
                        </button>
                        <button
                            onClick={() => setClassMode('multi')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${classMode === 'multi' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Multi-Class
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-primary text-white rounded-xl shadow-md hover:bg-primary-dark text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faDownload} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Classification Mode Indicator */}
            <div className="glass p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-sm text-gray-500">Current Mode:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${classMode === 'binary' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {classMode === 'binary' ? 'Binary (CN vs AD)' : 'Multi-Class (CN vs MCI vs AD)'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-gray-500">Balanced Accuracy:</span>
                        <span className={`ml-2 text-lg font-bold ${classMode === 'binary' ? 'text-green-600' : 'text-purple-600'}`}>
                            {classMode === 'binary' ? '87.00%' : '72.41%'}
                        </span>
                    </div>
                </div>
            </div>

            {viewMode === 'table' ? (
                /* Table View */
                <div className="glass overflow-hidden">
                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative max-w-md">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Patient ID or Prediction..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                {[
                                    { key: 'id', label: 'Patient ID' },
                                    { key: 'date', label: 'Date' },
                                    { key: 'pred', label: 'Prediction' },
                                    { key: 'conf', label: 'Confidence' },
                                    { key: 'status', label: 'Status' },
                                ].map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            {sortField === col.key && (
                                                <FontAwesomeIcon icon={sortOrder === 'asc' ? faSortUp : faSortDown} className="text-primary" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredReports.map((report, idx) => (
                                <motion.tr
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                                    className="transition-colors"
                                >
                                    <td className="p-4 font-semibold text-gray-700">{report.id}</td>
                                    <td className="p-4 text-gray-500">{report.date}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm
                                            ${report.pred === 'CN' ? 'bg-green-100 text-green-700 shadow-green-200' :
                                                report.pred === 'MCI' ? 'bg-yellow-100 text-yellow-700 shadow-yellow-200' : 'bg-red-100 text-red-700 shadow-red-200'}
                                        `}>
                                            {report.pred}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-700 font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full rounded-full ${report.conf >= 91 ? 'bg-green-500' : report.conf >= 55 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${report.conf}%` }}
                                                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                />
                                            </div>
                                            <span className={`font-bold ${report.conf >= 91 ? 'text-green-600' : 'text-gray-600'}`}>
                                                {report.conf}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-sm px-2 py-1 rounded ${report.status === 'Complete' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-primary hover:text-primary-dark font-medium text-sm hover:underline">
                                            View Details
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Charts View */
                <div className="grid lg:grid-cols-2 gap-6">

                    {/* Per-Class Metrics Bar Chart */}
                    <motion.div
                        className="glass p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Per-Class Performance</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="class" tick={{ fill: '#666' }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`${value}%`]}
                                />
                                <Legend />
                                <Bar dataKey="precision" fill="#8b5cf6" name="Precision" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="recall" fill="#06b6d4" name="Recall" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="f1" fill="#10b981" name="F1-Score" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Class Distribution Pie Chart */}
                    <motion.div
                        className="glass p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Dataset Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={classDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={false}
                                >
                                    {classDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [`${value} samples`]}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4">
                            {classDistribution.map(item => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs text-gray-600">{item.name.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Training Curves Line Chart */}
                    <motion.div
                        className="glass p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Training Curves</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trainingCurves} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="epoch" tick={{ fill: '#666' }} label={{ value: 'Epoch', position: 'bottom', fill: '#999' }} />
                                <YAxis tick={{ fill: '#666' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="trainLoss" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Train Loss" />
                                <Line type="monotone" dataKey="valLoss" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="Val Loss" />
                                <Line type="monotone" dataKey="trainAcc" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Train Acc %" />
                                <Line type="monotone" dataKey="valAcc" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} name="Val Acc %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Overall Metrics Radar */}
                    <motion.div
                        className="glass p-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Model Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {overallMetrics.map((metric, idx) => (
                                <motion.div
                                    key={metric.name}
                                    className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                >
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">{metric.name}</p>
                                    <p className="text-2xl font-bold text-primary mt-1">{metric.value}%</p>
                                    <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${metric.value}%` }}
                                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            )}
        </motion.div>
    );
};

export default Reports;
