import React, { useState, useRef, useEffect } from 'react';
import { FaHospitalUser, FaMapMarkerAlt, FaPhoneAlt, FaTimes, FaDirections } from 'react-icons/fa';
import { useApp } from '../context/AppContext';

const hospitalsEN = [
    { name: 'NeuroCare Center', distance: '1.2 km', phone: '+1 555-0102', dir: '#' },
    { name: 'City Brain Clinic', distance: '3.5 km', phone: '+1 555-2345', dir: '#' },
    { name: 'Apex General Hospital', distance: '5.1 km', phone: '+1 555-8899', dir: '#' },
];

const hospitalsHI = [
    { name: 'न्यूरोकेयर सेंटर', distance: '1.2 किमी', phone: '+91 98765-43210', dir: '#' },
    { name: 'सिटी ब्रेन क्लिनिक', distance: '3.5 किमी', phone: '+91 91234-56789', dir: '#' },
    { name: 'एपेक्स जनरल अस्पताल', distance: '5.1 किमी', phone: '+91 99887-77665', dir: '#' },
];

const FloatingHospital = () => {
    const { state } = useApp();
    const isHindi = state.language === 'hi';
    const hospitals = isHindi ? hospitalsHI : hospitalsEN;

    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;
        
        // Boundaries
        const maxW = window.innerWidth - 320;
        const maxH = window.innerHeight - 400;
        
        if (newX > 0) newX = 0;
        if (newX < -maxW) newX = -maxW;
        if (newY > 0) newY = 0;
        if (newY < -maxH) newY = -maxH;

        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging]);

    return (
        <div className="fixed bottom-24 right-6 z-40">
            {/* FLOATING BUTTON */}
            <button 
                onClick={() => setIsOpen(true)}
                className={`w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : ''}`}
            >
                <FaHospitalUser className="text-white text-2xl group-hover:animate-pulse" />
            </button>

            {/* POPUP OVERLAY */}
            <div 
                ref={dragRef}
                style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
                className={`absolute bottom-0 right-0 w-80 bg-[#050d1a] border border-emerald-500/30 shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded-2xl flex flex-col transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none hidden'}`}
            >
                {/* HEADER (Draggable) */}
                <div 
                    onMouseDown={handleMouseDown}
                    className="bg-gradient-to-r from-emerald-900 to-teal-900 px-4 py-3 border-b border-emerald-500/30 flex items-center justify-between rounded-t-2xl cursor-grab active:cursor-grabbing"
                >
                    <div className="flex items-center gap-3 pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-emerald-400">
                            <FaHospitalUser className="text-emerald-400 text-sm" />
                        </div>
                        <div>
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">
                                {isHindi ? 'निकटतम अस्पताल' : 'Nearby Hospitals'}
                            </h3>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] text-emerald-200">
                                    {isHindi ? 'स्थान सक्रिय (जीपीएस)' : 'Location Active (GPS)'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onMouseDown={(e) => e.stopPropagation()} 
                        onClick={() => setIsOpen(false)} 
                        className="text-white/60 hover:text-white transition-colors p-2"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-4 space-y-3 bg-card/50 max-h-[300px] overflow-y-auto custom-scrollbar rounded-b-2xl">
                    {hospitals.map((hosp, i) => (
                        <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{hosp.name}</h4>
                                <div className="flex items-center gap-1 text-[10px] font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    <FaMapMarkerAlt size={8}/> {hosp.distance}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                <a href={`tel:${hosp.phone}`} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors">
                                    <FaPhoneAlt size={10} className="text-emerald-500" /> {hosp.phone}
                                </a>
                                <div className="w-px h-3 bg-white/10" />
                                <a href={hosp.dir} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors">
                                    <FaDirections size={12} /> {isHindi ? 'दिशा' : 'Dir'}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FloatingHospital;
