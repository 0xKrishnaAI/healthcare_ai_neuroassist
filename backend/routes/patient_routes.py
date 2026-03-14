from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import json

import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/patients", tags=["patients"])


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: str
    gender: str
    contact: str = ""
    medical_history: str = ""


@router.post("/create", status_code=201)
def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.RoleEnum.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can create patients")

    # Generate unique patient code: NA-YYYY-NNNN
    count = db.query(models.Patient).count()
    year = datetime.now().year
    code = f"NA-{year}-{str(count + 1).zfill(4)}"

    new_patient = models.Patient(
        patient_code=code,
        doctor_id=current_user.id,
        full_name=patient.full_name,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        contact=patient.contact,
        medical_history=patient.medical_history,
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return {
        "id": new_patient.id,
        "patient_code": new_patient.patient_code,
        "full_name": new_patient.full_name,
        "date_of_birth": new_patient.date_of_birth,
        "gender": new_patient.gender,
        "contact": new_patient.contact,
        "medical_history": new_patient.medical_history,
        "doctor_id": new_patient.doctor_id,
    }


@router.get("/")
def get_patients(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == models.RoleEnum.doctor:
        patients = (
            db.query(models.Patient)
            .filter(models.Patient.doctor_id == current_user.id)
            .all()
        )
    else:
        patients = (
            db.query(models.Patient)
            .filter(models.Patient.user_id == current_user.id)
            .all()
        )

    # Return flat list for direct frontend consumption
    result = []
    for p in patients:
        scan_count = db.query(models.Scan).filter(models.Scan.patient_id == p.id).count()
        result.append(
            {
                "id": p.id,
                "patient_code": p.patient_code,
                "full_name": p.full_name,
                "date_of_birth": p.date_of_birth,
                "gender": p.gender,
                "contact": p.contact,
                "medical_history": p.medical_history,
                "doctor_id": p.doctor_id,
                "scan_count": scan_count,
            }
        )

    return result


@router.get("/{patient_id}")
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Security check
    if current_user.role == models.RoleEnum.patient and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == models.RoleEnum.doctor and patient.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get patient's scans
    scans = (
        db.query(models.Scan)
        .filter(models.Scan.patient_id == patient_id)
        .order_by(models.Scan.upload_date.desc())
        .all()
    )

    scan_list = []
    for s in scans:
        brain_regions = {}
        if s.brain_regions_json:
            try:
                brain_regions = json.loads(s.brain_regions_json)
            except json.JSONDecodeError:
                pass

        scan_list.append(
            {
                "id": s.scan_id_string,
                "date": s.upload_date.isoformat() if s.upload_date else None,
                "diagnosis": s.prediction,
                "confidence": round(max(s.conf_cn or 0, s.conf_mci or 0, s.conf_ad or 0) * 100, 1),
                "conf_cn": s.conf_cn,
                "conf_mci": s.conf_mci,
                "conf_ad": s.conf_ad,
                "status": s.status,
                "urgency": s.urgency,
                "model": s.model_used,
                "brain_regions": brain_regions,
            }
        )

    return {
        "id": patient.id,
        "patient_code": patient.patient_code,
        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "contact": patient.contact,
        "medical_history": patient.medical_history,
        "doctor_id": patient.doctor_id,
        "scans": scan_list,
        "total_scans": len(scan_list),
    }


@router.get("/{patient_id}/timeline")
def get_patient_timeline(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if current_user.role == models.RoleEnum.patient and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    scans = (
        db.query(models.Scan)
        .filter(models.Scan.patient_id == patient_id)
        .order_by(models.Scan.upload_date.asc())
        .all()
    )

    timeline = []
    for scan in scans:
        if scan.prediction:
            score = {"CN": 0, "MCI": 1, "AD": 2}.get(scan.prediction, 0)
            conf = max(scan.conf_cn or 0, scan.conf_mci or 0, scan.conf_ad or 0)
            timeline.append(
                {
                    "date": scan.upload_date.strftime("%b %Y") if scan.upload_date else "",
                    "date_iso": scan.upload_date.isoformat() if scan.upload_date else "",
                    "score": score,
                    "result": scan.prediction,
                    "conf": round(conf * 100, 1),
                    "scan_id": scan.scan_id_string,
                }
            )

    return timeline
