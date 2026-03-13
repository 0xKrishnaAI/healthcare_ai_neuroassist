/**
 * NeuroDx - BrainScan AI Dashboard Controller
 * Handles UI interactions, simulating the 3-stage backend pipeline, and dynamic result rendering.
 */

class DashboardController {
    constructor() {
        this.currentView = 'dashboard';
        this.isProcessing = false;

        // DOM Elements
        this.elements = {
            tabs: document.querySelectorAll('.nav-item'),
            views: document.querySelectorAll('.view-section'),
            uploadZone: document.getElementById('upload-zone'),
            fileInput: document.getElementById('file-input'),
            progressContainer: document.getElementById('progress-container'),
            progressBar: document.getElementById('progress-bar'),
            progressLabel: document.getElementById('progress-label'),
            progressPercent: document.getElementById('progress-percent'),
            taskSteps: {
                task1: document.getElementById('task1-step'),
                task2: document.getElementById('task2-step'),
                task3: document.getElementById('task3-step')
            },
            resultsPanel: document.getElementById('results-panel'),
            ringProgress: document.getElementById('ring-progress'),
            confScore: document.getElementById('confidence-score'),
            diagLabel: document.getElementById('diagnosis-label'),
            atrophyBar: document.getElementById('atrophy-bar'),
            atrophyVal: document.getElementById('atrophy-val'),
            amyloidBar: document.getElementById('amyloid-bar'),
            amyloidVal: document.getElementById('amyloid-val')
        };

        this.init();
    }

    init() {
        this.setupTabs();
        this.setupUpload();
        this.setupMobileMenu();

        // Populate Reports Table
        this.renderReports();
    }

    /* --- Navigation --- */
    setupTabs() {
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = tab.dataset.tab;
                this.switchView(target);

                // Active State Update
                this.elements.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    switchView(viewId) {
        this.elements.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === `${viewId}-view`) {
                view.classList.add('active');
            }
        });
    }

    /* --- Upload & Simulation Logic --- */
    setupUpload() {
        const zone = this.elements.uploadZone;
        const input = this.elements.fileInput;

        // Visual Feedback for Drag & Drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--primary)';
            zone.style.background = 'rgba(0,123,255,0.05)';
        });

        zone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            zone.removeAttribute('style');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) this.startSimulation(e.dataTransfer.files[0]);
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.startSimulation(e.target.files[0]);
        });
    }

    startSimulation(file) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // UI Reset
        this.elements.uploadZone.classList.add('hidden');
        this.elements.progressContainer.classList.remove('hidden');
        this.elements.resultsPanel.classList.add('hidden');

        // Reset Steps
        Object.values(this.elements.taskSteps).forEach(step => step.className = 'pending');

        // Simulation Loop
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            this.updateProgressUI(progress);

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => this.showResults(), 800);
            }
        }, 60); // Total time approx 6s
    }

    updateProgressUI(percent) {
        this.elements.progressBar.style.width = `${percent}%`;
        this.elements.progressPercent.textContent = `${percent}%`;

        // Task 1: 0-30%
        if (percent < 30) {
            this.elements.progressLabel.textContent = "Preprocessing: N4 Bias Correction...";
            this.elements.taskSteps.task1.className = 'active';
        }
        // Task 2: 30-60%
        else if (percent < 60) {
            this.elements.progressLabel.textContent = "Binary Classification (CN vs AD)...";
            this.elements.taskSteps.task1.className = 'completed';
            this.elements.taskSteps.task2.className = 'active';
        }
        // Task 3: 60-100%
        else {
            this.elements.progressLabel.textContent = "Multi-Class Analysis (MCI Detection)...";
            this.elements.taskSteps.task2.className = 'completed';
            this.elements.taskSteps.task3.className = 'active';
        }

        if (percent === 100) {
            this.elements.taskSteps.task3.className = 'completed';
            this.elements.progressLabel.textContent = "Analysis Complete.";
        }
    }

    showResults() {
        this.isProcessing = false;
        this.elements.progressContainer.classList.add('hidden');
        this.elements.resultsPanel.classList.remove('hidden');

        // Randomly pick a result scenarios (for demo)
        const scenarios = [
            { label: 'Normal (CN)', color: 'var(--success)', score: 98, atrophy: 12, amyloid: 8 },
            { label: 'MCI (Early Stage)', color: 'var(--warning)', score: 76, atrophy: 35, amyloid: 42 },
            { label: 'Alzheimer\'s (AD)', color: 'var(--danger)', score: 94, atrophy: 72, amyloid: 88 }
        ];

        const result = scenarios[Math.floor(Math.random() * scenarios.length)];

        // Render Ring
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (result.score / 100) * circumference;

        this.elements.ringProgress.style.strokeDashoffset = offset;
        this.elements.ringProgress.style.stroke = result.color;

        this.elements.confScore.textContent = `${result.score}%`;
        this.elements.diagLabel.textContent = result.label;
        this.elements.diagLabel.style.color = result.color;

        // Render Biomarkers
        this.elements.atrophyBar.style.width = `${result.atrophy}%`;
        this.elements.atrophyVal.textContent = `${result.atrophy}%`;

        this.elements.amyloidBar.style.width = `${result.amyloid}%`;
        this.elements.amyloidVal.textContent = `${result.amyloid}%`;
    }

    /* --- Reports Table --- */
    renderReports() {
        const container = document.getElementById('reports-view');
        container.innerHTML = `
            <div class="card glass">
                <h3>Recent Patient Scan Reports</h3>
                <table style="width:100%; margin-top:1rem; border-collapse:collapse;">
                    <thead style="text-align:left; color:var(--text-secondary);">
                        <tr><th style="padding:10px;">ID</th><th>Date</th><th>Prediction</th><th>Conf.</th><th>Status</th></tr>
                    </thead>
                    <tbody style="font-size:0.9rem;">
                        <tr style="border-top:1px solid #eee;">
                            <td style="padding:10px;">002_S_0295</td><td>Oct 22</td><td>CN</td><td>98%</td>
                            <td><span style="background:#d4edda; color:#155724; padding:2px 8px; border-radius:10px; font-size:0.8rem;">Accepted</span></td>
                        </tr>
                        <tr style="border-top:1px solid #eee;">
                            <td style="padding:10px;">002_S_0413</td><td>Oct 21</td><td>MCI</td><td>72%</td>
                            <td><span style="background:#fff3cd; color:#856404; padding:2px 8px; border-radius:10px; font-size:0.8rem;">Review</span></td>
                        </tr>
                        <tr style="border-top:1px solid #eee;">
                            <td style="padding:10px;">002_S_1234</td><td>Oct 20</td><td>AD</td><td>94%</td>
                            <td><span style="background:#f8d7da; color:#721c24; padding:2px 8px; border-radius:10px; font-size:0.8rem;">Alert</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    setupMobileMenu() {
        // Simple toggle for mobile sidebar placeholder
        // In a real app this would slide out the drawer
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardController();
});
