from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, date
from src.database.models import Patient, MedicalRecord, Practitioner
from pypinyin import lazy_pinyin, Style
import re

def _parse_age(raw) -> int:
    """Extract numeric age from strings like '49岁', '49', 49."""
    if raw is None:
        return None
    s = str(raw).strip()
    m = re.search(r'\d+', s)
    return int(m.group()) if m else None

def save_medical_record(db: Session, data: Dict[str, Any], user_id: int = None) -> Dict[str, Any]:
    """
    Business logic for saving or updating a medical record.
    Uses Relational Skeleton + JSONB Flesh pattern.
    """
    patient_info = data.get("patient_info", {})
    medical_info = data.get("medical_record", {})
    
    # 1. Handle Patient (Find or Create)
    patient_name = patient_info.get("name")
    if not patient_name:
        raise ValueError("Patient name is required")
        
    patient_query = db.query(Patient).filter(Patient.name == patient_name)
    
    if patient_info.get("phone"):
        patient_query = patient_query.filter(Patient.phone == patient_info.get("phone"))
    else:
        # Build filter dynamically to avoid filter(None) undefined behavior
        if patient_info.get("gender"):
            patient_query = patient_query.filter(Patient.gender == patient_info.get("gender"))
        parsed_age = _parse_age(patient_info.get("age"))
        if parsed_age is not None:
            patient_query = patient_query.filter(Patient.age == parsed_age)
        
    patient = patient_query.first()
    
    if not patient:
        pinyin_initials = "".join(lazy_pinyin(patient_name, style=Style.FIRST_LETTER))
        
        # Determine creator linkage
        creator_id = None
        mode = data.get("mode", "personal")
        if mode == "personal" and user_id:
             creator_id = user_id

        patient = Patient(
            name=patient_name,
            gender=patient_info.get("gender"),
            age=_parse_age(patient_info.get("age")),
            phone=patient_info.get("phone"),
            pinyin=pinyin_initials,
            info=patient_info,
            creator_id=creator_id
        )
        db.add(patient)
        db.flush()  # Get ID without committing
    else:
        if patient_info.get("phone") and not patient.phone:
            patient.phone = patient_info.get("phone")
        if not patient.pinyin:
             patient.pinyin = "".join(lazy_pinyin(patient.name, style=Style.FIRST_LETTER))
    
    # 2. Create or Update Medical Record
    today = date.today()
    existing_record = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient.id,
        func.date(MedicalRecord.visit_date) == today
    ).first()
    
    complaint = medical_info.get("complaint")
    diagnosis = medical_info.get("diagnosis", "")
    mode = data.get("mode", "personal")
    teacher_name = data.get("teacher", "")
    practitioner_id = None
    
    if mode == "personal":
        doc = db.query(Practitioner).filter(Practitioner.role == "doctor").first()
        if doc:
            practitioner_id = doc.id
    elif mode == "shadowing":
         if teacher_name:
             teacher = db.query(Practitioner).filter(Practitioner.name == teacher_name, Practitioner.role == "teacher").first()
             if teacher:
                 practitioner_id = teacher.id
    
    record_data = {
        "medical_record": medical_info,
        "pulse_grid": data.get("pulse_grid", {}),
        "raw_input": data,
        "client_info": { 
            "mode": mode,
            "teacher": teacher_name,
            "practitioner_id": practitioner_id,
            "user_id": user_id
        }
    }
    
    if existing_record:
        existing_record.complaint = complaint
        existing_record.diagnosis = diagnosis
        existing_record.data = record_data
        existing_record.practitioner_id = practitioner_id
        existing_record.user_id = user_id # Track who updated it
        existing_record.updated_at = datetime.now()
        record_id = existing_record.id
        message = "Record updated successfully"
    else:
        new_record = MedicalRecord(
            patient_id=patient.id,
            complaint=complaint,
            diagnosis=diagnosis,
            data=record_data,
            practitioner_id=practitioner_id,
            user_id=user_id
        )
        db.add(new_record)
        db.flush() # To get the ID before commit if needed
        record_id = new_record.id
        message = "Record saved successfully"
    
    db.commit()
    return {
        "status": "success", 
        "message": message, 
        "record_id": record_id,
        "patient_id": patient.id,
        "practitioner_id": practitioner_id
    }

def get_patient_history(db: Session, patient_id: int) -> List[Dict[str, Any]]:
    records = db.query(MedicalRecord)\
        .filter(MedicalRecord.patient_id == patient_id)\
        .order_by(MedicalRecord.visit_date.desc())\
        .all()
    return [
        {
            "id": r.id,
            "visit_date": r.visit_date.strftime("%Y-%m-%d"),
            "complaint": r.complaint
        }
        for r in records
    ]

def get_record_by_id(db: Session, record_id: int) -> Dict[str, Any]:
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        return None
        
    response_data = {
        "medical_record": {},
        "pulse_grid": {}
    }
    
    if record.data:
        record_data = record.data
        if "medical_record" in record_data:
            response_data["medical_record"] = record_data["medical_record"]
        if "pulse_grid" in record_data:
            response_data["pulse_grid"] = record_data["pulse_grid"]
            
    return response_data
