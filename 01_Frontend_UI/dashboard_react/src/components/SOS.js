import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../utils/animations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneVolume, faAmbulance, faUserMd, faHeartbeat, faPlus, faTrash, faPhone } from '@fortawesome/free-solid-svg-icons';

const SOS = () => {
    const [contacts] = useState([
        { id: 1, name: 'Dr. Emily Chen', relation: 'Neurologist', phone: '555-0101' },
        { id: 2, name: 'John Doe', relation: 'Spouse', phone: '555-0102' }
    ]);
    const [isCalling, setIsCalling] = useState(false);

    const handleEmergencyCall = () => {
        setIsCalling(true);
        // Simulate call delay
        setTimeout(() => {
            alert("Initiating Emergency Protocol... Contacting 911 and registered contacts.");
            setIsCalling(false);
        }, 2000);
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-2xl mx-auto text-center"
        >
            <div className="mb-8">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block relative"
                >
                    {/* Pulsing Effect */}
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-[-20px] bg-red-500 rounded-full animate-pulse opacity-10"></div>

                    <button
                        onClick={handleEmergencyCall}
                        className="relative w-64 h-64 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center gap-4 z-10 border-8 border-red-400/30"
                    >
                        <FontAwesomeIcon icon={faPhoneVolume} className={`text-6xl ${isCalling ? 'animate-shake' : ''}`} />
                        <span className="text-3xl font-black tracking-widest">SOS</span>
                        <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase">Tap for Emergency</span>
                    </button>
                </motion.div>
                <p className="mt-8 text-gray-500 max-w-md mx-auto">
                    Pressing this button will immediately contact emergency services and notify your registered care network with your current location.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="glass p-4 text-red-600 hover:bg-red-50 transition-colors flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon={faAmbulance} className="text-2xl" />
                    <span className="font-bold">Call Ambulance</span>
                </button>
                <button className="glass p-4 text-blue-600 hover:bg-blue-50 transition-colors flex flex-col items-center gap-2">
                    <FontAwesomeIcon icon={faUserMd} className="text-2xl" />
                    <span className="font-bold">Call Doctor</span>
                </button>
            </div>

            {/* Contacts List */}
            <div className="glass text-left overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FontAwesomeIcon icon={faHeartbeat} className="text-red-500" />
                        Emergency Contacts
                    </h3>
                    <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                        <FontAwesomeIcon icon={faPlus} /> Add
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {contacts.map(contact => (
                        <div key={contact.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                    {contact.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{contact.name}</p>
                                    <p className="text-xs text-gray-500">{contact.relation} • {contact.phone}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors" title="Call">
                                    <FontAwesomeIcon icon={faPhone} />
                                </button>
                                <button className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors" title="Remove">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default SOS;
