import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FaUser, FaLock, FaBell, FaPalette, FaSave } from 'react-icons/fa';

const SettingsPage = () => {
    const { state } = useApp();
    const { user } = state.auth;
    const [activeTab, setActiveTab] = useState('profile');

    const TABS = [
        { id: 'profile', label: 'My Profile', icon: FaUser },
        { id: 'security', label: 'Security', icon: FaLock },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'appearance', label: 'Appearance', icon: FaPalette },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Settings & Preferences</h1>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Navigation Tabs */}
                <div className="w-full md:w-64 space-y-2 shrink-0">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                                activeTab === tab.id 
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,198,255,0.1)]' 
                                : 'text-text-muted hover:bg-white/5 hover:text-white border border-transparent'
                            }`}
                        >
                            <tab.icon className={activeTab === tab.id ? 'text-primary' : 'text-text-muted'} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Pane */}
                <div className="flex-1 bg-[#0F2248] rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl">
                    
                    {activeTab === 'profile' && (
                        <div className="animate-fade-in space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
                            
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-purple/80 to-primary/80 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-[#0A0F1E]">
                                    {user?.full_name?.split(' ').map(n=>n[0]).join('') || 'U'}
                                </div>
                                <div>
                                    <button className="bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl border border-white/10 transition-colors text-sm mb-2 block">
                                        Change Avatar
                                    </button>
                                    <p className="text-xs text-text-muted">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Full Name</label>
                                    <input type="text" defaultValue={user?.full_name} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Email</label>
                                    <input type="email" defaultValue={user?.email} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors" />
                                </div>
                                {user?.role === 'doctor' && (
                                    <>
                                        <div>
                                            <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Medical License No.</label>
                                            <input type="text" defaultValue="MED-8849-21-TX" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Hospital Affiliation</label>
                                            <input type="text" defaultValue="General Hospital" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-text-muted focus:border-primary focus:outline-none transition-colors" />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(0,198,255,0.3)] transition-all flex items-center gap-2">
                                    <FaSave /> Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-fade-in space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Security Settings</h2>
                            
                            <div>
                                <h3 className="text-white font-medium mb-4">Change Password</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">New Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Confirm New Password</label>
                                            <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-colors" />
                                        </div>
                                    </div>
                                    <button className="bg-white/5 hover:bg-white/10 text-white font-medium py-2 px-4 rounded-xl border border-white/10 transition-colors mt-2">
                                        Update Password
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h3 className="text-white font-medium mb-4">Two-Factor Authentication (2FA)</h3>
                                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                    <div>
                                        <p className="text-white font-medium">Authenticator App</p>
                                        <p className="text-xs text-text-muted">Use an app like Google Authenticator or Authy to generate codes.</p>
                                    </div>
                                    <button className="bg-success/20 text-success border border-success/30 hover:bg-success/30 font-medium py-2 px-4 rounded-xl transition-colors">
                                        Enable
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="animate-fade-in space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>
                            
                            <div className="space-y-4">
                                {[
                                    { title: 'New Scan Results', desc: 'Get notified when a new scan has finished processing.', default: true },
                                    { title: 'Critical Findings', desc: 'Immediate alerts for high-risk predictions (e.g., AD).', default: true },
                                    { title: 'Patient Messages', desc: 'Alerts when a patient contacts you.', default: false },
                                    { title: 'System Updates', desc: 'News about NeuroAssist upgrades and maintenance.', default: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                        <div className="pr-4">
                                            <p className="text-white font-medium">{item.title}</p>
                                            <p className="text-xs text-text-muted">{item.desc}</p>
                                        </div>
                                        <div className="pt-1">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked={item.default} />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-[0_0_10px_rgba(0,198,255,0)] peer-checked:shadow-[0_0_10px_rgba(0,198,255,0.4)]"></div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="animate-fade-in space-y-6 max-w-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Appearance Settings</h2>
                            
                            <div>
                                <h3 className="text-white font-medium mb-3">Theme Selection</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="border-2 border-primary bg-[#0F2248] p-4 rounded-xl text-left relative overflow-hidden group">
                                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[#0A0F1E] text-[10px] font-bold">✓</div>
                                        <p className="text-white font-bold mb-1">Deep Space (Dark)</p>
                                        <p className="text-xs text-text-muted">High contrast, easy on the eyes for clinical environments.</p>
                                        <div className="flex gap-2 mt-3">
                                            <div className="w-4 h-4 rounded-full bg-[#00C6FF]"></div>
                                            <div className="w-4 h-4 rounded-full bg-[#7B2FBE]"></div>
                                            <div className="w-4 h-4 rounded-full bg-[#0F2248] border border-white/20"></div>
                                        </div>
                                    </button>
                                    <button className="border border-white/10 bg-[#f8fafc] p-4 rounded-xl text-left relative opacity-50 cursor-not-allowed">
                                        <div className="absolute top-2 right-2 text-xs bg-black/10 text-black/50 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Coming Soon</div>
                                        <p className="text-[#0f172a] font-bold mb-1">Clinical Light</p>
                                        <p className="text-xs text-[#64748b]">Clean, bright interface optimized for daylight reading.</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
