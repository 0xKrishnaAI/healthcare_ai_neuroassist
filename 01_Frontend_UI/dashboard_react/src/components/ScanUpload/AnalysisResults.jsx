import React, { memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { FaBrain, FaCheckCircle, FaCheck, FaFlag, FaPen, FaChevronDown } from 'react-icons/fa';

const DIAG_COLORS = { CN: '#00E5A0', MCI: '#FFD166', AD: '#FF5E5E' };
const DIAG_LABELS = { CN: 'Cognitively Normal', MCI: 'Mild Cognitive Impairment', AD: 'Alzheimer\'s Disease' };

const AnalysisResults = memo(({ 
  result, 
  user, 
  reviewStatus, 
  handleReview, 
  showOverride, 
  setShowOverride, 
  overrideDiagnosis, 
  setOverrideDiagnosis, 
  overrideNotes, 
  setOverrideNotes,
  getRiskTrajectory
}) => {
  if (!result || result.error) return null;

  const trajectoryData = getRiskTrajectory();

  return (
    <div className="space-y-6 animate-fadeIn pr-1">
      {/* 1. Main Diagnosis Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 border transition-all duration-500 shadow-2xl" 
        style={{
          background: `linear-gradient(135deg, ${DIAG_COLORS[result.prediction]}20, ${DIAG_COLORS[result.prediction]}05)`,
          borderColor: `${DIAG_COLORS[result.prediction]}40`,
          boxShadow: `0 20px 40px ${DIAG_COLORS[result.prediction]}10`
        }}>
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <FaBrain size={120} style={{ color: DIAG_COLORS[result.prediction] }} />
        </div>
        <div className="relative z-10 text-center">
          <div className="text-sm font-black text-text-muted uppercase tracking-[0.2em] mb-2">Automated Finding</div>
          <div className="text-5xl font-black mb-2 tracking-tighter" style={{ color: DIAG_COLORS[result.prediction] }}>
            {result.prediction}
          </div>
          <div className="text-sm text-white/70 font-bold uppercase tracking-widest">{DIAG_LABELS[result.prediction]}</div>
          
          <div className="mt-6 flex items-center justify-center gap-8">
            <div className="text-center group">
               <div className="text-4xl font-black text-white group-hover:text-cyan-400 transition-colors">
                 {(Math.max(result.confidence_cn, result.confidence_mci, result.confidence_ad) * 100).toFixed(1)}%
               </div>
               <div className="text-[10px] text-text-muted font-bold uppercase mt-1">Confidence</div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-center group">
               <div className="text-4xl font-black text-white group-hover:text-cyan-400 transition-colors">
                 {result.risk_score?.toFixed(1)}
               </div>
               <div className="text-[10px] text-text-muted font-bold uppercase mt-1">Severity Index</div>
            </div>
          </div>

          <div className={`inline-block mt-6 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
            result.urgency === 'urgent' ? 'bg-red-500 text-white shadow-red-500/20' : 
            result.urgency === 'priority' ? 'bg-amber-500 text-black shadow-amber-500/10' : 
            'bg-emerald-500 text-black shadow-emerald-500/10'
          }`}>
            {result.urgency} Action Required
          </div>
        </div>
      </div>

      {/* 2. Probability Breakdown */}
      <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-cyan-400 pl-3">Neural Probability Matrix</h4>
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: 'CN (Stable)', value: result.confidence_cn, color: DIAG_COLORS.CN },
            { label: 'MCI (Transition)', value: result.confidence_mci, color: DIAG_COLORS.MCI },
            { label: 'AD (Atrophy)', value: result.confidence_ad, color: DIAG_COLORS.AD },
          ].map(item => (
            <div key={item.label} className="group">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-white/60 font-bold uppercase tracking-tight">{item.label}</span>
                <span className="font-black font-mono transition-colors group-hover:text-white" style={{ color: item.color }}>{(item.value * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-px">
                <div className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                  style={{ width: `${item.value * 100}%`, background: `linear-gradient(90deg, ${item.color}cc, ${item.color})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Brain Region Details */}
      {result.brain_regions && (
        <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-purple-400 pl-3">ROI Structural Integrity</h4>
          <div className="space-y-3">
            {Object.entries(result.brain_regions)
              .sort((a, b) => b[1] - a[1])
              .map(([region, score]) => (
              <div key={region} className="flex items-center gap-4 group">
                <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{
                  background: score > 0.7 ? DIAG_COLORS.AD : score > 0.4 ? DIAG_COLORS.MCI : DIAG_COLORS.CN
                }} />
                <span className="text-[11px] font-bold text-white/70 flex-1 capitalize group-hover:text-white transition-colors">{region.replace(/_/g, ' ')}</span>
                <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${score * 100}%`,
                    background: score > 0.7 ? DIAG_COLORS.AD : score > 0.4 ? DIAG_COLORS.MCI : DIAG_COLORS.CN
                  }} />
                </div>
                <span className="text-[10px] font-black text-white w-10 text-right font-mono">{(score*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Clinical Trajectory */}
      <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-xl overflow-hidden">
        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 px-1 border-l-2 border-amber-400 pl-3">Cognitive Decay Trajectory</h4>
        <div className="h-[220px] -mx-4">
            <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trajectoryData}>
                <defs>
                <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DIAG_COLORS[result.prediction]} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={DIAG_COLORS[result.prediction]} stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="transparent" />
                <YAxis domain={[0, 30]} tick={{ fill: '#7EB8D8', fontSize: 10, fontWeight: 'bold' }} stroke="transparent" />
                <Tooltip 
                    contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(0,198,255,0.2)', borderRadius: 16, fontSize: 11, fontWeight: 'bold', color: '#E8F4FD', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} 
                    itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="expected" stroke={DIAG_COLORS[result.prediction]} strokeWidth={3} fill="url(#expectedGrad)" animationDuration={1500} />
                <Line type="monotone" dataKey="best" stroke="#00E5A0" strokeDasharray="6 6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="worst" stroke="#FF5E5E" strokeDasharray="6 6" strokeWidth={1.5} dot={false} />
            </AreaChart>
            </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between text-[9px] font-black tracking-widest text-text-muted uppercase">
            <span className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-emerald-400" /> Best Case</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-red-400" /> Progression</span>
        </div>
      </div>

      {/* 5. Clinical Review Panel */}
      {user?.role === 'doctor' && !reviewStatus && (
        <div className="bg-card rounded-3xl p-6 border border-white/5 shadow-2xl animate-scaleIn">
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1 px-1 border-l-2 border-emerald-400 pl-3">Clinical Disposition</h4>
          <p className="text-[10px] text-text-muted mb-6 font-bold uppercase tracking-tight pl-4">Human verification required for system closure</p>
          <div className="space-y-3">
            <button onClick={() => handleReview('ACCEPT FINDING')}
              className="w-full py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group">
              <FaCheck className="group-hover:scale-125 transition-transform" /> ACCEPT ANALYSIS
            </button>
            <button onClick={() => handleReview('FLAG FOR REVIEW')}
              className="w-full py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 group">
              <FaFlag className="group-hover:rotate-12 transition-transform" /> FLAG CASE
            </button>
            <button onClick={() => setShowOverride(!showOverride)}
              className="w-full py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2 group">
              <FaPen className="group-hover:-rotate-12 transition-transform" /> OVERRIDE RESULT <FaChevronDown className={`transition-transform duration-300 ${showOverride ? 'rotate-180' : ''}`} size={10}/>
            </button>
            
            {showOverride && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 mt-3 animate-slideDown">
                <select value={overrideDiagnosis} onChange={e => setOverrideDiagnosis(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-cyan-500/50 appearance-none">
                  <option value="CN">CN — Cognitively Normal</option>
                  <option value="MCI">MCI — Mild Cognitive Impairment</option>
                  <option value="AD">AD — Alzheimer's Disease</option>
                </select>
                <textarea value={overrideNotes} onChange={e => setOverrideNotes(e.target.value)}
                  placeholder="Clinical justification (required)..." rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs font-medium text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/50 resize-none shadow-inner"/>
                <button onClick={() => handleReview('OVERRIDE DIAGNOSIS')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95">
                  Confirm Override
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {reviewStatus && (
        <div className="bg-card rounded-3xl p-8 border border-emerald-500/20 shadow-2xl text-center animate-fadeIn">
            <FaCheckCircle className="text-4xl text-emerald-400 mx-auto mb-4 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]"/>
            <h4 className="text-sm font-black text-white uppercase tracking-widest underline decoration-emerald-500/50 underline-offset-4">Case Validated</h4>
            <p className="text-[10px] text-text-muted mt-3 font-bold">BY: {reviewStatus.doctor}</p>
            <p className="text-[10px] text-text-muted mb-4 font-mono">{reviewStatus.time}</p>
            <span className={`inline-block px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
              reviewStatus.action === 'ACCEPT FINDING' ? 'bg-emerald-500 text-black' :
              reviewStatus.action === 'FLAG FOR REVIEW' ? 'bg-amber-500 text-black' :
              'bg-purple-500 text-white'
            }`}>{reviewStatus.action}</span>
        </div>
      )}
    </div>
  );
});

export default AnalysisResults;
