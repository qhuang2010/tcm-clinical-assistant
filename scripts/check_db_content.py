
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database.connection import SessionLocal
from src.database.models import User, Patient, Practitioner, MedicalRecord

def check_data():
    db = SessionLocal()
    print(f"Connected to DB: {db.get_bind().url}")
    try:
        user_count = db.query(User).count()
        practitioner_count = db.query(Practitioner).count()
        patient_count = db.query(Patient).count()
        record_count = db.query(MedicalRecord).count()
        
        print(f"Users: {user_count}")
        print(f"Practitioners: {practitioner_count}")
        print(f"Patients: {patient_count}")
        print(f"Medical Records: {record_count}")
        
        if record_count > 0:
            print("\nLatest 5 Records:")
            for r in db.query(MedicalRecord).order_by(MedicalRecord.visit_date.desc()).limit(5).all():
                print(f" - {r.visit_date}: Patient {r.patient_id} ({r.complaint})")
                
    except Exception as e:
        print(f"Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
