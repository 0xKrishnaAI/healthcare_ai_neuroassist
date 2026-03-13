# NeuroAssist - Run Guide

NeuroAssist is a complete full-stack clinical decision support. Here is how to run the system for a demo or hackathon presentation.

## Prerequisites
- Python 3.10+
- Node.js 18+

## Step 1: Start the Backend (FastAPI)
Open a terminal in the `backend` folder.

1. **Create Virtual Environment & Install Deps**
```bash
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

pip install -r requirements.txt
```

2. **Seed the Database (One-time setup)**
This will create mock doctors, patients, and scans so you have beautiful data to demo immediately.
```bash
python seed.py
```

3. **Run the Server**
```bash
uvicorn main:app --reload
```
The API will run on `http://localhost:8000`. You can view Swagger docs at `http://localhost:8000/docs`.

## Step 2: Start the Frontend (React)
Open a secondary terminal in `01_Frontend_UI/dashboard_react`

1. **Install Modules**
```bash
npm install
```

2. **Start Development Server**
```bash
npm start
```
The UI will run on `http://localhost:3000`.

## Step 3: Demo Accounts
The `seed.py` creates the following accounts you can log in with:

**Doctor Account (Full Access):**
- Email: `dr.smith@neuroassist.com`
- Password: `doctor123`

**Patient Accounts (Read-only):**
- Emails: `meera@demo.com` | `suresh@demo.com` | `lakshmi@demo.com`
- Password: `patient123`
