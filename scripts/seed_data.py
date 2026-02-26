import sys
import os
import random
from datetime import datetime, timedelta

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord, Practitioner

def seed_data():
    db = SessionLocal()
    
    try:
        print("Seeding data...")
        
        # Seed Practitioners (Teachers)
        practitioners_data = ["张仲景", "孙思邈", "李时珍", "叶天士"]
        for p_name in practitioners_data:
            existing = db.query(Practitioner).filter(Practitioner.name == p_name).first()
            if not existing:
                new_p = Practitioner(name=p_name, role="teacher")
                db.add(new_p)
                db.commit() # Commit immediately
                print(f"Added practitioner: {p_name}")

        # Test Data
        patients_data = [
            ("李明", "男", 34, "13800138001", "长期加班，颈椎不适"),
            ("王芳", "女", 28, "13900139002", "月经不调，手脚冰凉"),
            ("张伟", "男", 45, "13700137003", "高血压，经常头晕"),
            ("刘洋", "女", 32, "13600136004", "失眠多梦，入睡困难"),
            ("陈强", "男", 50, "13500135005", "胃痛，消化不良"),
            ("赵静", "女", 41, "13400134006", "更年期综合征，心悸"),
            ("孙杰", "男", 29, "13300133007", "运动损伤，腰痛"),
            ("周红", "女", 36, "13200132008", "偏头痛，压力大"),
            ("吴刚", "男", 55, "13100131009", "糖尿病，口干"),
            ("郑丽", "女", 25, "13000130010", "过敏性鼻炎，打喷嚏")
        ]

        pulse_options = ["浮", "沉", "迟", "数", "滑", "涩", "弦", "紧", "缓", "弱"]
        
        for name, gender, age, phone, complaint in patients_data:
            # Check if patient exists (by phone)
            patient = db.query(Patient).filter(Patient.phone == phone).first()
            if not patient:
                patient = Patient(
                    name=name,
                    gender=gender,
                    age=age,
                    phone=phone,
                    info={"note": "Test data"}
                )
                db.add(patient)
                db.commit()
                db.refresh(patient)
            
            # Create Medical Record
            # Generate random pulse grid using left-/right- prefixes as expected by the frontend PulseGrid component
            pulse_grid = {
                # 左手
                "left-cun-fu": random.choice(pulse_options),
                "left-guan-fu": random.choice(pulse_options),
                "left-chi-fu": random.choice(pulse_options),
                "left-cun-zhong": random.choice(pulse_options),
                "left-guan-zhong": random.choice(pulse_options),
                "left-chi-zhong": random.choice(pulse_options),
                "left-cun-chen": random.choice(pulse_options),
                "left-guan-chen": random.choice(pulse_options),
                "left-chi-chen": random.choice(pulse_options),
                # 右手
                "right-cun-fu": random.choice(pulse_options),
                "right-guan-fu": random.choice(pulse_options),
                "right-chi-fu": random.choice(pulse_options),
                "right-cun-zhong": random.choice(pulse_options),
                "right-guan-zhong": random.choice(pulse_options),
                "right-chi-zhong": random.choice(pulse_options),
                "right-cun-chen": random.choice(pulse_options),
                "right-guan-chen": random.choice(pulse_options),
                "right-chi-chen": random.choice(pulse_options),
                "overall_description": random.choice([
                    "脉整体偏细，寸关略弦", "脉沉迟无力，两尺尤弱",
                    "脉浮数有力，寸关偏滑", "脉弦紧，关部明显",
                    "脉缓弱，中取为主"
                ]),
            }
            
            record_data = {
                "medical_record": {
                    "complaint": complaint,
                    "prescription": "待定",
                    "note": "自动生成的测试数据"
                },
                "pulse_grid": pulse_grid,
                "raw_input": {}
            }
            
            record = MedicalRecord(
                patient_id=patient.id,
                visit_date=datetime.now() - timedelta(days=random.randint(0, 30)),
                complaint=complaint,
                diagnosis="待确诊",
                data=record_data
            )
            db.add(record)
        
        db.commit()
        print("Successfully added 10 test records.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
