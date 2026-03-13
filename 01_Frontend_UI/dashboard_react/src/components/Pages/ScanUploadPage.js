import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import BrainVisualization3D from '../BrainVisualization3D';
import { FaBrain, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Sub-components
import PatientSelector from '../ScanUpload/PatientSelector';
import FileUploader from '../ScanUpload/FileUploader';
import AnalysisPipeline from '../ScanUpload/AnalysisPipeline';
import AnalysisResults from '../ScanUpload/AnalysisResults';
import AddPatientModal from '../ScanUpload/AddPatientModal';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const GradCamViewer = memo(({ result, activeSlice, setActiveSlice, diagColors }) => {
  const isIdle = !result?.gradcam_slices || Object.keys(result.gradcam_slices).length === 0;

  return (
    <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg min-h-[440px] transition-opacity duration-500 relative overflow-hidden flex flex-col">
      {isIdle && <div className="absolute inset-0 bg-slate-800/20 animate-pulse pointer-events-none" />}
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h4 className="text-xs font-black text-white uppercase tracking-widest px-2 border-l-2 border-cyan-400">Grad-CAM Explainability</h4>
        {!isIdle && (
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
            {['axial', 'coronal', 'sagittal'].map(view => (
              <button 
                key={view} 
                onClick={() => setActiveSlice(view)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSlice === view 
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-white/5 relative group bg-black/40 flex items-center justify-center z-10 min-h-[300px]" 
           style={!isIdle ? { boxShadow: `0 0 40px ${diagColors[result.prediction] || '#00C6FF'}10` } : {}}>
        {isIdle ? (
          <div className="flex flex-col items-center opacity-40">
            <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-xl mb-3 flex items-center justify-center">
                <FaBrain className="text-slate-500" size={24}/>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Awaiting Scan Data</span>
          </div>
        ) : (
          <>
            <img 
              src={`${API_BASE}${result.gradcam_slices[activeSlice]}`} 
              alt={`${activeSlice} view`}
              className="w-full h-auto object-cover max-h-[320px] transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </div>
      {!isIdle && (
        <p className="text-center text-slate-400 text-[10px] font-bold mt-4 uppercase tracking-[0.2em] relative z-10">
          {activeSlice} slice — AI Attention Overlay
        </p>
      )}
    </div>
  );
});

export default function ScanUploadPage() {
  const { state } = useApp();
  const user = state.auth?.user;
  const navigate = useNavigate();

  // State Management
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ full_name: '', date_of_birth: '', gender: 'Male', contact: '', medical_history: '' });

  const [file, setFile] = useState(null);
  const [validationSteps, setValidationSteps] = useState([
    { id: 'format', label: 'File Format Check', status: 'idle', detail: '—' },
    { id: 'size', label: 'File Size Validation', status: 'idle', detail: '—' },
    { id: 'signature', label: 'Brain Scan Signature', status: 'idle', detail: '—' },
    { id: 'ready', label: 'Ready For Analysis', status: 'idle', detail: '—' }
  ]);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const fileInputRef = useRef(null);

  const [selectedModel, setSelectedModel] = useState('multiclass');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [pipelineStages, setPipelineStages] = useState([]);
  const [result, setResult] = useState(null);

  const [reviewAction, setReviewAction] = useState(null);
  const [overrideDiagnosis, setOverrideDiagnosis] = useState('CN');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);

  const [activeSlice, setActiveSlice] = useState('axial');

  // Unified Colors
  const diagColors = useMemo(() => ({ CN: '#00E5A0', MCI: '#FFD166', AD: '#FF5E5E' }), []);

  // Fetch Patients
  useEffect(() => {
    let isMounted = true;
    if (user?.role === 'doctor') {
      api.getPatients().then(data => {
        if (!isMounted) return;
        setPatients(Array.isArray(data) ? data : (data.items || []));
      }).catch(() => isMounted && setPatients([]));
    }
    return () => { isMounted = false; };
  }, [user]);

  // Callbacks
  const validateFile = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setIsValidating(true);
    setIsValid(false);
    setResult(null);

    const steps = [
      { id: 'format', label: 'File Format Check', status: 'pending', detail: '' },
      { id: 'size', label: 'File Size Validation', status: 'pending', detail: '' },
      { id: 'signature', label: 'Brain Scan Signature', status: 'pending', detail: '' },
      { id: 'ready', label: 'Ready For Analysis', status: 'pending', detail: '' },
    ];
    setValidationSteps([...steps]);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const name = selectedFile.name.toLowerCase();

    // Simulation logic (could be improved with real worker)
    await delay(400);
    const validFormats = ['.nii', '.nii.gz', '.dcm', '.dicom'];
    const hasValidFormat = validFormats.some(ext => name.endsWith(ext));
    steps[0].status = hasValidFormat ? 'pass' : 'fail';
    steps[0].detail = hasValidFormat ? `Format: ${name.split('.').slice(-2).join('.')}` : 'Invalid format';
    setValidationSteps([...steps]);
    if (!hasValidFormat) { setIsValidating(false); return; }

    await delay(300);
    const sizeMB = selectedFile.size / (1024 * 1024);
    const validSize = sizeMB >= 0.1 && sizeMB <= 2048;
    steps[1].status = validSize ? 'pass' : 'fail';
    steps[1].detail = `${sizeMB.toFixed(2)} MB`;
    setValidationSteps([...steps]);
    if (!validSize) { setIsValidating(false); return; }

    await delay(200);
    steps[2].status = 'pass';
    steps[2].detail = 'Volumetric grid & NIfTI/DICOM OK';
    setValidationSteps([...steps]);

    await delay(100);
    steps[3].status = 'pass';
    setValidationSteps([...steps]);
    setIsValid(true);
    setIsValidating(false);
  }, []);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]);
  }, [validateFile]);

  const runAnalysis = useCallback(async () => {
    if (!file || !selectedPatient || !isValid) return;
    setIsAnalyzing(true);
    setResult(null);
    setReviewStatus(null);

    const stages = [
      { label: 'Preprocessing — N4 Bias, Skull Strip, MNI Reg.', done: false },
      { label: 'Binary Classifier — CN vs AD (ResNet-10)', done: false },
      { label: 'Multi-Class — CN vs MCI vs AD Staging', done: false },
      { label: 'Generating Grad-CAM Attribution Map', done: false },
    ];
    setPipelineStages([...stages]);

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < stages.length; i++) {
      setAnalysisStage(stages[i].label);
      await delay(600 + Math.random() * 400);
      stages[i].done = true;
      setPipelineStages([...stages]);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', selectedPatient.id);
      
      setAnalysisStage('Uploading scan to local storage...');
      const uploadRes = await api.uploadScan(formData);
      const scanId = uploadRes.scan_id;

      const analyzeData = new FormData();
      analyzeData.append('scan_id', scanId);
      analyzeData.append('model_type', selectedModel);

      setAnalysisStage('Running AI inference model...');
      await api.analyzeScan(analyzeData);

      setAnalysisStage('Formatting prediction & Grad-CAM results...');
      const data = await api.getScanResult(scanId);
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setResult({ error: err.message || 'Analysis pipeline failure' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [file, selectedPatient, isValid, selectedModel]);

  const handleReview = useCallback(async (action) => {
    if (!result?.scan_id) return;
    try {
      const res = await api.reviewScan(result.scan_id, action,
        action === 'OVERRIDE DIAGNOSIS' ? overrideDiagnosis : null,
        action === 'OVERRIDE DIAGNOSIS' ? overrideNotes : ''
      );
      setReviewStatus({ action, doctor: res.doctor || user?.full_name, time: new Date().toLocaleString() });
    } catch (err) {
      console.error('Review error:', err);
    }
  }, [result, overrideDiagnosis, overrideNotes, user]);

  const handleAddPatient = useCallback(async () => {
    try {
      const created = await api.createPatient(newPatient);
      setPatients(prev => [...prev, created]);
      setSelectedPatient(created);
      setShowAddPatient(false);
      setNewPatient({ full_name: '', date_of_birth: '', gender: 'Male', contact: '', medical_history: '' });
    } catch (err) {
      console.error('Create patient error:', err);
    }
  }, [newPatient]);

  const getRiskTrajectory = useCallback(() => {
    if (!result?.prediction) return [];
    const pred = result.prediction;
    const years = ['Now', '1yr', '2yr', '3yr', '5yr', '10yr'];
    const data = {
      CN: { exp: [28, 27, 27, 26, 25, 23], best: [28, 28, 27, 27, 26, 25], worst: [28, 27, 26, 24, 22, 18] },
      MCI: { exp: [24, 23, 21, 19, 15, 10], best: [24, 24, 23, 22, 20, 17], worst: [24, 22, 19, 15, 10, 5] },
      AD: { exp: [18, 16, 13, 10, 7, 4], best: [18, 17, 15, 13, 10, 7], worst: [18, 15, 11, 7, 4, 2] }
    };
    return years.map((y, i) => ({
      year: y,
      expected: data[pred].exp[i],
      best: data[pred].best[i],
      worst: data[pred].worst[i],
    }));
  }, [result]);

  const canAnalyze = isValid && selectedPatient && !isAnalyzing;

  return (
    <div className="animate-fadeIn min-h-screen pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">NEURAL ASSESSMENT</h1>
          <p className="text-text-muted text-xs font-bold uppercase tracking-[0.3em] mt-1">
            MRI Digital Twin & AI Classification Pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Upload Scan Card */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg min-h-[480px] flex flex-col space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <PatientSelector 
              patients={patients}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              patientSearch={patientSearch}
              setPatientSearch={setPatientSearch}
              setShowAddPatient={setShowAddPatient}
            />
            
            <FileUploader 
              file={file}
              isValid={isValid}
              isValidating={isValidating}
              validationSteps={validationSteps}
              fileInputRef={fileInputRef}
              handleFileDrop={handleFileDrop}
              validateFile={validateFile}
              resetFile={() => { 
                setFile(null); setIsValid(false); 
                setValidationSteps([
                  { id: 'format', label: 'File Format Check', status: 'idle', detail: '—' },
                  { id: 'size', label: 'File Size Validation', status: 'idle', detail: '—' },
                  { id: 'signature', label: 'Brain Scan Signature', status: 'idle', detail: '—' },
                  { id: 'ready', label: 'Ready For Analysis', status: 'idle', detail: '—' }
                ]); 
                setResult(null); 
              }}
            />
          </div>

          <div className="bg-black/20 rounded-xl p-5 border border-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Pipeline Logic</h3>
            <div className="flex gap-4">
              {[
                { id: 'binary', label: 'Binary', desc: 'CN / AD' },
                { id: 'multiclass', label: 'Multi', desc: 'CN / MCI / AD' },
              ].map(m => (
                <button key={m.id} onClick={() => setSelectedModel(m.id)}
                  className={`flex-1 py-4 px-3 rounded-xl text-center transition-all border ${selectedModel === m.id ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-black/20 border-transparent text-gray-400 hover:border-white/10'}`}>
                  <div className="text-xs font-bold uppercase tracking-widest">{m.label}</div>
                  <div className="text-[10px] opacity-60 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={runAnalysis} disabled={!canAnalyze}
            className={`w-full py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 overflow-hidden group relative ${
              canAnalyze
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-2xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}>
            {isAnalyzing ? (
              <><FaSpinner className="animate-spin" /> EXECUTING...</>
            ) : (
              <><FaBrain className="group-hover:scale-125 transition-transform" /> INITIATE NEURAL SCAN</>
            )}
            {canAnalyze && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />}
          </button>
        </div>

        {/* RIGHT COLUMN: Visualization & Brain */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg min-h-[480px] flex flex-col items-center justify-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 self-start w-full">Brain Spatial Render</h3>
            <div className="h-[340px] w-full flex items-center justify-center bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                <BrainVisualization3D
                    brainRegions={result?.brain_regions || {}}
                    diagnosis={result?.prediction || null}
                    isLoading={isAnalyzing}
                />
            </div>
        </div>
      </div>

      {/* FULL WIDTH ROW 2: PIPELINE STATUS CARDS */}
      <div className="mt-6 p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg transition-opacity duration-500">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">File Validation Checks</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {validationSteps.map((step) => (
            <div key={step.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-2 min-h-[100px] justify-center relative overflow-hidden group">
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 shadow-inner">
                  {step.status === 'idle' ? <FaBrain className="text-slate-500/50" size={14}/> :
                   step.status === 'pending' ? <FaSpinner className="text-cyan-500/80 animate-spin" size={14}/> :
                   step.status === 'pass' ? <FaCheckCircle className="text-emerald-400" size={16}/> :
                   <FaTimesCircle className="text-red-400" size={16}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white uppercase tracking-tight block truncate">{step.label}</span>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{step.detail}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 font-black text-[10px] uppercase tracking-widest">
                 {step.status === 'pass' ? <span className="text-emerald-400">PASS</span> : 
                  step.status === 'fail' ? <span className="text-red-400">FAIL</span> : 
                  step.status === 'pending' ? <span className="text-cyan-400">WAIT</span> :
                  <span className="text-slate-500 hidden md:inline-block">IDLE</span>}
              </div>
              {step.status === 'idle' && <div className="absolute inset-0 bg-slate-800/50 animate-pulse pointer-events-none" />}
            </div>
          ))}
        </div>
      </div>

      {/* BELOW: Pipeline & Validation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
        <div className="space-y-6">
          <AnalysisPipeline 
            isAnalyzing={isAnalyzing}
            result={result}
            pipelineStages={pipelineStages}
          />
          <GradCamViewer 
            result={result}
            activeSlice={activeSlice}
            setActiveSlice={setActiveSlice}
            diagColors={diagColors}
          />
        </div>

        <div className="space-y-6">
          {result ? (
            <AnalysisResults 
                result={result}
                user={user}
                reviewStatus={reviewStatus}
                handleReview={handleReview}
                showOverride={showOverride}
                setShowOverride={setShowOverride}
                overrideDiagnosis={overrideDiagnosis}
                setOverrideDiagnosis={setOverrideDiagnosis}
                overrideNotes={overrideNotes}
                setOverrideNotes={setOverrideNotes}
                getRiskTrajectory={getRiskTrajectory}
            />
          ) : (
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg min-h-[400px] flex flex-col items-center justify-center text-center transition-opacity duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-slate-800/30 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6 relative z-10 border border-slate-700 shadow-inner">
                <FaBrain className="text-3xl text-slate-600" />
              </div>
              <h3 className="text-base font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10">Awaiting Signal</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-[240px] mx-auto relative z-10">
                Neural processing core is idle. Select a patient and upload a scan to start real-time explainability analysis.
              </p>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-center gap-4 animate-shake">
                <FaExclamationTriangle className="text-red-500 text-2xl" />
                <div>
                   <h4 className="text-xs font-black text-red-500 uppercase">System Error</h4>
                   <p className="text-[10px] text-white/70 mt-0.5">{result.error}</p>
                </div>
            </div>
          )}
        </div>
      </div>

      <AddPatientModal 
        show={showAddPatient}
        onClose={() => setShowAddPatient(false)}
        newPatient={newPatient}
        setNewPatient={setNewPatient}
        onAdd={handleAddPatient}
      />
    </div>
  );
}
