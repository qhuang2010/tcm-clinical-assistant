import sys
import os
from typing import Dict, Any

from fastapi import FastAPI, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import uuid4
import uvicorn
from pypinyin import lazy_pinyin, Style

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_preparation.validator import DataValidator
from src.database.connection import engine, Base, get_db
from src.database.models import Patient, MedicalRecord, Practitioner

# Import Service Layer (Three-Tier Architecture)
from src.services import analysis_service, record_service, search_service

# Create tables if they don't exist
# Note: In production, use Alembic for migrations
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Could not connect to database to create tables. Please ensure PostgreSQL is running. Error: {e}")

app = FastAPI(title="中医脉象九宫格OCR识别系统")

# Mount static files from React build
# Note: Ensure 'npm run build' has been executed in web/frontend
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

# Initialize validator
validator = DataValidator()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    # Serve the React app
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse(content="<h1>Frontend build not found. Please run 'npm run build' in web/frontend</h1>", status_code=404)

@app.post("/api/validate")
async def validate_data(data: Dict[str, Any]):
    is_valid, errors = validator.validate_data(data, context="web_input")
    return {"valid": is_valid, "errors": errors}

@app.get("/api/patients/search")
async def search_patients(
    query: str = Query(None, min_length=1),
    db: Session = Depends(get_db)
):
    """
    Search patients by name or phone number
    """
    return search_service.search_patients(db, query)

@app.get("/api/patients/by_date")
async def get_patients_by_date(
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format"),
    date: str = Query(None, description="Single date in YYYY-MM-DD format (deprecated, use start_date/end_date)"),
    db: Session = Depends(get_db)
):
    """
    Get patients who had a medical record within a date range.
    """
    try:
        return search_service.get_patients_by_date_range(db, start_date, end_date, date)
    except ValueError:
         raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@app.get("/api/patients/{patient_id}/latest_record")
async def get_patient_latest_record(patient_id: int, db: Session = Depends(get_db)):
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

@app.get("/api/practitioners")
async def get_practitioners(db: Session = Depends(get_db)):
    """
    Get all practitioners (teachers and doctors)
    """
    practitioners = db.query(Practitioner).all()
    return [{
        "id": p.id,
        "name": p.name,
        "role": p.role
    } for p in practitioners]

@app.get("/api/patients/{patient_id}/history")
async def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    """
    Get a list of medical records for a patient
    """
    return record_service.get_patient_history(db, patient_id)

@app.get("/api/records/{record_id}")
async def get_record(record_id: int, db: Session = Depends(get_db)):
    """
    Get a specific medical record
    """
    record_data = record_service.get_record_by_id(db, record_id)
    if not record_data:
        raise HTTPException(status_code=404, detail="Record not found")
    return record_data

@app.delete("/api/records/{record_id}")
async def delete_record(record_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific medical record
    """
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    db.delete(record)
    db.commit()
    
    return {"status": "success", "message": f"Record {record_id} deleted"}

from datetime import datetime, date

# ... (imports)

@app.post("/api/records/save")
async def save_record(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Save medical record using Relational Skeleton + JSONB Flesh pattern.
    """
    try:
        return record_service.save_medical_record(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_record(data: Dict[str, Any]):
    """
    Advanced Rule-Based Analysis Simulation based on Shanghan Lun and Zheng Qin'an (Fire Spirit School) logic.
    """
    return analysis_service.analyze_pulse_data(data)

@app.post("/api/records/search_similar")
async def search_similar_records(data: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Search for similar medical records based on pulse grid data
    """
    current_grid = data.get("pulse_grid", {})
    return search_service.search_similar_records(db, current_grid)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
