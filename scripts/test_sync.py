import sys
import os
import requests
import json
import uuid

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord, User
from src.services.sync_service import SyncService

def test_sync():
    print("=== Testing Sync Service ===")
    
    # 1. Create a "Pending" record locally
    db = SessionLocal()
    try:
        # Create dummy patient
        new_patient = Patient(
            name=f"Test Sync {uuid.uuid4().hex[:4]}",
            gender="男",
            phone="13800000000",
            sync_status="pending"
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        print(f"Created local patient: {new_patient.name} (ID: {new_patient.id}, UUID: {new_patient.uuid}) - Status: {new_patient.sync_status}")
    finally:
        db.close()

    # 2. Check Pending Count via API
    try:
        # Note: We need a valid token to hit the API, or we can use the service directly for this test script.
        # Using Service directly is easier for a script.
        service = SyncService()
        pending_count = service.get_pending_count()
        print(f"Pending count (via Service): {pending_count}")
        
        if pending_count == 0:
            print("Error: Pending count should be > 0")
            return

        # 3. Trigger Sync
        print("Triggering Sync...")
        result = service.sync_up()
        print(f"Sync Result: {json.dumps(result, indent=2)}")
        
        # 4. Verify Local Status changed to 'synced'
        db = SessionLocal()
        p = db.query(Patient).filter(Patient.id == new_patient.id).first()
        print(f"Patient Status after sync: {p.sync_status}")
        
        if p.sync_status == 'synced':
            print("SUCCESS: Record marked as synced.")
        else:
            print(f"FAILURE: Record status is {p.sync_status}.")
            if result['status'] == 'error' and 'Cloud connection unavailable' in result['message']:
                print("(This is expected if Cloud DB is not actually reachable/configured in .env)")

    except Exception as e:
        print(f"Test Exception: {e}")

if __name__ == "__main__":
    test_sync()
