from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import datetime
from database import Base
import enum


class RoleEnum(str, enum.Enum):
    doctor = "doctor"
    patient = "patient"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.patient)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # A doctor manages many patients
    patients = relationship("Patient", back_populates="doctor", foreign_keys="[Patient.doctor_id]")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("users.id"))

    full_name = Column(String)
    date_of_birth = Column(String)
    gender = Column(String)
    contact = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)

    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="patients")
    scans = relationship("Scan", back_populates="patient")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_id_string = Column(String, unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))

    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    filename = Column(String)
    original_filename = Column(String, nullable=True)
    file_hash = Column(String, nullable=True)
    model_used = Column(String)

    # AI Predictions
    prediction = Column(String)  # CN, MCI, AD
    conf_cn = Column(Float)
    conf_mci = Column(Float)
    conf_ad = Column(Float)
    risk_score = Column(Float)  # 0-100
    urgency = Column(String)  # routine, priority, urgent
    processing_time = Column(Float, nullable=True)

    # Biomarkers
    biomarker_hippocampal = Column(Float, nullable=True)
    biomarker_amyloid = Column(Float, nullable=True)
    biomarker_ventricle = Column(Float, nullable=True)

    # Grad-CAM
    gradcam_axial = Column(String, nullable=True)
    gradcam_coronal = Column(String, nullable=True)
    gradcam_sagittal = Column(String, nullable=True)
    brain_regions_json = Column(Text, nullable=True)  # JSON string

    # Clinical Review
    status = Column(String, default="pending")
    doctor_diagnosis = Column(String, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="scans")
