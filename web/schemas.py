from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ValidateInput(BaseModel):
    data: Dict[str, Any]

class RecordData(BaseModel):
    patient_info: Dict[str, Any]
    medical_record: Dict[str, Any]
    pulse_grid: Dict[str, Any]
    raw_data: Optional[Dict[str, Any]] = None
    imported_from_excel: Optional[bool] = False

class AnalysisInput(BaseModel):
    year_born: Optional[int] = None
    gender: Optional[str] = None
    complaint: Optional[str] = None
    pulse_grid: Dict[str, Any] = {}
    medical_record: Optional[Dict[str, Any]] = None
    patient_info: Optional[Dict[str, Any]] = None
    
class SimilarSearchInput(BaseModel):
    pulse_grid: Dict[str, Any]

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    real_name: Optional[str] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    account_type: str = "practitioner" # 'practitioner' or 'personal'

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str
    
    class Config:
        from_attributes = True
