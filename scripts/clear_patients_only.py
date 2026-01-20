import sys
import os

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord

def clear_patients():
    db = SessionLocal()
    try:
        print("Clearing medical records...")
        db.query(MedicalRecord).delete()
        
        print("Clearing patients...")
        db.query(Patient).delete()
        
        db.commit()
        print("Successfully cleared all patients and medical records.")
        
    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_patients()
