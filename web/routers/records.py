import traceback
from fastapi import APIRouter, Depends, HTTPException
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
    db: Session = Depends(get_db)
):
    """
    Get a specific medical record
    """
    record_data = record_service.get_record_by_id(db, record_id)
    if not record_data:
        raise HTTPException(status_code=404, detail="Record not found")
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
    
    # Permission check: non-admin can only delete own records
    if current_user.role != 'admin' and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除他人创建的记录")
        
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
    """
    try:
        return record_service.save_medical_record(db, data.dict(), user_id=current_user.id)
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
    Search for similar medical records based on pulse grid data
    """
    current_grid = data.pulse_grid
    return search_service.search_similar_records(db, current_grid)
