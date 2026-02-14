"""Export patient records to JSON"""
import sys, os, json
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord

db = SessionLocal()
patients = db.query(Patient).filter(Patient.name == '侯伟').all()
if not patients:
    print('未找到患者 侯伟')
    sys.exit(0)

result = []
for p in patients:
    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == p.id
    ).order_by(MedicalRecord.visit_date).all()
    for r in records:
        result.append({
            'patient_name': p.name,
            'gender': p.gender,
            'age': p.age,
            'phone': p.phone,
            'record_id': r.id,
            'visit_date': str(r.visit_date) if r.visit_date else None,
            'complaint': r.complaint,
            'diagnosis': r.diagnosis,
            'data': r.data,
        })

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '侯伟_records.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f'导出 {len(result)} 条记录到 {out_path}')
db.close()
