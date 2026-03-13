import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, cardVariants } from '../utils/animations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faBookOpen, faExclamationCircle, faChevronDown, faChevronUp, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

const Help = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            q: "How accurate is the Alzheimer's detection?",
            a: "Our MedicalNet ResNet-10 model achieves 87% balanced accuracy for binary classification (CN vs AD) and 72% for multi-class staging. However, results are for screening support only and must be verified by a neurologist."
        },
        {
            q: "What file formats are supported?",
            a: "NeuroAssist currently supports NIfTI formats (.nii, .nii.gz). DICOM support is planned for future updates."
        },
        {
            q: "Is patient data stored securely?",
            a: "Yes, all data is processed locally within the secure hackathon environment. No patient data is transmitted to external servers without explicit consent."
        },
        {
            q: "What do the confidence scores mean?",
            a: "The confidence score reflects the model's probability estimation. Scores >90% indicate high certainty. Scores <60% suggest uncertainty and require manual review."
        }
    ];

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="max-w-5xl mx-auto"
        >
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">How can we help you?</h2>
                <p className="text-gray-500">Find answers, documentation, and support for NeuroAssist</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
                <HelpCard
                    icon={faBookOpen}
                    title="User Guide"
                    desc="Complete manual on scanning, preprocessing, and interpreting results."
                    action="View Documentation"
                />
                <HelpCard
                    icon={faExclamationCircle}
                    title="Troubleshooting"
                    desc="Solutions for common errors like 'Invalid File Format' or processing timeouts."
                    action="View Solutions"
                />
                <HelpCard
                    icon={faQuestionCircle}
                    title="Clinical Support"
                    desc="Guidelines for neurologists on integrating AI insights into diagnosis."
                    action="Clinical Guidelines"
                />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="md:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="glass overflow-hidden shadow-sm">
                                <button
                                    className="w-full text-left p-4 flex justify-between items-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    {faq.q}
                                    <FontAwesomeIcon icon={openFaq === idx ? faChevronUp : faChevronDown} className="text-primary text-sm" />
                                </button>
                                <AnimatePresence>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-gray-50/50"
                                        >
                                            <p className="p-4 pt-0 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                                                {faq.a}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Card */}
                <div className="md:col-span-1">
                    <div className="glass p-6 sticky top-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Still need help?</h3>
                        <p className="text-blue-100 text-sm mb-6">Our support team is available 24/7 for critical system issues.</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon icon={faPhone} />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-200 uppercase font-bold">Emergency Support</p>
                                    <p className="font-mono text-lg font-bold">+1 (800) 555-0199</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-200 uppercase font-bold">Email Support</p>
                                    <p className="text-sm font-medium">support@NeuroAssist.ai</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-6 bg-white text-primary font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const HelpCard = ({ icon, title, desc, action }) => (
    <motion.div
        variants={cardVariants}
        whileHover={{ y: -5 }}
        className="glass p-6 text-center hover:shadow-lg transition-all"
    >
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-xl">
            <FontAwesomeIcon icon={icon} />
        </div>
        <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4 h-10">{desc}</p>
        <button className="text-primary text-sm font-bold hover:underline">
            {action} →
        </button>
    </motion.div>
);

export default Help;
