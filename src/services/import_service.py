from datetime import datetime
import re
from io import BytesIO
from typing import Dict, Any, List

import pandas as pd
from sqlalchemy.orm import Session
from src.database.models import Patient, MedicalRecord, Practitioner, User

class ImportService:
    def process_excel_import(self, file_contents: bytes, db: Session, current_user_id: int):
        """
        Process Excel file bytes and import medical records.
        Returns: Dict with status and details.
        """
        try:
            df = pd.read_excel(BytesIO(file_contents))
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")
            
        imported = 0
        skipped = 0
        errors = []
        
        # Build practitioner map
        practitioner_map = {}
        doctors = df['医生'].dropna().unique() if '医生' in df.columns else []
        for doc_name in doctors:
            doc_name = str(doc_name).strip()
            if not doc_name:
                continue
            existing = db.query(Practitioner).filter(Practitioner.name == doc_name).first()
            if existing:
                practitioner_map[doc_name] = existing.id
            else:
                new_prac = Practitioner(name=doc_name, role='teacher')
                db.add(new_prac)
                db.flush()
                practitioner_map[doc_name] = new_prac.id
        
        for idx, row in df.iterrows():
            try:
                # Extract patient info
                patient_name = str(row.get('患者姓名', '')).strip() if '患者姓名' in df.columns else ''
                if not patient_name or patient_name == 'nan':
                    skipped += 1
                    continue
                
                phone = str(row.get('联系电话', '')).strip() if pd.notna(row.get('联系电话', None)) else None
                gender_str = str(row.get('性别', '')).strip() if pd.notna(row.get('性别', None)) else '男'
                gender = '女' if '女' in gender_str else '男'
                
                age = None
                age_val = row.get('年龄', None)
                if pd.notna(age_val):
                    age_str = str(age_val).replace('岁', '').replace('周岁', '').strip()
                    try:
                        age = int(float(age_str))
                    except:
                        pass
                
                # Find or create patient
                patient = db.query(Patient).filter(Patient.name == patient_name).first()
                if not patient:
                    patient = Patient(
                        name=patient_name,
                        phone=phone if phone and phone != 'nan' else None,
                        gender=gender,
                        age=age
                    )
                    db.add(patient)
                    db.flush()
                
                # Parse visit date
                visit_date = row.get('门诊日期', None)
                if pd.isna(visit_date) or visit_date is None:
                    visit_date = datetime.now()
                elif isinstance(visit_date, str):
                    try:
                        visit_date = datetime.strptime(visit_date, '%Y-%m-%d %H:%M:%S')
                    except:
                        try:
                            visit_date = datetime.strptime(visit_date, '%Y-%m-%d')
                        except:
                            visit_date = datetime.now()
                elif hasattr(visit_date, 'to_pydatetime'):
                    # Handle pandas Timestamp
                    visit_date = visit_date.to_pydatetime()
                
                # Get practitioner
                doctor_name = str(row.get('医生', '')).strip() if pd.notna(row.get('医生', None)) else None
                practitioner_id = practitioner_map.get(doctor_name) if doctor_name else None
                
                # Extract record data
                complaint = str(row.get('主诉', '')).strip() if pd.notna(row.get('主诉', None)) else ''
                diagnosis = str(row.get('诊断', '')).strip() if pd.notna(row.get('诊断', None)) else ''
                
                # Extract prescription content
                prescription_raw = str(row.get('处方', '')).strip() if pd.notna(row.get('处方', None)) else ''
                
                # Parse dosage
                total_dosage = '6付'  # Default
                dosage_match = re.search(r'共(\d+)剂', prescription_raw)
                if dosage_match:
                    total_dosage = f"{dosage_match.group(1)}付"
                
                record_data = {
                    'patient_info': {
                        'name': patient_name,
                        'age': str(age) if age else '',
                        'gender': gender,
                        'phone': phone if phone and phone != 'nan' else ''
                    },
                    'medical_record': {
                        'complaint': complaint,
                        'prescription': prescription_raw,
                        'totalDosage': total_dosage,
                        'note': str(row.get('医嘱事项', '')).strip() if pd.notna(row.get('医嘱事项', None)) else ''
                    },
                    'pulse_grid': {},
                    'imported_from_excel': True,
                    'raw_data': {
                        '现病史': str(row.get('现病史', '')) if pd.notna(row.get('现病史', None)) else '',
                        '既往史': str(row.get('既往史', '')) if pd.notna(row.get('既往史', None)) else '',
                        '辩证': str(row.get('辩证', '')) if pd.notna(row.get('辩证', None)) else '',
                        '治法': str(row.get('治法', '')) if pd.notna(row.get('治法', None)) else '',
                        '望闻切诊': str(row.get('望闻切诊', '')) if pd.notna(row.get('望闻切诊', None)) else '',
                        '方药': str(row.get('方药', '')) if pd.notna(row.get('方药', None)) else '',
                    }
                }
                
                record = MedicalRecord(
                    patient_id=patient.id,
                    user_id=current_user_id,
                    practitioner_id=practitioner_id,
                    visit_date=visit_date,
                    complaint=complaint,
                    diagnosis=diagnosis,
                    data=record_data
                )
                db.add(record)
                imported += 1
                
            except Exception as row_err:
                errors.append(f"Row {idx + 2}: {str(row_err)}")
                skipped += 1
        
        db.commit()
        
        return {
            "status": "success",
            "imported": imported,
            "skipped": skipped,
            "errors": errors[:10] if errors else []
        }
