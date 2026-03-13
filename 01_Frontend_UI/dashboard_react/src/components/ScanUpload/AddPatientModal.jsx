import React, { memo } from 'react';
import { FaTimes } from 'react-icons/fa';

const AddPatientModal = memo(({ 
  show, 
  onClose, 
  newPatient, 
  setNewPatient, 
  onAdd 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#0a1628] border-l border-white/10 p-8 overflow-y-auto shadow-2xl animate-slideInRight flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">New Patient Registry</h3>
            <p className="text-[10px] text-text-muted mt-1 font-bold uppercase tracking-widest">Digital Health Record Initialization</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FaTimes/>
          </button>
        </div>

        <div className="space-y-6 flex-1 pr-1">
          <div className="group">
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-black pl-1 group-focus-within:text-cyan-400 transition-colors">Patient Full Name</label>
            <input 
              value={newPatient.full_name} 
              onChange={e => setNewPatient({...newPatient, full_name: e.target.value})}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all shadow-inner" 
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-black pl-1">Date of Birth</label>
              <input 
                type="date" 
                value={newPatient.date_of_birth} 
                onChange={e => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50 appearance-none shadow-inner"
              />
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-black pl-1">Biological Sex</label>
              <select 
                value={newPatient.gender} 
                onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50 appearance-none shadow-inner"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-black pl-1">Primary Contact</label>
            <input 
              value={newPatient.contact} 
              onChange={e => setNewPatient({...newPatient, contact: e.target.value})}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50 shadow-inner" 
              placeholder="+91 ...."
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-black pl-1">Neural History / Notes</label>
            <textarea 
              value={newPatient.medical_history} 
              onChange={e => setNewPatient({...newPatient, medical_history: e.target.value})}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-xs font-medium text-white placeholder-text-muted focus:outline-none focus:border-cyan-500/50 resize-none shadow-inner" 
              rows={4} 
              placeholder="Known conditions, previous scans..."
            />
          </div>
        </div>

        <div className="pt-8">
            <button 
                onClick={onAdd} 
                disabled={!newPatient.full_name || !newPatient.date_of_birth}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
                Initialize Record
            </button>
        </div>
      </div>
    </div>
  );
});

export default AddPatientModal;
