import sys
import os
# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func
from src.database.connection import SessionLocal
from src.database.models import MedicalRecord, Patient, User
from datetime import datetime

def check_data():
    db = SessionLocal()
    try:
        print(f"Current System Time: {datetime.now()}")
        
        users = db.query(User).all()
        print(f"\nTotal Users: {len(users)}")
        for u in users:
            print(f" - ID: {u.id}, Username: {u.username}, Role: {u.role}")

        records = db.query(MedicalRecord).all()
        print(f"\nTotal Medical Records: {len(records)}")
        
        for r in records:
            p = db.query(Patient).filter(Patient.id == r.patient_id).first()
            p_name = p.name if p else "Unknown"
            print(f" - ID: {r.id}, Patient: {p_name}, UserID: {r.user_id}, VisitDate: {r.visit_date} (Type: {type(r.visit_date)})")
            
            # Test func.date filter behavior
            date_only = db.query(func.date(MedicalRecord.visit_date)).filter(MedicalRecord.id == r.id).scalar()
            print(f"   -> func.date() sees: {date_only}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
