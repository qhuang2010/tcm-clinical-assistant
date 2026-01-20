from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database.connection import SessionLocal
from src.database.models import User, Patient, Practitioner

def check_data():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        practitioner_count = db.query(Practitioner).count()
        patient_count = db.query(Patient).count()
        
        print(f"Users: {user_count}")
        print(f"Practitioners: {practitioner_count}")
        print(f"Patients: {patient_count}")
        
        if practitioner_count > 0:
            print("Practitioners found:")
            for p in db.query(Practitioner).all():
                print(f" - {p.name} ({p.role})")
                
    except Exception as e:
        print(f"Error checking data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
