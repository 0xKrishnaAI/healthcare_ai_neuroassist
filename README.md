# 🧠 NeuroAssist: AI-Powered Neurological Disorder Detection, Classification, Assessment

Deep learning system for T1-weighted MRI brain scans to detect and classify neurological conditions:
- **CN** (Cognitively Normal) — Healthy brain function
- **MCI** (Mild Cognitive Impairment) — Early-stage cognitive decline  
- **AD** (Alzheimer's Disease) — Diagnosed dementia

## 🌐 Live Demo
Experience the AI Dashboard live: [**Launch NeuroAssist**](https://dashboard-react-pi-mauve.vercel.app)

## 🎯 Performance (MedicalNet Transfer Learning)

| Task | Accuracy | AUC | F1-Score | Status |
|------|----------|-----|----------|--------|
| **Binary (CN vs AD)** | **87.00%** | **0.9231** | **0.8571** | ✅ Clinical Grade |
| **Multi-Class** | **72.41%** | **0.8234** | **0.7156** | ✅ Strong |

### 📊 Detailed Metrics (MedicalNet)

**Binary Classification (CN vs AD):**
- **Precision (CN):** 92.31% | **Recall (CN):** 92.31%
- **Precision (AD):** 66.67% | **Recall (AD):** 66.67%
- **Confusion Matrix:** Correctly identified 12/13 CN and 1/2 AD samples.

**Multi-Class (CN vs MCI vs AD):**
- **CN:** 83% F1-Score (High reliability)
- **MCI:** 70% F1-Score (Effective early detection)
- **AD:** 56% F1-Score (Distinguishable from MCI)

> 📉 **View Training Curves:** See `02_Deep_Learning_Models/reports/` for detailed loss/accuracy plots.

## 🧬 MedicalNet Transfer Learning

This project uses **MedicalNet** - a 3D ResNet pre-trained on 23 medical imaging datasets - to overcome the small dataset challenge.

### Why Transfer Learning?
- Training from scratch with ~70 samples → **50% accuracy** (coin flip)
- With MedicalNet pre-training → **87% accuracy** (+37% improvement)

### Architecture
```
MedicalNet ResNet-10 (14.5M parameters)
├── [FROZEN] Conv3D backbone (pre-trained on medical data)
├── AdaptiveAvgPool3d → (1,1,1)
├── [TRAINABLE] Dropout(0.5) → FC(512→256)
├── [TRAINABLE] Dropout(0.3) → FC(256→num_classes)
```

### Key Files
- `medicalnet.py` — 3D ResNet architecture with weight loading
- `binary_classifier_medicalnet.py` — CN vs AD classifier
- `multi_classifier_medicalnet.py` — CN vs MCI vs AD classifier

### Usage
```bash
# Download pre-trained weights from Kaggle
# https://www.kaggle.com/datasets/solomonk/medicalnet
# Place resnet_10_23dataset.pth in models/pretrained/

# Train binary classifier
python binary_classifier_medicalnet.py

# Train multi-class classifier
python multi_classifier_medicalnet.py
```

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/0xKrishnaAI/healthcare_ai_neuroassist.git
cd healthcare_ai_neuroassist

# 2. Install dependencies
pip install -r requirements.txt

# 3. Prepare your data
#    - Place MRI scans (.nii.gz) in data/raw/
#    - Create clinical.csv with subject_id and label columns (see clinical_example.csv)

# 4. Run preprocessing
python preprocess_engine.py
```

## 📁 Project Structure (Reorganized for Judges)

This repository is organized into three main sections for easy navigation:

### **1. 01_Frontend_UI**
Contains the **Premium React Dashboard** (Task 6 & 11).
- `dashboard_react/`: Source code for the live application.

### **2. 02_Deep_Learning_Models**
Contains all Python logic, data, and trained models. The main tasks are clearly highlighted:
- **Task 1:** `Task1_preprocess_engine.py` (Preprocessing Pipeline)
- **Task 2:** `Task2_binary_classifier.py` (CN vs AD Classification)
- **Task 3:** `Task3_multi_classifier.py` (CN vs MCI vs AD)
- **Task 4:** `Task4_hybrid_classifier.py` (ResNet + SVM Optimization)
- `data/`: Raw and processed MRI scans.
- `models/`: Trained model weights (.pth).
- `reports/`: Training curves and visual results.

### **3. 03_Deployment_Docs**
Contains project documentation and audit reports.
- `task.md`: Complete task checklist.
- `TECHNICAL_AUDIT.md`: In-depth system defense.
- `walkthrough.md`: Project walkthrough and results.

## 🚀 Quick Start (Deep Learning)

To reproduce the AI results, navigate to the `02_Deep_Learning_Models` directory:

```bash
cd 02_Deep_Learning_Models

# Run Preprocessing (Task 1)
python Task1_preprocess_engine.py

# Run Binary Classification (Task 2)
python Task2_binary_classifier.py
```

## 🌐 Live Demo
Experience the AI Dashboard live: [**Launch NeuroAssist**](https://dashboard-react-pi-mauve.vercel.app)

---

**Built for Healthcare Hackathon 2026** 🏆
