from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime
import os

import models
from database import engine, get_db

from routes import auth_routes, patient_routes, scan_routes

# Initialize DB tables
models.Base.metadata.create_all(bind=engine)

# Ensure uploads directories exist
os.makedirs("uploads/mri_scans", exist_ok=True)
os.makedirs("uploads/gradcam", exist_ok=True)

app = FastAPI(
    title="NeuroAssist API",
    description="Backend for NeuroAssist Alzheimer's Detection System",
    version="2.0.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (GradCAM heatmaps, uploaded scans)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(auth_routes.router)
app.include_router(patient_routes.router)
app.include_router(scan_routes.router)


@app.get("/")
def read_root():
    return {"status": "ok", "app": "NeuroAssist API", "version": "2.0.0"}


@app.get("/api/debug/status")
def debug_status(db: Session = Depends(get_db)):
    """
    Dev-only endpoint returning system status for the Settings page.
    Shows DB stats, loaded models, and server info.
    """
    db_path = os.path.abspath("neuroassist.db")
    db_size_mb = 0.0
    if os.path.isfile(db_path):
        db_size_mb = round(os.path.getsize(db_path) / (1024 * 1024), 2)

    total_users = db.query(models.User).count()
    total_patients = db.query(models.Patient).count()
    total_scans = db.query(models.Scan).count()

    return {
        "database_path": db_path,
        "database_size_mb": db_size_mb,
        "total_users": total_users,
        "total_patients": total_patients,
        "total_scans": total_scans,
        "models_loaded": ["binary", "multiclass"],
        "inference_engine": "deterministic_fallback_v2",
        "gradcam_engine": "gaussian_blob_simulation",
        "server_time": datetime.utcnow().isoformat(),
        "status": "healthy",
    }
