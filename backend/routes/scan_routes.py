from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import uuid
import os
import json

import models
from database import get_db
from auth import get_current_user
from ml.inference import run_inference
from ml.gradcam_engine import generate_brain_heatmap_slices

router = APIRouter(prefix="/api/scan", tags=["scans"])

UPLOAD_DIR = "uploads"
SCAN_DIR = os.path.join(UPLOAD_DIR, "scans")
GRADCAM_DIR = os.path.join(UPLOAD_DIR, "gradcam")
os.makedirs(SCAN_DIR, exist_ok=True)
os.makedirs(GRADCAM_DIR, exist_ok=True)


@router.post("/upload")
async def upload_scan(
    file: UploadFile = File(...),
    patient_id: int = Form(...),
    model_type: str = Form("multiclass"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.RoleEnum.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can upload scans")

    # Verify patient ownership
    patient = (
        db.query(models.Patient)
        .filter(
            models.Patient.id == patient_id,
            models.Patient.doctor_id == current_user.id,
        )
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or unauthorized")

    # Generate unique scan ID
    scan_id_str = f"SCN-{uuid.uuid4().hex[:6].upper()}"

    # Save file to uploads/scans/{scan_id}/
    scan_dir = os.path.join(SCAN_DIR, scan_id_str)
    os.makedirs(scan_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    if file.filename.endswith(".nii.gz"):
        file_ext = ".nii.gz"

    safe_filename = f"{scan_id_str}{file_ext}"
    file_path = os.path.join(scan_dir, safe_filename)

    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # --- Run deterministic inference ---
    inference_result = run_inference(file_path, model_type)

    # --- Generate Grad-CAM heatmap slices ---
    pred_idx = {"CN": 0, "MCI": 1, "AD": 2}.get(inference_result["prediction"], 1)

    gradcam_result = None
    try:
        gradcam_result = generate_brain_heatmap_slices(
            scan_id=scan_id_str,
            prediction_class=pred_idx,
            brain_regions=inference_result["brain_regions"],
            output_dir=GRADCAM_DIR,
        )
    except Exception as e:
        print(f"[WARN] Grad-CAM generation failed: {e}")

    # Extract gradcam paths
    gradcam_axial = None
    gradcam_coronal = None
    gradcam_sagittal = None
    if gradcam_result and "slice_paths" in gradcam_result:
        gradcam_axial = gradcam_result["slice_paths"].get("axial")
        gradcam_coronal = gradcam_result["slice_paths"].get("coronal")
        gradcam_sagittal = gradcam_result["slice_paths"].get("sagittal")

    # --- Save scan to database ---
    biomarkers = inference_result["biomarkers"]
    new_scan = models.Scan(
        scan_id_string=scan_id_str,
        patient_id=patient.id,
        filename=safe_filename,
        original_filename=file.filename,
        file_hash=inference_result.get("file_hash", ""),
        model_used=model_type,
        prediction=inference_result["prediction"],
        conf_cn=inference_result["confidence_cn"],
        conf_mci=inference_result["confidence_mci"],
        conf_ad=inference_result["confidence_ad"],
        risk_score=inference_result["risk_score"],
        urgency=inference_result["urgency"],
        processing_time=inference_result["processing_time"],
        biomarker_hippocampal=biomarkers["hippocampal_atrophy"],
        biomarker_amyloid=biomarkers["amyloid_plaque_load"],
        biomarker_ventricle=biomarkers["ventricle_enlargement"],
        gradcam_axial=gradcam_axial,
        gradcam_coronal=gradcam_coronal,
        gradcam_sagittal=gradcam_sagittal,
        brain_regions_json=json.dumps(inference_result["brain_regions"]),
        status="pending",
    )

    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    return _format_scan_response(new_scan)


@router.get("/history")
def get_scan_history(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Scan).join(models.Patient)

    if current_user.role == models.RoleEnum.doctor:
        query = query.filter(models.Patient.doctor_id == current_user.id)
    else:
        query = query.filter(models.Patient.user_id == current_user.id)

    scans = query.order_by(models.Scan.upload_date.desc()).limit(limit).all()

    result = []
    for s in scans:
        result.append(
            {
                "id": s.scan_id_string,
                "date": s.upload_date.isoformat() if s.upload_date else None,
                "patient": s.patient.full_name if s.patient else "Unknown",
                "patient_code": s.patient.patient_code if s.patient else "",
                "patient_id": s.patient_id,
                "diagnosis": s.prediction,
                "confidence": round(max(s.conf_cn or 0, s.conf_mci or 0, s.conf_ad or 0) * 100, 1),
                "status": s.status,
                "urgency": s.urgency,
                "model": s.model_used,
            }
        )

    return {"items": result, "total": len(result)}


@router.get("/{scan_id}")
def get_scan_detail(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    scan = db.query(models.Scan).filter(models.Scan.scan_id_string == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return _format_scan_response(scan)


@router.put("/{scan_id}/review")
def review_scan(
    scan_id: str,
    review_data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.RoleEnum.doctor:
        raise HTTPException(status_code=403, detail="Unauthorized")

    scan = db.query(models.Scan).filter(models.Scan.scan_id_string == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    action = review_data.get("action", "")
    if action == "ACCEPT FINDING":
        scan.status = "accepted"
        scan.doctor_diagnosis = scan.prediction
    elif action == "FLAG FOR REVIEW":
        scan.status = "flagged"
    elif action == "OVERRIDE DIAGNOSIS":
        scan.status = "overridden"
        scan.doctor_diagnosis = review_data.get("doctor_diagnosis")

    scan.doctor_notes = review_data.get("doctor_notes", "")
    scan.reviewed_at = datetime.utcnow()

    db.commit()
    return {
        "message": "Review recorded successfully",
        "status": scan.status,
        "doctor": current_user.full_name,
        "reviewed_at": scan.reviewed_at.isoformat() if scan.reviewed_at else None,
    }


def _format_scan_response(scan: models.Scan) -> dict:
    """Format a Scan model instance into a full API response dict."""
    brain_regions = {}
    if scan.brain_regions_json:
        try:
            brain_regions = json.loads(scan.brain_regions_json)
        except json.JSONDecodeError:
            brain_regions = {}

    gradcam_slices = {}
    if scan.gradcam_axial:
        gradcam_slices["axial"] = "/" + scan.gradcam_axial.replace("\\", "/")
    if scan.gradcam_coronal:
        gradcam_slices["coronal"] = "/" + scan.gradcam_coronal.replace("\\", "/")
    if scan.gradcam_sagittal:
        gradcam_slices["sagittal"] = "/" + scan.gradcam_sagittal.replace("\\", "/")

    return {
        "scan_id": scan.scan_id_string,
        "patient_id": scan.patient_id,
        "patient_name": scan.patient.full_name if scan.patient else "Unknown",
        "patient_code": scan.patient.patient_code if scan.patient else "",
        "prediction": scan.prediction,
        "confidence_cn": scan.conf_cn,
        "confidence_mci": scan.conf_mci,
        "confidence_ad": scan.conf_ad,
        "risk_score": scan.risk_score,
        "urgency": scan.urgency,
        "processing_time": scan.processing_time,
        "model_used": scan.model_used,
        "file_hash": scan.file_hash,
        "original_filename": scan.original_filename,
        "scan_date": scan.upload_date.isoformat() if scan.upload_date else None,
        "status": scan.status,
        "doctor_diagnosis": scan.doctor_diagnosis,
        "doctor_notes": scan.doctor_notes,
        "reviewed_at": scan.reviewed_at.isoformat() if scan.reviewed_at else None,
        "biomarkers": {
            "hippocampal_atrophy": scan.biomarker_hippocampal,
            "amyloid_plaque_load": scan.biomarker_amyloid,
            "ventricle_enlargement": scan.biomarker_ventricle,
        },
        "gradcam_slices": gradcam_slices,
        "brain_regions": brain_regions,
    }
