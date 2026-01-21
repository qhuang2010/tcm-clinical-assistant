import sys
import os
from datetime import datetime, timedelta

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import SessionLocal
from src.services.search_service import get_patients_by_date_range
from src.database.models import MedicalRecord, Patient

def test_search():
    db = SessionLocal()
    try:
        # 1. Check existing record date
        record = db.query(MedicalRecord).first()
        if not record:
            print("No records found in DB.")
            return
            
        print(f"Record in DB: ID={record.id}, VisitDate={record.visit_date} (Type: {type(record.visit_date)})")
        
        # 2. Simulate "Last 30 Days" query
        # End date = Today (2026-01-21)
        # Start date = 30 days ago (2025-12-22)
        end_date_str = datetime.now().strftime("%Y-%m-%d")
        start_date_str = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        print(f"\nSearching range: {start_date_str} to {end_date_str}")
        
        results = get_patients_by_date_range(db, start_date_str=start_date_str, end_date_str=end_date_str)
        
        print(f"Results found: {len(results)}")
        for r in results:
            print(f" - Found Patient: {r['name']} (Last Visit: {r['last_visit']})")

        if len(results) == 0:
            print("\n!!! Search FAILED to find the record.")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_search()
