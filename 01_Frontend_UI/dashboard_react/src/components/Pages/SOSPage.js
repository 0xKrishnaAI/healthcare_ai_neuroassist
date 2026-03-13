import React, { useState, useEffect, memo } from 'react';
import { FaPhoneAlt, FaExclamationTriangle, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';

const SOSPage = () => {
  const [contacts, setContacts] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showMultiSelect, setShowMultiSelect] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('neuro_sos_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse contacts", e);
      }
    }
  }, []);

  // Save to local storage when contacts change
  useEffect(() => {
    localStorage.setItem('neuro_sos_contacts', JSON.stringify(contacts));
  }, [contacts]);

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    
    setContacts(prev => [...prev, { name: newName.trim(), phone: newPhone.trim() }]);
    setNewName('');
    setNewPhone('');
  };

  const handleRemoveContact = (indexToRemove) => {
    setContacts(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerSOS = () => {
    if (contacts.length === 0) {
      alert("Please add an emergency contact first.");
      return;
    }
    
    if (contacts.length === 1) {
      window.location.href = `tel:${contacts[0].phone}`;
    } else {
      setShowMultiSelect(true);
    }
  };

  const dialContact = (phone) => {
    window.location.href = `tel:${phone}`;
    setShowMultiSelect(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn pb-20 relative">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-red-500 tracking-tight uppercase">Emergency Override</h1>
        <p className="text-red-400/80 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
           <FaExclamationTriangle /> Immediate Medical Dispatch <FaExclamationTriangle />
        </p>
      </div>

      {/* BIG RED SOS BUTTON */}
      <div className="flex justify-center py-8">
        <button 
          onClick={triggerSOS}
          className="relative group w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-800 shadow-[0_0_80px_rgba(239,68,68,0.4)] hover:shadow-[0_0_120px_rgba(239,68,68,0.8)] border-8 border-red-900/50 transition-all duration-300 ease-out hover:scale-105 active:scale-95 will-change-transform"
        >
           <div className="absolute inset-0 rounded-full border border-red-400/30 group-hover:animate-ping" />
           <FaPhoneAlt className="text-6xl md:text-8xl text-white mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
           <span className="text-3xl md:text-4xl font-black text-white tracking-[0.2em] relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">S.O.S</span>
           <span className="text-red-200 mt-2 text-xs font-bold uppercase tracking-widest relative z-10">Dispatch Protocol</span>
        </button>
      </div>

      {/* CONTACTS MANAGEMENT */}
      <div className="bg-card/50 p-8 rounded-[2rem] border border-red-500/20 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-500/50" />
        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8 border-b border-white/5 pb-4">Emergency Protocol Directory</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           {/* Form */}
           <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <FaPlus /> Register New Contact
              </h4>
              <form onSubmit={handleAddContact} className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Entity Name</label>
                    <input 
                       type="text" required
                       value={newName} onChange={e => setNewName(e.target.value)}
                       placeholder="e.g. Chief Neurologist"
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-white/20"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Secure Line (Phone)</label>
                    <input 
                       type="tel" required
                       value={newPhone} onChange={e => setNewPhone(e.target.value)}
                       placeholder="e.g. 911 or +1 800 555 1234"
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder:text-white/20"
                    />
                 </div>
                 <button type="submit" className="w-full bg-red-500/20 border border-red-500/50 hover:bg-red-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest text-xs transition-colors duration-300">
                    Add Protocol Link
                 </button>
              </form>
           </div>

           {/* List */}
           <div>
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-4 flex items-center gap-2">
                 Registered Contacts ({contacts.length})
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {contacts.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl text-white/30 text-xs font-bold uppercase tracking-widest">
                       No Active Protocols
                    </div>
                 ) : (
                    contacts.map((c, idx) => (
                       <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-red-500/30 transition-colors">
                          <div>
                             <div className="font-bold text-white text-sm">{c.name}</div>
                             <div className="font-mono text-cyan-400 text-xs mt-1">{c.phone}</div>
                          </div>
                          <button 
                             onClick={() => handleRemoveContact(idx)}
                             className="text-white/20 hover:text-red-500 hover:bg-red-500/10 p-3 rounded-xl transition-all"
                             aria-label="Remove Contact"
                          >
                             <FaTrash />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* MULTI-SELECT POPUP OVERLAY */}
      {showMultiSelect && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#0a0a0a] border-2 border-red-600 shadow-[0_0_50px_rgba(239,68,68,0.3)] rounded-[2rem] p-8 w-full max-w-md relative animate-slideUp">
               <button 
                  onClick={() => setShowMultiSelect(false)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
               >
                  <FaTimes className="text-xl" />
               </button>
               
               <div className="text-center mb-8">
                  <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest">Select Dispatch</h3>
                  <p className="text-red-400 text-xs font-bold uppercase mt-2">Multiple protocols found</p>
               </div>

               <div className="space-y-3">
                  {contacts.map((c, idx) => (
                     <button
                        key={idx}
                        onClick={() => dialContact(c.phone)}
                        className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500 border border-red-500/30 hover:border-red-500 rounded-2xl transition-all duration-300 group"
                     >
                        <div className="text-left">
                           <div className="font-bold text-white group-hover:text-black">{c.name}</div>
                           <div className="font-mono text-red-300 group-hover:text-black/70 text-xs mt-1">{c.phone}</div>
                        </div>
                        <FaPhoneAlt className="text-red-500 group-hover:text-black text-xl" />
                     </button>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default memo(SOSPage);
