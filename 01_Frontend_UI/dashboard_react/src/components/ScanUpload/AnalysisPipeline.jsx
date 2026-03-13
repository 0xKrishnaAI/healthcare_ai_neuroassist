import React, { memo } from 'react';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

const DEFAULT_STAGES = [
  { label: 'Preprocessing — N4 Bias, Skull Strip, MNI Reg.', done: false, idle: true },
  { label: 'Binary Classifier — CN vs AD (ResNet-10)', done: false, idle: true },
  { label: 'Multi-Class — CN vs MCI vs AD Staging', done: false, idle: true },
  { label: 'Grad-CAM Heatmap Generation', done: false, idle: true },
];

const AnalysisPipeline = memo(({ isAnalyzing, result, pipelineStages }) => {
  const stages = pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES;
  const isIdle = !isAnalyzing && !result;

  return (
    <div className={`p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-lg min-h-[300px] transition-opacity duration-500 relative overflow-hidden`}>
      {isIdle && <div className="absolute inset-0 bg-slate-800/20 animate-pulse pointer-events-none" />}
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h4 className="text-xs font-black text-white uppercase tracking-widest px-2 border-l-2 border-cyan-400">Processing Pipeline</h4>
        {isAnalyzing && (
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-black text-cyan-400 tracking-widest animate-pulse">LIVE</span>
            </div>
        )}
      </div>
      
      <div className="space-y-5 relative z-10">
        {stages.map((s, i) => (
          <div key={i} className={`flex items-start gap-4 transition-all duration-500 ${isIdle ? 'opacity-40' : 'opacity-100'}`}>
            <div className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full ${
              isIdle ? 'bg-slate-700 text-slate-500' :
              s.done ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 
              'bg-cyan-500/20 text-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.2)]'
            }`}>
              {isIdle ? <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> :
               s.done ? <FaCheckCircle size={14}/> : 
               <FaSpinner className="animate-spin" size={12}/>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold leading-tight truncate ${
                      isIdle ? 'text-slate-400' :
                      s.done ? 'text-white' : 'text-cyan-300'
                    }`}>
                        {s.label}
                    </span>
                    {s.done && !isIdle && <span className="text-[9px] font-black text-emerald-400 tracking-wider">100%</span>}
                </div>
                {!s.done && !isIdle && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse" style={{ width: '65%' }} />
                    </div>
                )}
                {isIdle && (
                    <div className="w-full bg-slate-800/50 h-1.5 rounded-full overflow-hidden"></div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AnalysisPipeline;
