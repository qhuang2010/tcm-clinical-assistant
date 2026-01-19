import sys
import os
from typing import Dict, Any

from fastapi import FastAPI, Request, Depends, HTTPException, Query, status
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
from fastapi.security import OAuth2PasswordRequestForm
from src.services import analysis_service, record_service, search_service, auth_service
from src.database.models import Patient, MedicalRecord, Practitioner, User

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

# Auth Endpoints
@app.post("/api/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.get_user_by_username(db, form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户尚未激活，请等待管理员审核"
        )
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "username": user.username,
        "real_name": user.real_name
    }

@app.post("/api/auth/register")
async def register(user_data: Dict[str, Any], db: Session = Depends(get_db)):
    """User self-registration endpoint. New users are inactive by default."""
    username = user_data.get("username")
    password = user_data.get("password")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="用户名和密码为必填项")
    
    # Check if username already exists
    existing = auth_service.get_user_by_username(db, username)
    if existing:
        raise HTTPException(status_code=400, detail="该用户名已被注册")
    
    # Create user with is_active=False (requires admin approval)
    new_user = User(
        username=username,
        hashed_password=auth_service.get_password_hash(password),
        role="practitioner",  # Default role
        is_active=False,  # Requires admin approval
        real_name=user_data.get("real_name"),
        email=user_data.get("email"),
        phone=user_data.get("phone"),
        organization=user_data.get("organization")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "注册成功，请等待管理员审核激活账户", "username": new_user.username}

@app.get("/api/auth/me")
async def read_users_me(current_user: User = Depends(auth_service.get_current_active_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role
    }

# Admin Endpoints
@app.get("/api/admin/users")
async def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    users = auth_service.get_all_users(db)
    return [{
        "id": u.id, 
        "username": u.username, 
        "role": u.role, 
        "is_active": u.is_active,
        "real_name": u.real_name,
        "email": u.email,
        "phone": u.phone,
        "organization": u.organization,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]

@app.put("/api/admin/users/{user_id}/activate")
async def toggle_user_active(
    user_id: int,
    data: Dict[str, bool],
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    """Activate or deactivate a user account."""
    is_active = data.get("is_active", True)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = is_active
    db.commit()
    return {"id": user.id, "username": user.username, "is_active": user.is_active}

@app.post("/api/admin/users")
async def create_new_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    try:
        user = auth_service.create_user(db, user_data)
        return {"id": user.id, "username": user.username}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/admin/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    data: Dict[str, str],
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    new_role = data.get("role")
    if new_role not in ["admin", "practitioner"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = auth_service.update_user_role(db, user_id, new_role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "role": user.role}

@app.post("/api/admin/practitioners")
async def create_practitioner(
    data: Dict[str, str],
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    name = data.get("name")
    role = data.get("role", "teacher")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    existing = db.query(Practitioner).filter(Practitioner.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Practitioner already exists")
    
    new_p = Practitioner(name=name, role=role)
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return {"id": new_p.id, "name": new_p.name, "role": new_p.role}

@app.delete("/api/admin/practitioners/{p_id}")
async def delete_practitioner(
    p_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(auth_service.check_admin)
):
    p = db.query(Practitioner).filter(Practitioner.id == p_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Practitioner not found")
    
    db.delete(p)
    db.commit()
    return {"status": "success"}

# Import Excel Endpoint
from fastapi import UploadFile, File
import pandas as pd
from io import BytesIO
from datetime import datetime

@app.post("/api/import/excel")
async def import_excel_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """Import medical records from Excel file."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="仅支持Excel文件 (.xlsx, .xls)")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        imported = 0
        skipped = 0
        errors = []
        
        # Build practitioner map
        practitioner_map = {}
        doctors = df['医生'].dropna().unique() if '医生' in df.columns else []
        for doc_name in doctors:
            doc_name = str(doc_name).strip()
            if not doc_name:
                continue
            existing = db.query(Practitioner).filter(Practitioner.name == doc_name).first()
            if existing:
                practitioner_map[doc_name] = existing.id
            else:
                new_prac = Practitioner(name=doc_name, role='teacher')
                db.add(new_prac)
                db.flush()
                practitioner_map[doc_name] = new_prac.id
        
        for idx, row in df.iterrows():
            try:
                # Extract patient info
                patient_name = str(row.get('患者姓名', '')).strip() if '患者姓名' in df.columns else ''
                if not patient_name or patient_name == 'nan':
                    skipped += 1
                    continue
                
                phone = str(row.get('联系电话', '')).strip() if pd.notna(row.get('联系电话', None)) else None
                gender_str = str(row.get('性别', '')).strip() if pd.notna(row.get('性别', None)) else '男'
                gender = '女' if '女' in gender_str else '男'
                
                age = None
                age_val = row.get('年龄', None)
                if pd.notna(age_val):
                    age_str = str(age_val).replace('岁', '').replace('周岁', '').strip()
                    try:
                        age = int(float(age_str))
                    except:
                        pass
                
                # Find or create patient
                patient = db.query(Patient).filter(Patient.name == patient_name).first()
                if not patient:
                    patient = Patient(
                        name=patient_name,
                        phone=phone if phone and phone != 'nan' else None,
                        gender=gender,
                        age=age
                    )
                    db.add(patient)
                    db.flush()
                
                # Parse visit date - ensure it's a Python datetime object
                visit_date = row.get('门诊日期', None)
                if pd.isna(visit_date) or visit_date is None:
                    visit_date = datetime.now()
                elif isinstance(visit_date, str):
                    try:
                        visit_date = datetime.strptime(visit_date, '%Y-%m-%d %H:%M:%S')
                    except:
                        try:
                            visit_date = datetime.strptime(visit_date, '%Y-%m-%d')
                        except:
                            visit_date = datetime.now()
                elif hasattr(visit_date, 'to_pydatetime'):
                    # Handle pandas Timestamp
                    visit_date = visit_date.to_pydatetime()
                
                # Get practitioner
                doctor_name = str(row.get('医生', '')).strip() if pd.notna(row.get('医生', None)) else None
                practitioner_id = practitioner_map.get(doctor_name) if doctor_name else None
                
                # Extract record data
                complaint = str(row.get('主诉', '')).strip() if pd.notna(row.get('主诉', None)) else ''
                diagnosis = str(row.get('诊断', '')).strip() if pd.notna(row.get('诊断', None)) else ''
                
                # Extract prescription content
                prescription_raw = str(row.get('处方', '')).strip() if pd.notna(row.get('处方', None)) else ''
                
                # Parse dosage from prescription (e.g., "共6剂", "共12剂")
                import re
                total_dosage = '6付'  # Default
                dosage_match = re.search(r'共(\d+)剂', prescription_raw)
                if dosage_match:
                    total_dosage = f"{dosage_match.group(1)}付"
                
                record_data = {
                    'patient_info': {
                        'name': patient_name,
                        'age': str(age) if age else '',
                        'gender': gender,
                        'phone': phone if phone and phone != 'nan' else ''
                    },
                    'medical_record': {
                        'complaint': complaint,
                        'prescription': prescription_raw,
                        'totalDosage': total_dosage,
                        'note': str(row.get('医嘱事项', '')).strip() if pd.notna(row.get('医嘱事项', None)) else ''
                    },
                    'pulse_grid': {},
                    'imported_from_excel': True,
                    'raw_data': {
                        '现病史': str(row.get('现病史', '')) if pd.notna(row.get('现病史', None)) else '',
                        '既往史': str(row.get('既往史', '')) if pd.notna(row.get('既往史', None)) else '',
                        '辩证': str(row.get('辩证', '')) if pd.notna(row.get('辩证', None)) else '',
                        '治法': str(row.get('治法', '')) if pd.notna(row.get('治法', None)) else '',
                        '望闻切诊': str(row.get('望闻切诊', '')) if pd.notna(row.get('望闻切诊', None)) else '',
                        '方药': str(row.get('方药', '')) if pd.notna(row.get('方药', None)) else '',
                    }
                }
                
                record = MedicalRecord(
                    patient_id=patient.id,
                    user_id=current_user.id,
                    practitioner_id=practitioner_id,
                    visit_date=visit_date,
                    complaint=complaint,
                    diagnosis=diagnosis,
                    data=record_data
                )
                db.add(record)
                imported += 1
                
            except Exception as row_err:
                errors.append(f"Row {idx + 2}: {str(row_err)}")
                skipped += 1
        
        db.commit()
        
        return {
            "status": "success",
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10] if errors else []  # Return first 10 errors
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")

@app.post("/api/validate")
async def validate_data(data: Dict[str, Any]):
    is_valid, errors = validator.validate_data(data, context="web_input")
    return {"valid": is_valid, "errors": errors}

@app.get("/api/patients/search")
async def search_patients(
    query: str = Query(None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Search patients by name or phone number.
    Non-admin users only see their own patients.
    """
    # Admin sees all, others see only their own
    user_id = None if current_user.role == 'admin' else current_user.id
    return search_service.search_patients(db, query, user_id=user_id)

@app.get("/api/patients/by_date")
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

@app.get("/api/patients/{patient_id}/latest_record")
async def get_patient_latest_record(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
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

@app.get("/api/practitioners")
async def get_practitioners(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
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
async def get_patient_history(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Get a list of medical records for a patient
    """
    return record_service.get_patient_history(db, patient_id)

@app.get("/api/records/{record_id}")
async def get_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Get a specific medical record
    """
    record_data = record_service.get_record_by_id(db, record_id)
    if not record_data:
        raise HTTPException(status_code=404, detail="Record not found")
    return record_data

@app.delete("/api/records/{record_id}")
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
        
    db.delete(record)
    db.commit()
    
    return {"status": "success", "message": f"Record {record_id} deleted"}

from datetime import datetime, date

# ... (imports)

@app.post("/api/records/save")
async def save_record(
    data: Dict[str, Any], 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Save medical record using Relational Skeleton + JSONB Flesh pattern.
    """
    try:
        return record_service.save_medical_record(db, data, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_record(
    data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Advanced Rule-Based Analysis Simulation based on Shanghan Lun and Zheng Qin'an (Fire Spirit School) logic.
    """
    return analysis_service.analyze_pulse_data(data)

@app.post("/api/records/search_similar")
async def search_similar_records(
    data: Dict[str, Any], 
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """
    Search for similar medical records based on pulse grid data
    """
    current_grid = data.get("pulse_grid", {})
    return search_service.search_similar_records(db, current_grid)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
