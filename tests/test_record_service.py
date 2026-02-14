import pytest
from src.services import record_service
from src.database.models import Patient, MedicalRecord, User
from datetime import date

def test_save_medical_record_new_patient(db_session):
    record_data = {
        "patient_info": {
            "name": "张三",
            "gender": "男",
            "age": 30,
            "phone": "13800000001"
        },
        "medical_record": {
            "complaint": "头痛",
            "diagnosis": "外感风寒"
        },
        "pulse_grid": {"cun_left": "浮"},
        "raw_data": {}
    }
    
    result = record_service.save_medical_record(db_session, record_data, user_id=1)
    
    assert result["status"] == "success"
    assert result["patient_id"] is not None
    assert result["record_id"] is not None
    
    # Verify patient created
    patient = db_session.query(Patient).filter(Patient.name == "张三").first()
    assert patient is not None
    assert patient.phone == "13800000001"
    
    # Verify record created
    record = db_session.query(MedicalRecord).filter(MedicalRecord.id == result["record_id"]).first()
    assert record.complaint == "头痛"
    assert record.diagnosis == "外感风寒"
    assert record.data["pulse_grid"] == {"cun_left": "浮"}

def test_save_medical_record_existing_patient(db_session):
    # Create patient first
    p = Patient(name="李四", gender="女", age=25, phone="13900000002")
    db_session.add(p)
    db_session.commit()
    
    record_data = {
        "patient_info": {
            "name": "李四",
            "gender": "女",
            "age": 25,
            "phone": "13900000002"
        },
        "medical_record": {"complaint": "复诊"},
        "pulse_grid": {}
    }
    
    result = record_service.save_medical_record(db_session, record_data, user_id=1)
    
    # Verify used existing patient
    record = db_session.query(MedicalRecord).filter(MedicalRecord.id == result["record_id"]).first()
    assert record.patient_id == p.id
    
def test_save_record_age_filtering_bug_fix(db_session):
    # Test the bug fix where empty age caused issues
    record_data = {
        "patient_info": {
            "name": "王五",
            "gender": "男",
            "age": "", # Empty age
            "phone": "" # Empty phone
        },
        "medical_record": {},
        "pulse_grid": {}
    }
    
    # Should not raise error
    result = record_service.save_medical_record(db_session, record_data, user_id=1)
    assert result["status"] == "success"
    
    patient = db_session.query(Patient).filter(Patient.name == "王五").first()
    assert patient.age is None
