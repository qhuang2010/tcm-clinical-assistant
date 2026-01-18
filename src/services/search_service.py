from typing import Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from src.database.models import Patient, MedicalRecord

def get_patients_by_date_range(db: Session, start_date_str: str = None, end_date_str: str = None, single_date_str: str = None) -> List[Dict[str, Any]]:
    """
    Business logic for finding patients within a date range.
    """
    from sqlalchemy import func
    
    # Handle dates and defaults
    if start_date_str and end_date_str:
        start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    elif single_date_str:
        start = datetime.strptime(single_date_str, "%Y-%m-%d").date()
        end = start
    elif start_date_str:
        start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end = start
    elif end_date_str:
        end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        start = end
    else:
        start = datetime.now().date()
        end = start
        
    if start > end:
        start, end = end, start
        
    records = db.query(MedicalRecord).join(Patient).filter(
        func.date(MedicalRecord.visit_date) >= start,
        func.date(MedicalRecord.visit_date) <= end
    ).order_by(MedicalRecord.visit_date.desc()).all()
    
    seen_patients = set()
    result_patients = []
    
    for r in records:
        p = r.patient
        if p.id not in seen_patients:
            seen_patients.add(p.id)
            result_patients.append({
                "id": p.id,
                "name": p.name,
                "gender": p.gender,
                "age": p.age,
                "phone": p.phone,
                "last_visit": r.visit_date.strftime("%Y-%m-%d")
            })
            
    return result_patients

def search_patients(db: Session, query: str) -> List[Dict[str, Any]]:
    if not query:
        return []
    
    patients = db.query(Patient).filter(
        or_(
            Patient.name.ilike(f"%{query}%"),
            Patient.phone.ilike(f"%{query}%"),
            Patient.pinyin.ilike(f"%{query}%")
        )
    ).limit(20).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "gender": p.gender,
            "age": p.age,
            "phone": p.phone,
            "last_visit": p.updated_at.strftime("%Y-%m-%d") if p.updated_at else None
        }
        for p in patients
    ]

def search_similar_records(db: Session, current_grid: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not current_grid:
        return []
        
    candidates = db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc()).limit(100).all()
    results = []
    
    base_positions = [
        "cun-fu", "guan-fu", "chi-fu",
        "cun-zhong", "guan-zhong", "chi-zhong",
        "cun-chen", "guan-chen", "chi-chen"
    ]
    
    has_left = any(current_grid.get(f"left-{p}") for p in base_positions)
    has_right = any(current_grid.get(f"right-{p}") for p in base_positions)
    
    single_hand_mode = (has_left and not has_right) or (has_right and not has_left)
    input_hand_prefix = "left-" if (has_left and not has_right) else "right-" if (has_right and not has_left) else None
    
    for record in candidates:
        if not record.data or "pulse_grid" not in record.data:
            continue
            
        candidate_grid = record.data["pulse_grid"]
        
        def calculate_score(prefix_a, prefix_b):
            sc = 0
            m = []
            for pos in base_positions:
                key_a = f"{prefix_a}{pos}"
                key_b = f"{prefix_b}{pos}"
                val_a = current_grid.get(key_a, "").strip()
                val_b = candidate_grid.get(key_b, "").strip()
                
                real_val_b = val_b
                if not real_val_b:
                    real_val_b = candidate_grid.get(pos, "").strip()

                if val_a and real_val_b:
                    if val_a == real_val_b:
                        sc += 10
                        m.append(f"{key_a}=={key_b if val_b else pos}")
                    elif val_a in real_val_b or real_val_b in val_a:
                        sc += 5
                        m.append(f"{key_a}~={key_b if val_b else pos}")
            return sc, m

        final_score = 0
        final_matches = []

        if single_hand_mode and input_hand_prefix:
            score_l, matches_l = calculate_score(input_hand_prefix, "left-")
            score_r, matches_r = calculate_score(input_hand_prefix, "right-")
            if score_l >= score_r:
                final_score, final_matches = score_l, matches_l
            else:
                final_score, final_matches = score_r, matches_r
        else:
            score_l, matches_l = calculate_score("left-", "left-")
            score_r, matches_r = calculate_score("right-", "right-")
            score_g, matches_g = calculate_score("", "")
            final_score = score_l + score_r + score_g
            final_matches = matches_l + matches_r + matches_g

        overall1 = current_grid.get("overall_description", "").strip()
        overall2 = candidate_grid.get("overall_description", "").strip()
        if overall1 and overall2:
            overlap = len(set(overall1).intersection(set(overall2)))
            if overlap > 0:
                final_score += overlap * 2
                
        if final_score > 0:
            patient = record.patient
            results.append({
                "record_id": record.id,
                "patient_name": patient.name if patient else "Unknown",
                "visit_date": record.visit_date.strftime("%Y-%m-%d"),
                "score": final_score,
                "pulse_grid": candidate_grid,
                "matches": final_matches,
                "complaint": record.complaint
            })
            
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:5]
