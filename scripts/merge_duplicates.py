import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import func, text
from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord

def merge_duplicates():
    db = SessionLocal()
    try:
        # Find duplicate patients by name
        duplicate_names = db.query(Patient.name, func.count(Patient.id).label('count'))\
            .group_by(Patient.name)\
            .having(func.count(Patient.id) > 1)\
            .all()
        
        print(f"发现 {len(duplicate_names)} 组重复患者")
        
        if not duplicate_names:
            print("没有重复数据需要合并")
            return
        
        merged_count = 0
        for name, count in duplicate_names:
            patients = db.query(Patient).filter(Patient.name == name).order_by(Patient.id).all()
            
            # Keep the first one with most medical records
            primary = max(patients, key=lambda p: db.query(MedicalRecord).filter(MedicalRecord.patient_id == p.id).count())
            duplicates = [p for p in patients if p.id != primary.id]
            
            for dup in duplicates:
                # Move medical records to primary patient
                db.execute(
                    text("UPDATE medical_records SET patient_id = :primary_id, sync_status = 'pending' WHERE patient_id = :dup_id"),
                    {"primary_id": primary.id, "dup_id": dup.id}
                )
                
                # Delete duplicate patient
                db.execute(
                    text("DELETE FROM patients WHERE id = :dup_id"),
                    {"dup_id": dup.id}
                )
                merged_count += 1
                print(f"  合并: {name} (ID:{dup.id} -> ID:{primary.id})")
        
        db.commit()
        print(f"\n已合并 {merged_count} 条重复患者记录")
        
        # Final count
        patient_count = db.query(Patient).count()
        record_count = db.query(MedicalRecord).count()
        print(f"\n最终统计:")
        print(f"  患者总数: {patient_count}")
        print(f"  病历总数: {record_count}")
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    merge_duplicates()
