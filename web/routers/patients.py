from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.services import auth_service, search_service, record_service
from src.database.models import User, Patient, MedicalRecord

router = APIRouter(
    prefix="/api/patients",
    tags=["patients"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)

@router.get("/search")
async def search_patients(
    query: str = Query(None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Search patients by name or phone number.
    Non-admin users only see their own patients.
    """
    # Admin sees all, others see only their own based on account type
    user_id = None if current_user.role == 'admin' else current_user.id
    return search_service.search_patients(db, query, user_id=user_id, account_type=current_user.account_type)

@router.get("/by_date")
async def get_patients_by_date(
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format"),
    date: str = Query(None, description="Single date in YYYY-MM-DD format (deprecated, use start_date/end_date)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Get patients who had a medical record within a date range.
    Non-admin users only see their own patients.
    """
    try:
        # Admin sees all, others see only their own
        user_id = None if current_user.role == 'admin' else current_user.id
        return search_service.get_patients_by_date_range(db, start_date, end_date, date, user_id=user_id)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@router.get("/{patient_id}/latest_record")
async def get_patient_latest_record(
    patient_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get patient details and their latest medical record
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    latest_record = db.query(MedicalRecord)\
        .filter(MedicalRecord.patient_id == patient_id)\
        .order_by(MedicalRecord.created_at.desc())\
        .first()
        
    response_data = {
        "record_id": latest_record.id if latest_record else None,
        "patient_info": {
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "phone": patient.phone
        },
        "medical_record": {},
        "pulse_grid": {}
    }
    
    if latest_record and latest_record.data:
        record_data = latest_record.data
        if "medical_record" in record_data:
            response_data["medical_record"] = record_data["medical_record"]
        if "pulse_grid" in record_data:
            response_data["pulse_grid"] = record_data["pulse_grid"]
            
    return response_data

@router.get("/{patient_id}/history")
async def get_patient_history(
    patient_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get a list of medical records for a patient
    """
    return record_service.get_patient_history(db, patient_id)
