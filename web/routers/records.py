import traceback
import copy
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.services import auth_service, record_service, search_service
from src.database.models import User, MedicalRecord
from web.schemas import RecordData, SimilarSearchInput

router = APIRouter(
    prefix="/api/records",
    tags=["records"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)

@router.get("/{record_id}")
async def get_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Get a specific medical record
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if not auth_service.check_record_permission(db, current_user, record, required="read"):
        raise HTTPException(status_code=403, detail="无权访问该记录")

    record_data = record_service.get_record_by_id(db, record_id)

    # Attach permission info for frontend
    can_edit = auth_service.check_record_permission(db, current_user, record, required="write")
    owner_name = None
    if record.user:
        owner_name = record.user.real_name or record.user.username
    record_data["permissions"] = {
        "can_edit": can_edit,
        "can_delete": can_edit,
        "is_owner": record.user_id == current_user.id,
        "owner_name": owner_name
    }

    return record_data

@router.delete("/{record_id}")
async def delete_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Delete a specific medical record
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Permission check: need write permission to delete
    if not auth_service.check_record_permission(db, current_user, record, required="write"):
        raise HTTPException(status_code=403, detail="无权删除该记录")
        
    db.delete(record)
    db.commit()
    
    return {"status": "success", "message": f"Record {record_id} deleted"}

@router.post("/save")
async def save_record(
    data: RecordData, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Save medical record using Relational Skeleton + JSONB Flesh pattern.
    For updates to existing records, requires write permission.
    """
    try:
        # Check write permission if updating an existing patient's same-day record
        patient_info = data.dict().get("patient_info", {})
        patient_name = patient_info.get("name")
        if patient_name:
            from sqlalchemy import func
            from datetime import date
            from src.database.models import Patient
            patient = db.query(Patient).filter(Patient.name == patient_name).first()
            if patient:
                existing = db.query(MedicalRecord).filter(
                    MedicalRecord.patient_id == patient.id,
                    func.date(MedicalRecord.visit_date) == date.today()
                ).first()
                if existing and not auth_service.check_record_permission(db, current_user, existing, required="write"):
                    raise HTTPException(status_code=403, detail="无权修改该记录")

        return record_service.save_medical_record(db, data.dict(), user_id=current_user.id)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search_similar")
async def search_similar_records(
    data: SimilarSearchInput,
    db: Session = Depends(get_db)
):
    """
    Search for similar medical records based on pulse grid data.
    Uses LLM for semantic vector extraction when available, falls back to keyword matching.
    """
    from src.services.llm_service import llm_service
    current_grid = data.pulse_grid
    return search_service.search_similar_records(db, current_grid, llm_service=llm_service)


@router.post("/precompute-vectors")
async def precompute_vectors(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.check_admin)
):
    """
    Batch precompute LLM pulse vectors for all records that don't have one cached.
    Admin only.
    """
    from src.services.llm_service import llm_service
    updated = search_service.precompute_pulse_vectors(db, llm_service)
    return {"status": "success", "updated": updated}


class AnalysisUpdate(BaseModel):
    ai_analysis: Optional[Dict[str, Any]] = None


@router.patch("/{record_id}/analysis")
async def update_record_analysis(
    record_id: int,
    data: AnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """Save AI analysis result to an existing record."""
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if not auth_service.check_record_permission(db, current_user, record, required="write"):
        raise HTTPException(status_code=403, detail="无权修改该记录")

    new_data = copy.deepcopy(record.data) if record.data else {}
    new_data["ai_analysis"] = data.ai_analysis
    record.data = new_data
    db.commit()

    return {"status": "success", "message": "AI分析结果已保存"}
