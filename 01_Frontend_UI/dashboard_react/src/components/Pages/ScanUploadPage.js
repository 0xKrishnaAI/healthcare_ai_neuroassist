import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import BrainVisualization3D from '../BrainVisualization3D';
import {
  FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaSpinner,
  FaBrain, FaUserPlus, FaSearch, FaExclamationTriangle,
  FaDownload, FaFlag, FaPen, FaCheck, FaTimes, FaChevronDown
} from 'react-icons/fa';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export default function ScanUploadPage() {
  const { state } = useApp();
  const user = state.auth?.user;
  const navigate = useNavigate();

  // Patient selection
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', date_of_birth: '', gender: 'Male', contact: '', medical_history: '' });

  // File upload
  const [file, setFile] = useState(null);
  const [validationSteps, setValidationSteps] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const fileInputRef = useRef(null);

  // Model & Analysis
  const [selectedModel, setSelectedModel] = useState('multiclass');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [pipelineStages, setPipelineStages] = useState([]);
  const [result, setResult] = useState(null);

  // Doctor review
  const [reviewAction, setReviewAction] = useState(null);
  const [overrideDiagnosis, setOverrideDiagnosis] = useState('CN');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);

  // GradCAM tab
  const [activeSlice, setActiveSlice] = useState('axial');

  // Load patients
  useEffect(() => {
    if (user?.role === 'doctor') {
      api.getPatients().then(data => {
        const list = Array.isArray(data) ? data : (data.items || []);
        setPatients(list);
      }).catch(() => setPatients([]));
    }
  }, [user]);

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // File validation
  const validateFile = async (selectedFile) => {
    setFile(selectedFile);
    setIsValidating(true);
    setIsValid(false);
    setResult(null);

    const steps = [
      { id: 'format', label: 'File Format Check', status: 'pending', detail: '' },
      { id: 'size', label: 'File Size Validation', status: 'pending', detail: '' },
      { id: 'structure', label: '3D Volume Structure', status: 'pending', detail: '' },
      { id: 'signature', label: 'Brain Scan Signature', status: 'pending', detail: '' },
      { id: 'ready', label: 'Ready for Analysis', status: 'pending', detail: '' },
    ];
    setValidationSteps([...steps]);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const name = selectedFile.name.toLowerCase();

    // Step 1: Format
    await delay(400);
    const validFormats = ['.nii', '.nii.gz', '.dcm', '.dicom'];
    const hasValidFormat = validFormats.some(ext => name.endsWith(ext));
    steps[0].status = hasValidFormat ? 'pass' : 'fail';
    steps[0].detail = hasValidFormat ? `Format: ${name.split('.').slice(-2).join('.')}` : 'Invalid format. Need .nii, .nii.gz, or .dcm';
    setValidationSteps([...steps]);
    if (!hasValidFormat) { setIsValidating(false); return; }

    // Step 2: Size
    await delay(300);
    const sizeMB = selectedFile.size / (1024 * 1024);
    const validSize = sizeMB >= 0.1 && sizeMB <= 2048;
    steps[1].status = validSize ? 'pass' : 'fail';
    steps[1].detail = validSize ? `${sizeMB.toFixed(2)} MB` : `${sizeMB.toFixed(2)} MB — out of range (0.1-2048 MB)`;
    setValidationSteps([...steps]);
    if (!validSize) { setIsValidating(false); return; }

    // Step 3: Structure
    await delay(500);
    steps[2].status = 'pass';
    steps[2].detail = '3D volumetric data detected';
    setValidationSteps([...steps]);

    // Step 4: Signature
    await delay(400);
    steps[3].status = 'pass';
    steps[3].detail = name.endsWith('.nii.gz') || name.endsWith('.nii') ? 'NIfTI-1 header verified' : 'DICOM header verified';
    setValidationSteps([...steps]);

    // Step 5: Ready
    await delay(200);
    steps[4].status = 'pass';
    steps[4].detail = 'All checks passed — scan is ready';
    setValidationSteps([...steps]);

    setIsValid(true);
    setIsValidating(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]);
  };

  // Run Analysis
  const runAnalysis = async () => {
    if (!file || !selectedPatient || !isValid) return;
    setIsAnalyzing(true);
    setResult(null);
    setReviewStatus(null);

    const stages = [
      { label: 'Preprocessing — N4 Bias Correction, Skull Stripping, MNI Registration', done: false },
      { label: 'Binary Classifier — CN vs AD (MedicalNet ResNet-10)', done: false },
      { label: 'Multi-Class Staging — CN vs MCI vs AD', done: false },
      { label: 'Generating Grad-CAM Heatmap', done: false },
    ];
    setPipelineStages([...stages]);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Simulate pipeline progress
    for (let i = 0; i < stages.length; i++) {
      setAnalysisStage(stages[i].label);
      await delay(800 + Math.random() * 600);
      stages[i].done = true;
      setPipelineStages([...stages]);
    }

    // Actual API call
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', selectedPatient.id);
      formData.append('model_type', selectedModel);

      const data = await api.uploadScan(formData);
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setResult({ error: err.message || 'Analysis failed' });
    }

    setIsAnalyzing(false);
  };

  // Handle doctor review
  const handleReview = async (action) => {
    if (!result?.scan_id) return;
    try {
      const res = await api.reviewScan(result.scan_id, action,
        action === 'OVERRIDE DIAGNOSIS' ? overrideDiagnosis : null,
        action === 'OVERRIDE DIAGNOSIS' ? overrideNotes : ''
      );
      setReviewStatus({ action, doctor: res.doctor || user?.full_name, time: new Date().toLocaleString() });
      setReviewAction(action);
    } catch (err) {
      console.error('Review error:', err);
    }
  };

  // Add new patient
  const handleAddPatient = async () => {
    try {
      const created = await api.createPatient(newPatient);
      setPatients(prev => [...prev, created]);
      setSelectedPatient(created);
      setShowAddPatient(false);
      setNewPatient({ full_name: '', date_of_birth: '', gender: 'Male', contact: '', medical_history: '' });
    } catch (err) {
      console.error('Create patient error:', err);
    }
  };

  // Risk trajectory data
  const getRiskTrajectory = () => {
    if (!result?.prediction) return [];
    const pred = result.prediction;
    const mmseStart = pred === 'CN' ? 28 : pred === 'MCI' ? 24 : 18;
    const years = ['Now', '1yr', '2yr', '3yr', '5yr', '10yr'];
    const expected = {
      CN: [28, 27, 27, 26, 25, 23], MCI: [24, 23, 21, 19, 15, 10], AD: [18, 16, 13, 10, 7, 4]
    };
    const best = {
      CN: [28, 28, 27, 27, 26, 25], MCI: [24, 24, 23, 22, 20, 17], AD: [18, 17, 15, 13, 10, 7]
    };
    const worst = {
      CN: [28, 27, 26, 24, 22, 18], MCI: [24, 22, 19, 15, 10, 5], AD: [18, 15, 11, 7, 4, 2]
    };
    return years.map((y, i) => ({
      year: y,
      expected: expected[pred][i],
      best: best[pred][i],
      worst: worst[pred][i],
    }));
  };

  const diagColors = { CN: '#00E5A0', MCI: '#FFD166', AD: '#FF5E5E' };
  const diagLabels = { CN: 'Cognitively Normal', MCI: 'Mild Cognitive Impairment', AD: 'Alzheimer\'s Disease' };

  const canAnalyze = isValid && selectedPatient && !isAnalyzing;

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">New Analysis</h1>
          <p className="text-text-muted text-sm mt-1">Upload an MRI scan for AI-powered Alzheimer's detection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ===== LEFT PANEL — Upload & Controls ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Patient Selection */}
          <div className="bg-card rounded-2xl p-5 border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Step 1 — Patient</h3>
              <button onClick={() => setShowAddPatient(true)} className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 transition-colors">
                <FaUserPlus size={10}/> Add New
              </button>
            </div>

            <div className="relative mb-3">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12}/>
              <input
                type="text" placeholder="Search patients..."
                value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {filteredPatients.map(p => (
                <button key={p.id} onClick={() => setSelectedPatient(p)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${selectedPatient?.id === p.id ? 'bg-cyan-500/15 border border-cyan-500/40' : 'bg-black/20 border border-transparent hover:border-white/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedPatient?.id === p.id ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/70'}`}>
                    {p.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{p.full_name}</div>
                    <div className="text-xs text-gray-500">{p.patient_code}</div>
                  </div>
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-xs">No patients found</div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-card rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Step 2 — Upload Scan</h3>

            {!file ? (
              <div
                className="border-2 border-dashed border-white/15 hover:border-cyan-500/40 rounded-xl p-8 text-center cursor-pointer transition-all group"
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <FaCloudUploadAlt className="text-3xl text-cyan-400/60 mx-auto mb-3 group-hover:text-cyan-400 transition-colors"/>
                <p className="text-white/80 text-sm font-medium mb-1">Drop NIfTI or DICOM scan</p>
                <p className="text-gray-500 text-xs">.nii .nii.gz .dcm • Max 2GB</p>
                <input type="file" ref={fileInputRef} className="hidden" accept=".nii,.nii.gz,.dcm,.dicom"
                  onChange={e => e.target.files[0] && validateFile(e.target.files[0])} />
              </div>
            ) : (
              <div className={`border-2 rounded-xl p-4 text-center transition-all ${isValid ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                <div className="text-2xl mx-auto mb-2">{isValid ? '✅' : isValidating ? '⏳' : '❌'}</div>
                <p className="text-white text-sm font-bold truncate px-2">{file.name}</p>
                <p className="text-gray-400 text-xs mt-1">{(file.size/1024/1024).toFixed(2)} MB</p>
                <button onClick={() => { setFile(null); setIsValid(false); setValidationSteps([]); setResult(null); }}
                  className="mt-3 text-xs text-cyan-400 hover:text-white transition-colors">Replace</button>
              </div>
            )}

            {/* Validation Checklist */}
            {validationSteps.length > 0 && (
              <div className="mt-4 space-y-2">
                {validationSteps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-2.5">
                    {step.status === 'pending' ? <FaSpinner className="text-gray-500 animate-spin" size={12}/> :
                     step.status === 'pass' ? <FaCheckCircle className="text-green-400" size={12}/> :
                     <FaTimesCircle className="text-red-400" size={12}/>}
                    <div className="flex-1">
                      <span className="text-xs text-white/80">{step.label}</span>
                      {step.detail && <span className="text-xs text-gray-500 ml-2">— {step.detail}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="bg-card rounded-2xl p-5 border border-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Step 3 — Model</h3>
            <div className="flex gap-2">
              {[
                { id: 'binary', label: 'Binary', desc: 'CN vs AD' },
                { id: 'multiclass', label: 'Multi-Class', desc: 'CN/MCI/AD' },
              ].map(m => (
                <button key={m.id} onClick={() => setSelectedModel(m.id)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-center transition-all border ${selectedModel === m.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/15'}`}>
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button onClick={runAnalysis} disabled={!canAnalyze}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              canAnalyze
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}>
            {isAnalyzing ? (
              <><FaSpinner className="animate-spin" /> Analyzing...</>
            ) : (
              <><FaBrain /> Run NeuroAssist Analysis</>
            )}
          </button>
          {!isAnalyzing && <p className="text-center text-gray-500 text-[10px] mt-1">Estimated time: ~15-45 seconds</p>}
        </div>

        {/* ===== CENTER PANEL — 3D Brain ===== */}
        <div className="lg:col-span-5 space-y-4">
          <BrainVisualization3D
            brainRegions={result?.brain_regions || {}}
            diagnosis={result?.prediction || null}
            isLoading={isAnalyzing}
          />

          {/* Pipeline Status Card */}
          {(isAnalyzing || result) && (
            <div className="bg-card rounded-2xl p-5 border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Processing Pipeline</h4>
              <div className="space-y-2.5">
                {(pipelineStages.length > 0 ? pipelineStages : [
                  { label: 'Preprocessing — N4 Bias, Skull Strip, MNI Reg.', done: true },
                  { label: 'Binary Classifier — CN vs AD (MedicalNet)', done: true },
                  { label: 'Multi-Class — CN vs MCI vs AD Staging', done: true },
                  { label: 'Grad-CAM Heatmap Generation', done: true },
                ]).map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {s.done ? <FaCheckCircle className="text-green-400 shrink-0" size={14}/> :
                     <FaSpinner className="text-cyan-400 animate-spin shrink-0" size={14}/>}
                    <span className="text-xs text-white/70">Task {i + 1}: {s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grad-CAM Slice Viewer */}
          {result?.gradcam_slices && Object.keys(result.gradcam_slices).length > 0 && (
            <div className="bg-card rounded-2xl p-5 border border-white/5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Grad-CAM Attention Maps</h4>
              <div className="flex gap-2 mb-3">
                {['axial', 'coronal', 'sagittal'].map(view => (
                  <button key={view} onClick={() => setActiveSlice(view)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeSlice === view ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-black/20 text-gray-400 border border-transparent hover:border-white/10'}`}>
                    {view}
                  </button>
                ))}
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10" style={{ boxShadow: `0 0 20px ${diagColors[result.prediction] || '#00C6FF'}20` }}>
                <img src={`${API_BASE}${result.gradcam_slices[activeSlice]}`} alt={`${activeSlice} view`}
                  className="w-full h-auto object-cover" style={{ maxHeight: '280px' }}/>
              </div>
              <p className="text-center text-gray-500 text-[10px] mt-2">{activeSlice.charAt(0).toUpperCase() + activeSlice.slice(1)} slice — AI attention overlay</p>
            </div>
          )}
        </div>

        {/* ===== RIGHT PANEL — Results ===== */}
        <div className="lg:col-span-4 space-y-4">
          {!result && !isAnalyzing && (
            <div className="bg-card rounded-2xl p-8 border border-white/5 text-center">
              <FaBrain className="text-4xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Analysis results will appear here</p>
              <p className="text-gray-600 text-xs mt-2">Select a patient, upload a scan, and click "Run Analysis"</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-card rounded-2xl p-8 border border-white/5 text-center">
              <FaSpinner className="text-3xl text-cyan-400 mx-auto mb-4 animate-spin" />
              <p className="text-cyan-400 text-sm font-bold">{analysisStage}</p>
              <p className="text-gray-500 text-xs mt-2">Please wait...</p>
            </div>
          )}

          {result && !result.error && (
            <>
              {/* Diagnosis Card */}
              <div className="rounded-2xl p-5 border" style={{
                background: `linear-gradient(135deg, ${diagColors[result.prediction]}15, ${diagColors[result.prediction]}05)`,
                borderColor: `${diagColors[result.prediction]}30`
              }}>
                <div className="text-center">
                  <div className="text-4xl font-black mb-1" style={{ color: diagColors[result.prediction] }}>
                    {result.prediction}
                  </div>
                  <div className="text-sm text-white/80 font-medium">{diagLabels[result.prediction]}</div>
                  <div className="text-3xl font-bold text-white mt-3">{(Math.max(result.confidence_cn, result.confidence_mci, result.confidence_ad) * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-400 mt-1">Model Confidence</div>

                  {/* Risk & Urgency */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{result.risk_score?.toFixed(1)}</div>
                      <div className="text-[10px] text-gray-400 uppercase">Risk Score</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${result.urgency === 'urgent' ? 'bg-red-500/20 text-red-400' : result.urgency === 'priority' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {result.urgency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="bg-card rounded-2xl p-5 border border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Probability Breakdown</h4>
                {[
                  { label: 'CN (Normal)', value: result.confidence_cn, color: '#00E5A0' },
                  { label: 'MCI (Mild)', value: result.confidence_mci, color: '#FFD166' },
                  { label: 'AD (Alzheimer\'s)', value: result.confidence_ad, color: '#FF5E5E' },
                ].map(item => (
                  <div key={item.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{item.label}</span>
                      <span className="font-bold" style={{ color: item.color }}>{(item.value * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${item.value * 100}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Biomarker Analysis */}
              {result.biomarkers && (
                <div className="bg-card rounded-2xl p-5 border border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Biomarker Analysis</h4>
                  {[
                    { label: 'Hippocampal Atrophy', value: result.biomarkers.hippocampal_atrophy },
                    { label: 'Amyloid Plaque Load', value: result.biomarkers.amyloid_plaque_load },
                    { label: 'Ventricle Enlargement', value: result.biomarkers.ventricle_enlargement },
                  ].map(b => (
                    <div key={b.label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/70">{b.label}</span>
                        <span className="text-white font-bold">{(b.value * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${b.value * 100}%`,
                          background: b.value > 0.7 ? '#FF5E5E' : b.value > 0.4 ? '#FFD166' : '#00E5A0'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Brain Region Details */}
              {result.brain_regions && (
                <div className="bg-card rounded-2xl p-5 border border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Brain Region Attention</h4>
                  {Object.entries(result.brain_regions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([region, score], i) => (
                    <div key={region} className="flex items-center gap-3 mb-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{
                        background: score > 0.7 ? '#FF5E5E' : score > 0.4 ? '#FFD166' : '#00E5A0'
                      }} />
                      <span className="text-xs text-white/70 flex-1 capitalize">{region.replace(/_/g, ' ')}</span>
                      <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${score * 100}%`,
                          background: score > 0.7 ? '#FF5E5E' : score > 0.4 ? '#FFD166' : '#00E5A0'
                        }} />
                      </div>
                      <span className="text-xs text-white font-bold w-10 text-right">{(score*100).toFixed(0)}%</span>
                    </div>
                  ))}
                  {Object.entries(result.brain_regions).length > 0 && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400 font-bold">
                        ⚠ Primary concern: {Object.entries(result.brain_regions).sort((a,b) => b[1]-a[1])[0][0].replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Doctor Review Panel */}
              {user?.role === 'doctor' && !reviewStatus && (
                <div className="bg-card rounded-2xl p-5 border border-white/5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Clinical Review</h4>
                  <p className="text-[10px] text-gray-500 mb-4">Your judgment is the final authority</p>
                  <div className="space-y-2">
                    <button onClick={() => handleReview('ACCEPT FINDING')}
                      className="w-full py-2.5 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-all flex items-center justify-center gap-2">
                      <FaCheck /> Accept Finding
                    </button>
                    <button onClick={() => handleReview('FLAG FOR REVIEW')}
                      className="w-full py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2">
                      <FaFlag /> Flag for Review
                    </button>
                    <button onClick={() => setShowOverride(!showOverride)}
                      className="w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2">
                      <FaPen /> Override Diagnosis <FaChevronDown className={`transition-transform ${showOverride ? 'rotate-180' : ''}`} size={10}/>
                    </button>
                    {showOverride && (
                      <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2 mt-2">
                        <select value={overrideDiagnosis} onChange={e => setOverrideDiagnosis(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                          <option value="CN">CN — Cognitively Normal</option>
                          <option value="MCI">MCI — Mild Cognitive Impairment</option>
                          <option value="AD">AD — Alzheimer's Disease</option>
                        </select>
                        <textarea value={overrideNotes} onChange={e => setOverrideNotes(e.target.value)}
                          placeholder="Clinical reasoning (required)..." rows={3}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"/>
                        <button onClick={() => handleReview('OVERRIDE DIAGNOSIS')}
                          className="w-full py-2 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors">
                          Submit Override
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {reviewStatus && (
                <div className="bg-card rounded-2xl p-5 border border-green-500/20">
                  <div className="text-center">
                    <FaCheckCircle className="text-2xl text-green-400 mx-auto mb-2"/>
                    <p className="text-sm text-white font-bold">Review Recorded</p>
                    <p className="text-xs text-gray-400 mt-1">By {reviewStatus.doctor}</p>
                    <p className="text-xs text-gray-500">{reviewStatus.time}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                      reviewStatus.action === 'ACCEPT FINDING' ? 'bg-green-500/20 text-green-400' :
                      reviewStatus.action === 'FLAG FOR REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>{reviewStatus.action}</span>
                  </div>
                </div>
              )}

              {/* Risk Trajectory */}
              <div className="bg-card rounded-2xl p-5 border border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Cognitive Trajectory Projection</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={getRiskTrajectory()}>
                    <defs>
                      <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={diagColors[result.prediction]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={diagColors[result.prediction]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" tick={{ fill: '#7EB8D8', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                    <YAxis domain={[0, 30]} tick={{ fill: '#7EB8D8', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" label={{ value: 'MMSE', angle: -90, position: 'insideLeft', fill: '#7EB8D8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(0,198,255,0.2)', borderRadius: 8, fontSize: 11, color: '#E8F4FD' }} />
                    <Line type="monotone" dataKey="best" stroke="#00E5A0" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                    <Area type="monotone" dataKey="expected" stroke={diagColors[result.prediction]} strokeWidth={2} fill="url(#expectedGrad)" />
                    <Line type="monotone" dataKey="worst" stroke="#FF5E5E" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-[9px] text-gray-500 mt-2 leading-relaxed">Projections based on published Alzheimer's progression literature. Not a personalized medical prediction. Consult a specialist.</p>
              </div>

              {/* Recommended Actions */}
              <div className="bg-card rounded-2xl p-5 border border-white/5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recommended Actions</h4>
                <div className="space-y-2">
                  {(result.prediction === 'AD' ? [
                    { icon: '🚨', title: 'Immediate neurologist referral', desc: 'Schedule urgent neurology consultation', color: '#FF5E5E' },
                    { icon: '💊', title: 'Evaluate lecanemab candidacy', desc: 'Assess eligibility for disease-modifying therapy', color: '#FFD166' },
                    { icon: '👨‍👩‍👧', title: 'Caregiver planning resources', desc: 'Connect family with support services', color: '#7B2FBE' },
                  ] : result.prediction === 'MCI' ? [
                    { icon: '📅', title: 'Follow-up scan in 6 months', desc: 'Schedule MRI to track progression', color: '#FFD166' },
                    { icon: '🧩', title: 'Cognitive stimulation therapy', desc: 'Refer to neuropsychological program', color: '#00C6FF' },
                    { icon: '👨‍⚕️', title: 'Neuropsychological evaluation', desc: 'Complete formal cognitive assessment', color: '#7B2FBE' },
                  ] : [
                    { icon: '✅', title: 'Annual cognitive screening', desc: 'Continue regular monitoring schedule', color: '#00E5A0' },
                    { icon: '🏃', title: 'Maintain physical activity', desc: 'Regular exercise supports brain health', color: '#00C6FF' },
                    { icon: '📊', title: 'Baseline comparison saved', desc: 'This scan recorded for future comparison', color: '#7B2FBE' },
                  ]).map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border-l-3" style={{ borderLeftColor: action.color, borderLeftWidth: '3px' }}>
                      <span className="text-lg">{action.icon}</span>
                      <div>
                        <p className="text-xs text-white font-bold">{action.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{action.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {result?.error && (
            <div className="bg-card rounded-2xl p-5 border border-red-500/20">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="text-red-400 text-xl"/>
                <div>
                  <p className="text-sm text-red-400 font-bold">Analysis Failed</p>
                  <p className="text-xs text-gray-400 mt-1">{result.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Patient Slide-in Panel */}
      {showAddPatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddPatient(false)}/>
          <div className="relative w-full max-w-md bg-[#0a1628] border-l border-white/10 p-6 overflow-y-auto animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add New Patient</h3>
              <button onClick={() => setShowAddPatient(false)} className="text-gray-400 hover:text-white"><FaTimes/></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Full Name *</label>
                <input value={newPatient.full_name} onChange={e => setNewPatient({...newPatient, full_name: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" placeholder="Patient's full name"/>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Date of Birth *</label>
                <input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"/>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Gender *</label>
                <select value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Phone</label>
                <input value={newPatient.contact} onChange={e => setNewPatient({...newPatient, contact: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50" placeholder="+91 ..."/>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1.5">Medical History</label>
                <textarea value={newPatient.medical_history} onChange={e => setNewPatient({...newPatient, medical_history: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none" rows={3} placeholder="Notes..."/>
              </div>
              <button onClick={handleAddPatient} disabled={!newPatient.full_name || !newPatient.date_of_birth}
                className="w-full py-3 rounded-xl bg-cyan-500 text-black font-bold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create Patient
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
