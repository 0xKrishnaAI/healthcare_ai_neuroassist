import React, { memo } from 'react';
import { FaUserPlus, FaSearch } from 'react-icons/fa';

const PatientSelector = memo(({ 
  patients, 
  selectedPatient, 
  setSelectedPatient, 
  patientSearch, 
  setPatientSearch, 
  setShowAddPatient 
}) => {
  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.patient_code?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-[200px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Patient Selection</h3>
        <button 
          onClick={() => setShowAddPatient(true)} 
          className="text-xs text-cyan-400 hover:text-white flex items-center gap-1 transition-colors bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20"
        >
          <FaUserPlus size={10}/> Add New
        </button>
      </div>

      <div className="relative mb-4">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12}/>
        <input
          type="text" 
          placeholder="Search patients..."
          value={patientSearch} 
          onChange={e => setPatientSearch(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none transition-colors"
        />
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {filteredPatients.map(p => (
          <button 
            key={p.id} 
            onClick={() => setSelectedPatient(p)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
              selectedPatient?.id === p.id 
                ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                : 'bg-black/20 border-transparent hover:border-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              selectedPatient?.id === p.id ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-white/10 text-white/70'
            }`}>
              {p.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">{p.full_name}</div>
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.patient_code}</div>
            </div>
          </button>
        ))}
        {filteredPatients.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-xs italic bg-black/20 rounded-xl border border-dashed border-white/10">No patients found</div>
        )}
      </div>
    </div>
  );
});

export default PatientSelector;
