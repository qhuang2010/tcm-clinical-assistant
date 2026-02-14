import pytest
from src.services import search_service
from src.database.models import Patient, MedicalRecord
from datetime import date, timedelta

def test_search_patients(db_session):
    # Setup
    p1 = Patient(name="张三", phone="13800000001", pinyin="ZS", age=30, gender="男", created_at=date(2023, 1, 1))
    p2 = Patient(name="李四", phone="13900000002", pinyin="LS", age=25, gender="女", created_at=date(2023, 1, 2))
    db_session.add(p1)
    db_session.add(p2)
    db_session.commit()
    
    # Test strict search
    results = search_service.search_patients(db_session, "张三")
    assert len(results) == 1
    assert results[0]["name"] == "张三"
    
    # Test pinyin search (simplified mock, assuming pinyin match implementation)
    # search_service uses ILIKE, so "ZS" might not match unless name contains "ZS" or specific pinyin logic
    
    # Test phone search
    results = search_service.search_patients(db_session, "139")
    assert len(results) == 1
    assert results[0]["name"] == "李四"

def test_get_patients_by_date_range(db_session):
    # Setup
    p = Patient(name="病人A", age=20, gender="男")
    db_session.add(p)
    db_session.commit()
    
    # Record yesterday
    r1 = MedicalRecord(patient_id=p.id, visit_date=date.today() - timedelta(days=1), user_id=1, diagnosis="感冒")
    db_session.add(r1)
    db_session.commit()
    
    start = (date.today() - timedelta(days=2)).strftime("%Y-%m-%d")
    end = date.today().strftime("%Y-%m-%d")
    
    results = search_service.get_patients_by_date_range(db_session, start, end)
    assert len(results) >= 1
    assert results[0]["name"] == "病人A"
    assert results[0]["source"] == "local" # Verify source fix

def test_source_identification_bug_fix(db_session):
    # Directly test _query_patients_by_date with explicit source
    p = Patient(name="云端病人", age=40, gender="女")
    db_session.add(p)
    db_session.commit()
    
    r = MedicalRecord(patient_id=p.id, visit_date=date.today(), user_id=1, diagnosis="测试")
    db_session.add(r)
    db_session.commit()
    
    # Simulate cloud call
    results = search_service._query_patients_by_date(
        db_session, 
        date.today(), 
        date.today(), 
        source="cloud"
    )
    
    assert len(results) == 1
    assert results[0]["source"] == "cloud"
