// BrainScan AI - Simulated Backend Logic

// Delays for realism
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const simulatePreprocessing = async (file) => {
    // Stage 1: Upload (Network latency)
    await delay(1500);
    return { status: 'uploaded', path: `/tmp/${file.name}` };
};

export const simulatePipeline = async (file) => {
    // Creates a generator/stream-like effect for the 3 tasks
    const steps = [
        { progress: 10, text: 'Validating Dicom/NIfTI Format...' },
        { progress: 25, text: 'Task 1: N4 Bias Field Correction...' },
        { progress: 40, text: 'Task 1: Skull Stripping (Brain Extraction)...' },
        { progress: 55, text: 'Task 1: MNI152 Template Registration...' },
        { progress: 70, text: 'Task 2: Binary Classification Network...' },
        { progress: 85, text: 'Task 3: Multi-Class AD/MCI Detection...' },
        { progress: 100, text: 'Finalizing Diagnostic Report...' }
    ];
    return steps;
};

// Mock Results generator
export const fetchInferenceResult = async () => {
    await delay(800); // Final processing pause

    // Randomized Result for Demo
    const scenarios = [
        { label: 'CN', full: 'Cognitively Normal', confidence: 0.98, atrophy: 12, amyloid: 8, color: 'success' },
        { label: 'MCI', full: 'Mild Cognitive Impairment', confidence: 0.76, atrophy: 35, amyloid: 45, color: 'warning' },
        { label: 'AD', full: 'Alzheimer\'s Disease', confidence: 0.92, atrophy: 68, amyloid: 82, color: 'danger' }
    ];

    // Weighted random? Let's just pick random
    return scenarios[Math.floor(Math.random() * scenarios.length)];
};

export const getMockReports = () => {
    return [
        { id: '002_S_0295', date: '2023-10-24', type: 'T1-Weighted', pred: 'CN', conf: 98, status: 'Verified' },
        { id: '002_S_0413', date: '2023-10-22', type: 'T1-Weighted', pred: 'MCI', conf: 72, status: 'Review' },
        { id: '128_S_0865', date: '2023-10-20', type: 'T1-Weighted', pred: 'AD', conf: 94, status: 'Alert' },
        { id: '011_S_0003', date: '2023-10-18', type: 'T1-Weighted', pred: 'CN', conf: 99, status: 'Verified' },
        { id: '099_S_4211', date: '2023-10-15', type: 'T1-Weighted', pred: 'AD', conf: 89, status: 'Alert' },
    ];
};
