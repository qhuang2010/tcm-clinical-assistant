from src.database.connection import SessionLocal
from src.database.models import MedicalRecord
from datetime import datetime
from sqlalchemy import func

def inspect_data():
    db = SessionLocal()
    try:
        print("Checking recent MedicalRecords...")
        records = db.query(MedicalRecord).order_by(MedicalRecord.visit_date.desc()).limit(10).all()
        for r in records:
            print(f"ID: {r.id}, PatientID: {r.patient_id}, VisitDate: {r.visit_date}, CreatedAt: {r.created_at}")
            
        print("\nTesting Query Logic (Today)...")
        today = datetime.now().date()
        count = db.query(MedicalRecord).filter(func.date(MedicalRecord.visit_date) == today).count()
        print(f"Records found for today ({today}): {count}")
        
    finally:
        db.close()

if __name__ == "__main__":
    inspect_data()
