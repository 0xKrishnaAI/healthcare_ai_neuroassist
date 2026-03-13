from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from auth import get_password_hash
import datetime
import json


def seed_db():
    print("Initializing Database...")
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Create Demo Doctor
        doc_password = get_password_hash("Demo@2024")
        doc = models.User(
            email="doctor@neuroassist.ai",
            hashed_password=doc_password,
            full_name="Dr. Sarah Smith",
            role=models.RoleEnum.doctor,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"Created Doctor: {doc.email} (Demo@2024)")

        # Also support the old credentials
        doc2_password = get_password_hash("doctor123")
        doc2 = models.User(
            email="dr.smith@neuroassist.com",
            hashed_password=doc2_password,
            full_name="Dr. Anita Verma",
            role=models.RoleEnum.doctor,
        )
        db.add(doc2)
        db.commit()
        print(f"Created Doctor: {doc2.email} (doctor123)")

        # Create Patient Users
        pat_password = get_password_hash("patient123")

        p1_user = models.User(
            email="meera@demo.com", hashed_password=pat_password,
            full_name="Meera Iyer", role=models.RoleEnum.patient,
        )
        p2_user = models.User(
            email="suresh@demo.com", hashed_password=pat_password,
            full_name="Suresh Patel", role=models.RoleEnum.patient,
        )
        p3_user = models.User(
            email="lakshmi@demo.com", hashed_password=pat_password,
            full_name="Lakshmi Devi", role=models.RoleEnum.patient,
        )
        p4_user = models.User(
            email="rajesh@demo.com", hashed_password=pat_password,
            full_name="Rajesh Kumar", role=models.RoleEnum.patient,
        )

        db.add_all([p1_user, p2_user, p3_user, p4_user])
        db.commit()

        # Create Patient Profiles Linked to Demo Doctor
        now = datetime.datetime.utcnow()
        p1 = models.Patient(
            patient_code="NA-2026-0001", user_id=p1_user.id, doctor_id=doc.id,
            full_name="Meera Iyer", date_of_birth="1952-07-22",
            gender="Female", contact="+91 9876543210",
        )
        p2 = models.Patient(
            patient_code="NA-2026-0002", user_id=p2_user.id, doctor_id=doc.id,
            full_name="Suresh Patel", date_of_birth="1948-11-03",
            gender="Male", contact="+91 9876543211",
        )
        p3 = models.Patient(
            patient_code="NA-2026-0003", user_id=p3_user.id, doctor_id=doc.id,
            full_name="Lakshmi Devi", date_of_birth="1960-04-18",
            gender="Female", contact="+91 9876543212",
        )
        p4 = models.Patient(
            patient_code="NA-2026-0004", user_id=p4_user.id, doctor_id=doc.id,
            full_name="Rajesh Kumar", date_of_birth="1958-03-15",
            gender="Male", contact="+91 9876543213",
            medical_history="Family history of dementia. Mild memory complaints for 2 years.",
        )

        db.add_all([p1, p2, p3, p4])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)
        db.refresh(p4)
        print(f"Created 4 patients: Meera, Suresh, Lakshmi, Rajesh Kumar")

        # Create Seed Scans with biomarker/gradcam data
        scan1_regions = {
            "hippocampus": 0.12, "entorhinal_cortex": 0.08,
            "temporal_lobe": 0.10, "parietal_cortex": 0.06,
            "frontal_lobe": 0.09, "cerebellum": 0.04,
        }
        scan2_regions = {
            "hippocampus": 0.92, "entorhinal_cortex": 0.78,
            "temporal_lobe": 0.65, "parietal_cortex": 0.45,
            "frontal_lobe": 0.28, "cerebellum": 0.12,
        }
        scan3_regions = {
            "hippocampus": 0.68, "entorhinal_cortex": 0.55,
            "temporal_lobe": 0.42, "parietal_cortex": 0.25,
            "frontal_lobe": 0.15, "cerebellum": 0.08,
        }

        scans = [
            models.Scan(
                scan_id_string="SCN-A1B2C3", patient_id=p1.id,
                filename="mri_01.nii.gz", original_filename="meera_scan.nii.gz",
                model_used="multiclass",
                prediction="CN", conf_cn=0.92, conf_mci=0.05, conf_ad=0.03,
                risk_score=5.5, urgency="routine", status="accepted",
                biomarker_hippocampal=0.04, biomarker_amyloid=0.05, biomarker_ventricle=0.03,
                brain_regions_json=json.dumps(scan1_regions),
                upload_date=now - datetime.timedelta(days=10),
            ),
            models.Scan(
                scan_id_string="SCN-D4E5F6", patient_id=p2.id,
                filename="mri_02.nii.gz", original_filename="suresh_scan.nii.gz",
                model_used="multiclass",
                prediction="AD", conf_cn=0.04, conf_mci=0.10, conf_ad=0.86,
                risk_score=91.0, urgency="urgent", status="flagged",
                biomarker_hippocampal=0.77, biomarker_amyloid=0.82, biomarker_ventricle=0.58,
                brain_regions_json=json.dumps(scan2_regions),
                upload_date=now - datetime.timedelta(days=2),
            ),
            models.Scan(
                scan_id_string="SCN-G7H8I9", patient_id=p3.id,
                filename="mri_03.nii.gz", original_filename="lakshmi_scan.nii.gz",
                model_used="multiclass",
                prediction="MCI", conf_cn=0.12, conf_mci=0.72, conf_ad=0.16,
                risk_score=52.0, urgency="priority", status="pending",
                biomarker_hippocampal=0.39, biomarker_amyloid=0.47, biomarker_ventricle=0.15,
                brain_regions_json=json.dumps(scan3_regions),
                upload_date=now - datetime.timedelta(hours=5),
            ),
        ]

        db.add_all(scans)
        db.commit()
        print("Scans seeded successfully.")
        print(f"\n{'='*50}")
        print("Demo Credentials:")
        print(f"  Doctor: doctor@neuroassist.ai / Demo@2024")
        print(f"  Alt:    dr.smith@neuroassist.com / doctor123")
        print(f"  Patient: meera@demo.com / patient123")
        print(f"{'='*50}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
