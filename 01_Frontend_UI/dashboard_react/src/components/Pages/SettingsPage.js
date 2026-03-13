import React, { useState, memo } from 'react';
import { useApp } from '../../context/AppContext';
import { FaUser, FaLock, FaBell, FaPalette, FaSave, FaCheck, FaShieldAlt } from 'react-icons/fa';

const TABS = [
    { id: 'profile', label: 'My Identity', icon: FaUser },
    { id: 'security', label: 'Access Control', icon: FaLock },
    { id: 'notifications', label: 'Telemetry', icon: FaBell },
    { id: 'appearance', label: 'Interface', icon: FaPalette },
];

const TabNavigation = memo(({ activeTab, setActiveTab }) => (
    <div className="w-full md:w-64 space-y-3 shrink-0">
        {TABS.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group ${
                    activeTab === tab.id 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,198,255,0.15)] shadow-inner' 
                    : 'bg-black/20 text-text-muted hover:bg-white/5 hover:text-white border border-white/5 shadow-xl'
                }`}
            >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-text-muted group-hover:bg-white/10 group-hover:text-white'}`}>
                    <tab.icon size={12} />
                </div>
                {tab.label}
            </button>
        ))}
    </div>
));

const ProfileTab = memo(({ user }) => (
    <div className="animate-fadeIn space-y-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
            <FaUser className="text-cyan-400 text-xl" />
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Operator Profile</h2>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-1">Manage physical and digital identity</p>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner mb-8">
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-cyan-500/20 ring-4 ring-cyan-500/10 relative group cursor-pointer overflow-hidden transform hover:scale-105 transition-all">
                <span className="relative z-10">{user?.full_name?.split(' ').map(n=>n[0]).join('') || 'OP'}</span>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <span className="text-[10px] uppercase tracking-widest text-white">Upload</span>
                </div>
            </div>
            <div className="text-center sm:text-left">
                <button className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-black py-2.5 px-6 rounded-xl border border-cyan-500/30 transition-all text-xs uppercase tracking-widest mb-3 shadow-[0_0_15px_rgba(0,198,255,0.1)]">
                    Initialize Hologram
                </button>
                <p className="text-[10px] text-text-muted font-mono uppercase">System accepts .PNG, .JPG stream. Max capacity 8192KB.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
                <label className="text-[10px] text-text-secondary font-black mb-2 uppercase tracking-[0.2em] block group-focus-within:text-cyan-400 transition-colors">Designation / Full Name</label>
                <input type="text" defaultValue={user?.full_name} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder-text-muted focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all shadow-inner" />
            </div>
            <div className="group">
                <label className="text-[10px] text-text-secondary font-black mb-2 uppercase tracking-[0.2em] block group-focus-within:text-cyan-400 transition-colors">Comms / Email</label>
                <input type="email" defaultValue={user?.email} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-white placeholder-text-muted focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:outline-none transition-all shadow-inner" />
            </div>
            {user?.role === 'doctor' && (
                <>
                    <div className="group hidden md:block" />
                    <div className="group hidden md:block" />
                    <div className="group bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/20 col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none" />
                       <div>
                           <label className="text-[10px] text-cyan-400 font-black mb-2 uppercase tracking-[0.2em] block">License Authorization</label>
                           <input type="text" defaultValue="MED-8849-21-TX" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono font-bold text-cyan-100 placeholder-text-muted focus:border-cyan-500/50 focus:outline-none transition-all shadow-inner" />
                       </div>
                       <div>
                           <label className="text-[10px] text-cyan-400 font-black mb-2 uppercase tracking-[0.2em] block">Facility Assignment</label>
                           <input type="text" defaultValue="General Hospital" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-cyan-100 placeholder-text-muted focus:border-cyan-500/50 focus:outline-none transition-all shadow-inner" />
                       </div>
                    </div>
                </>
            )}
        </div>

        <div className="pt-8 flex justify-end">
            <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black py-4 px-8 rounded-2xl shadow-[0_0_20px_rgba(0,198,255,0.3)] hover:shadow-[0_0_30px_rgba(0,198,255,0.5)] transition-all flex items-center gap-3 active:scale-95 uppercase text-xs tracking-[0.2em]">
                <FaSave size={14} /> Commit Changes
            </button>
        </div>
    </div>
));

const SecurityTab = memo(() => (
    <div className="animate-fadeIn space-y-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
            <FaShieldAlt className="text-purple-400 text-xl" />
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Access Control</h2>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-1">Cryptographic & Authentication Policies</p>
            </div>
        </div>
        
        <div className="bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner mb-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" /> Cipher Key Rotation
            </h3>
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] text-text-secondary font-black mb-2 uppercase tracking-[0.2em] block">Current Cipher</label>
                    <input type="password" placeholder="••••••••" className="w-full md:w-1/2 bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:outline-none shadow-inner transition-all font-mono" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-[10px] text-text-secondary font-black mb-2 uppercase tracking-[0.2em] block">New Cipher</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:outline-none shadow-inner transition-all font-mono" />
                    </div>
                    <div>
                        <label className="text-[10px] text-text-secondary font-black mb-2 uppercase tracking-[0.2em] block">Verify Cipher</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 focus:outline-none shadow-inner transition-all font-mono" />
                    </div>
                </div>
                <button className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-black py-3 px-6 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em] shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    Engage Key Rotation
                </button>
            </div>
        </div>

        <div className="bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <FaLock className="text-text-muted" /> Bio-Metric / MFA Access
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5 gap-6">
                <div>
                    <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Time-based OTP Device</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-relaxed">Require a secondary cryptographic token from a synchronized device before system mount.</p>
                </div>
                <button className="w-full md:w-auto bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black py-4 px-8 rounded-xl transition-all uppercase text-[10px] tracking-[0.2em] shadow-[0_0_15px_rgba(52,211,153,0.1)] hover:bg-emerald-500/20 whitespace-nowrap">
                    Initialize MFA Protocol
                </button>
            </div>
        </div>
    </div>
));

const NotificationsTab = memo(() => (
    <div className="animate-fadeIn space-y-8 max-w-3xl">
         <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
            <FaBell className="text-amber-400 text-xl" />
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Telemetry Settings</h2>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-1">Manage system alerts and communication channels</p>
            </div>
        </div>
        
        <div className="bg-black/20 p-2 sm:p-4 rounded-3xl border border-white/5 shadow-inner space-y-2">
            {[
                { title: 'Analysis Completion Grid', desc: 'Receive ping when neural processing finishes.', default: true },
                { title: 'Critical Anomaly Detection', desc: 'Override DND for high-risk findings (e.g., AD onset).', default: true },
                { title: 'Patient Comms Relay', desc: 'Route messages from patient terminals directly to your HUD.', default: false },
                { title: 'Core Firmware Updates', desc: 'Receive patch notes for NeuroAssist algorithms.', default: true },
            ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="pr-6 cursor-pointer">
                        <p className="text-xs font-black text-white uppercase tracking-widest mb-1 group-hover:text-cyan-400 transition-colors">{item.title}</p>
                        <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{item.desc}</p>
                    </div>
                    <div className="shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                            <div className="w-12 h-6 bg-black border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white/50 peer-checked:after:bg-black after:border-transparent after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-cyan-500 shadow-[0_0_15px_rgba(0,198,255,0)] peer-checked:shadow-[0_0_15px_rgba(0,198,255,0.4)]"></div>
                        </label>
                    </div>
                </div>
            ))}
        </div>
    </div>
));

const AppearanceTab = memo(({ language, setLanguage }) => (
    <div className="animate-fadeIn space-y-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
            <FaPalette className="text-emerald-400 text-xl" />
            <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">Interface Design</h2>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] mt-1">Configure optical presentation parameters</p>
            </div>
        </div>
        
        <div className="bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">HUD Theme Select</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button className="bg-[#050d1a] border-2 border-cyan-500 p-6 rounded-2xl text-left relative overflow-hidden group shadow-[0_0_30px_rgba(0,198,255,0.15)] shadow-inner">
                    <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-lg shadow-cyan-500/50">
                        <FaCheck size={10} />
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />
                    
                    <p className="text-sm font-black text-white uppercase tracking-widest mb-2 relative z-10">Deep Space (Tactical)</p>
                    <p className="text-[10px] text-cyan-100/60 font-bold uppercase tracking-widest leading-relaxed mb-6 relative z-10 pr-8">High contrast dark matter interface optimized for low-light clinical ops.</p>
                    
                    <div className="flex gap-3 relative z-10">
                        <div className="w-5 h-5 rounded-full bg-[#00C6FF] border border-white/20 shadow-lg shadow-cyan-500/50"></div>
                        <div className="w-5 h-5 rounded-full bg-[#7B2FBE] border border-white/20 shadow-lg"></div>
                        <div className="w-5 h-5 rounded-full bg-[#050d1a] border border-white/50 shadow-lg"></div>
                    </div>
                </button>

                <button className="bg-white/5 border border-white/5 p-6 rounded-2xl text-left relative opacity-40 cursor-not-allowed group hover:opacity-50 transition-opacity">
                    <div className="absolute top-4 right-4 text-[9px] bg-black/40 text-white px-3 py-1 rounded-full uppercase font-black tracking-widest border border-white/10 shadow-lg">Pending Firmware</div>
                    <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Hospital Daylight</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest leading-relaxed mb-6 pr-8">Bleached, high-albedo interface specifically tuned for bright lab environments.</p>
                    <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#ffffff] border border-gray-400"></div>
                        <div className="w-5 h-5 rounded-full bg-[#3b82f6] border border-gray-400"></div>
                        <div className="w-5 h-5 rounded-full bg-[#f8fafc] border border-gray-400"></div>
                    </div>
                </button>
            </div>
        </div>

        <div className="bg-black/20 p-6 rounded-3xl border border-white/5 shadow-inner mt-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6">Language / भाषा</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button 
                    onClick={() => setLanguage('en')}
                    className={`p-6 rounded-2xl text-left relative overflow-hidden group border-2 transition-all ${language === 'en' ? 'bg-[#050d1a] border-cyan-500 shadow-[0_0_30px_rgba(0,198,255,0.15)] shadow-inner' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                >
                    {language === 'en' && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-lg shadow-cyan-500/50">
                            <FaCheck size={10} />
                        </div>
                    )}
                    <p className="text-sm font-black text-white uppercase tracking-widest mb-2 relative z-10">English (EN)</p>
                    <p className="text-[10px] text-cyan-100/60 font-bold uppercase tracking-widest leading-relaxed relative z-10">Default system language for all technical readouts.</p>
                </button>

                <button 
                    onClick={() => setLanguage('hi')}
                    className={`p-6 rounded-2xl text-left relative overflow-hidden group border-2 transition-all ${language === 'hi' ? 'bg-[#050d1a] border-cyan-500 shadow-[0_0_30px_rgba(0,198,255,0.15)] shadow-inner' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                >
                    {language === 'hi' && (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-lg shadow-cyan-500/50">
                            <FaCheck size={10} />
                        </div>
                    )}
                    <p className="text-sm font-black text-white uppercase tracking-widest mb-2 relative z-10">हिन्दी (HI)</p>
                    <p className="text-[10px] text-cyan-100/60 font-bold uppercase tracking-widest leading-relaxed relative z-10">Regional Indian language protocol for interface.</p>
                </button>
            </div>
        </div>
    </div>
));

const SettingsPage = () => {
    const { state, dispatch } = useApp();
    const { user } = state.auth;
    const { language } = state;
    const [activeTab, setActiveTab] = useState('profile');

    const handleSetLanguage = (lang) => {
        dispatch({ type: 'SET_LANGUAGE', payload: lang });
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-7xl mx-auto pb-10">
             <div className="bg-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                     <h1 className="text-3xl font-black text-white tracking-tight uppercase">Global Configuration</h1>
                     <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.3em] mt-2">Adjust System Parameters & Identity Verification</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Content Pane */}
                <div className="flex-1 bg-card rounded-[2.5rem] p-8 sm:p-10 border border-white/5 shadow-2xl overflow-hidden relative">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    {activeTab === 'profile' && <ProfileTab user={user} />}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'notifications' && <NotificationsTab />}
                    {activeTab === 'appearance' && <AppearanceTab language={language} setLanguage={handleSetLanguage} />}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
