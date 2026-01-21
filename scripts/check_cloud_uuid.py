import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import SessionCloud
from src.database.models import User, Patient, Practitioner, MedicalRecord
import uuid as uuid_lib

def check_and_fix_uuids():
    db = SessionCloud()
    try:
        models = [
            ("users", User),
            ("patients", Patient),
            ("practitioners", Practitioner),
            ("medical_records", MedicalRecord)
        ]
        
        for name, model in models:
            records = db.query(model).all()
            missing_uuid = 0
            for r in records:
                if not getattr(r, 'uuid', None):
                    missing_uuid += 1
                    r.uuid = str(uuid_lib.uuid4())
            
            print(f"{name}: 总数={len(records)}, 缺少UUID={missing_uuid}")
            
            if missing_uuid > 0:
                db.commit()
                print(f"  -> 已为 {missing_uuid} 条记录生成UUID")
        
        print("\n云端UUID检查完成!")
    except Exception as e:
        print(f"错误: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    check_and_fix_uuids()
