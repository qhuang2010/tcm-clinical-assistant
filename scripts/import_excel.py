"""
Excel门诊日志导入脚本
将门诊日志Excel文件导入到数据库
"""
import pandas as pd
import sys
import os
from datetime import datetime
from typing import Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import SessionLocal
from src.database.models import Patient, MedicalRecord, Practitioner, User


def parse_age(age_str) -> Optional[int]:
    """Parse age from various formats like '45岁', '45', etc."""
    if pd.isna(age_str):
        return None
    age_str = str(age_str).strip()
    # Remove common suffixes
    for suffix in ['岁', '周岁', '月', '天']:
        age_str = age_str.replace(suffix, '')
    try:
        return int(float(age_str))
    except:
        return None


def parse_gender(gender_str) -> str:
    """Normalize gender string to '男' or '女'."""
    if pd.isna(gender_str):
        return '男'
    gender_str = str(gender_str).strip()
    if '女' in gender_str:
        return '女'
    return '男'


def import_excel(file_path: str, user_id: int, dry_run: bool = False):
    """
    Import medical records from Excel file.
    
    Args:
        file_path: Path to the Excel file
        user_id: ID of the user performing the import
        dry_run: If True, don't commit changes, just print what would be done
    """
    print(f"Reading Excel file: {file_path}")
    df = pd.read_excel(file_path)
    print(f"Found {len(df)} records")
    
    db = SessionLocal()
    
    try:
        # Get or create practitioners from the file
        doctors = df['医生'].dropna().unique()
        practitioner_map = {}
        
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
                print(f"  Created practitioner: {doc_name}")
        
        imported = 0
        skipped = 0
        
        for idx, row in df.iterrows():
            # Extract patient info
            patient_name = str(row.get('患者姓名', '')).strip()
            if not patient_name or patient_name == 'nan':
                skipped += 1
                continue
            
            phone = str(row.get('联系电话', '')).strip() if pd.notna(row.get('联系电话')) else None
            gender = parse_gender(row.get('性别'))
            age = parse_age(row.get('年龄'))
            
            # Check if patient exists
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
            
            # Extract visit date
            visit_date = row.get('门诊日期')
            if pd.isna(visit_date):
                visit_date = datetime.now()
            elif isinstance(visit_date, str):
                try:
                    visit_date = datetime.strptime(visit_date, '%Y-%m-%d %H:%M:%S')
                except:
                    visit_date = datetime.now()
            
            # Get practitioner ID
            doctor_name = str(row.get('医生', '')).strip() if pd.notna(row.get('医生')) else None
            practitioner_id = practitioner_map.get(doctor_name) if doctor_name else None
            
            # Extract medical record data
            complaint = str(row.get('主诉', '')).strip() if pd.notna(row.get('主诉')) else ''
            diagnosis = str(row.get('诊断', '')).strip() if pd.notna(row.get('诊断')) else ''
            
            # Build the data JSON
            record_data = {
                'patient_info': {
                    'name': patient_name,
                    'age': str(age) if age else '',
                    'gender': gender,
                    'phone': phone if phone and phone != 'nan' else ''
                },
                'medical_record': {
                    'complaint': complaint,
                    'prescription': str(row.get('处方', '')).strip() if pd.notna(row.get('处方')) else '',
                    'note': str(row.get('医嘱事项', '')).strip() if pd.notna(row.get('医嘱事项')) else ''
                },
                'pulse_grid': {},  # Excel doesn't have pulse data
                'imported_from_excel': True,
                'excel_row': idx + 2,  # +2 for header and 0-index
                'raw_data': {
                    '现病史': str(row.get('现病史', '')) if pd.notna(row.get('现病史')) else '',
                    '既往史': str(row.get('既往史', '')) if pd.notna(row.get('既往史')) else '',
                    '辩证': str(row.get('辩证', '')) if pd.notna(row.get('辩证')) else '',
                    '治法': str(row.get('治法', '')) if pd.notna(row.get('治法')) else '',
                    '望闻切诊': str(row.get('望闻切诊', '')) if pd.notna(row.get('望闻切诊')) else '',
                    '方药': str(row.get('方药', '')) if pd.notna(row.get('方药')) else '',
                }
            }
            
            # Create medical record
            record = MedicalRecord(
                patient_id=patient.id,
                user_id=user_id,
                practitioner_id=practitioner_id,
                visit_date=visit_date,
                complaint=complaint,
                diagnosis=diagnosis,
                data=record_data
            )
            db.add(record)
            imported += 1
            
            if imported % 100 == 0:
                print(f"  Processed {imported} records...")
        
        if dry_run:
            print(f"\n[DRY RUN] Would import {imported} records, skipped {skipped}")
            db.rollback()
        else:
            db.commit()
            print(f"\nSuccessfully imported {imported} records, skipped {skipped}")
        
        return imported, skipped
        
    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Import medical records from Excel')
    parser.add_argument('file', help='Path to Excel file')
    parser.add_argument('--user-id', type=int, default=1, help='User ID for the import')
    parser.add_argument('--dry-run', action='store_true', help='Preview without committing')
    
    args = parser.parse_args()
    
    import_excel(args.file, args.user_id, args.dry_run)
