from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from src.database.models import Patient, MedicalRecord
from src.database.connection import SessionLocal, SessionCloud
import logging
import math
import json
import copy

logger = logging.getLogger(__name__)

def _get_cloud_session():
    """Safely get a Cloud DB session, or None if unavailable."""
    if SessionCloud:
        try:
            return SessionCloud()
        except Exception as e:
            logger.warning(f"Could not create cloud session: {e}")
    return None

def _query_patients_by_date(db: Session, start, end, user_id: int = None, source: str = "local") -> List[Dict[str, Any]]:
    """Helper to query patients from a single database session."""
    query = db.query(MedicalRecord).join(Patient).filter(
        func.date(MedicalRecord.visit_date) >= start,
        func.date(MedicalRecord.visit_date) <= end
    )
    
    if user_id is not None:
        query = query.filter(MedicalRecord.user_id == user_id)
    
    records = query.order_by(MedicalRecord.visit_date.desc()).all()
    
    results = []
    for r in records:
        p = r.patient
        if p:
            results.append({
                "uuid": p.uuid,  # Use UUID for deduplication
                "id": p.id,
                "name": p.name,
                "gender": p.gender,
                "age": p.age,
                "phone": p.phone,
                "last_visit": r.visit_date.strftime("%Y-%m-%d"),
                "source": source
            })
    return results

def get_patients_by_date_range(db: Session, start_date_str: str = None, end_date_str: str = None, single_date_str: str = None, user_id: int = None) -> List[Dict[str, Any]]:
    """
    Hybrid query: Find patients from BOTH Local and Cloud databases within a date range.
    Results are merged by UUID. Local records take priority.
    """
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
    
    # 1. Query Local DB (passed in as 'db')
    local_results = _query_patients_by_date(db, start, end, user_id)
    
    # 2. Query Cloud DB (with graceful fallback)
    cloud_results = []
    cloud_db = _get_cloud_session()
    if cloud_db:
        try:
            cloud_results = _query_patients_by_date(cloud_db, start, end, user_id, source="cloud")
        except Exception as e:
            logger.warning(f"Cloud query failed: {e}")
        finally:
            cloud_db.close()
    
    # 3. Merge: Local takes priority, Cloud supplements
    seen_uuids = set()
    merged_results = []
    
    for p in local_results:
        if p["uuid"] not in seen_uuids:
            seen_uuids.add(p["uuid"])
            merged_results.append(p)
    
    for p in cloud_results:
        if p["uuid"] not in seen_uuids:
            seen_uuids.add(p["uuid"])
            merged_results.append(p)
    
    # Sort by last_visit descending
    merged_results.sort(key=lambda x: x["last_visit"], reverse=True)
    
    # Remove internal 'uuid' but keep 'source' for UI
    return [{k: v for k, v in p.items() if k not in ['uuid']} for p in merged_results]


def _query_patients_by_name(db: Session, query_str: str, user_id: int = None, account_type: str = "practitioner", source: str = "local") -> List[Dict[str, Any]]:
    """Helper to search patients from a single database session."""
    # Escape wildcard characters to prevent denial of service via '%%%...'
    safe_query = query_str.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    
    base_filter = or_(
        Patient.name.ilike(f"%{safe_query}%", escape="\\"),
        Patient.phone.ilike(f"%{safe_query}%", escape="\\"),
        Patient.pinyin.ilike(f"%{safe_query}%", escape="\\")
    )
    
    query = db.query(Patient).filter(base_filter)
    
    if user_id is not None:
        if account_type == 'personal':
            # Personal users only see patients they created (owned by them)
            # This allows managing multiple family members
            query = query.filter(Patient.creator_id == user_id)
        else:
            # Practitioners see patients they have interaction with
            patient_ids = db.query(MedicalRecord.patient_id).filter(
                MedicalRecord.user_id == user_id
            ).distinct().subquery()
            query = query.filter(Patient.id.in_(patient_ids))
        
    patients = query.limit(20).all()
    
    return [
        {
            "uuid": p.uuid,
            "id": p.id,
            "name": p.name,
            "gender": p.gender,
            "age": p.age,
            "phone": p.phone,
            "last_visit": p.updated_at.strftime("%Y-%m-%d") if p.updated_at else None,
            "source": source
        }
        for p in patients
    ]

def search_patients(db: Session, query: str, user_id: int = None, account_type: str = "practitioner") -> List[Dict[str, Any]]:
    """
    Hybrid search: Find patients from BOTH Local and Cloud databases by name/phone.
    Results are merged by UUID. Local records take priority.
    """
    if not query:
        return []
    
    # 1. Query Local DB
    local_results = _query_patients_by_name(db, query, user_id, account_type)
    
    # 2. Query Cloud DB
    cloud_results = []
    cloud_db = _get_cloud_session()
    if cloud_db:
        try:
            cloud_results = _query_patients_by_name(cloud_db, query, user_id, account_type, source="cloud")
        except Exception as e:
            logger.warning(f"Cloud search failed: {e}")
        finally:
            cloud_db.close()
    
    # 3. Merge by UUID
    seen_uuids = set()
    merged_results = []
    
    for p in local_results:
        if p["uuid"] not in seen_uuids:
            seen_uuids.add(p["uuid"])
            merged_results.append(p)
    
    for p in cloud_results:
        if p["uuid"] not in seen_uuids:
            seen_uuids.add(p["uuid"])
            merged_results.append(p)
    
    # Return without internal 'uuid' field
    return [{k: v for k, v in p.items() if k != 'uuid'} for p in merged_results[:20]]

# 八纲辨证 keyword → 4D vector mapping: [虚实, 阴阳, 表里, 寒热]
# 虚实: 虚(-1) ↔ 实(+1), 阴阳: 阴(-1) ↔ 阳(+1)
# 表里: 表(-1) ↔ 里(+1), 寒热: 寒(-1) ↔ 热(+1)
PULSE_KEYWORD_VECTORS: Dict[str, List[float]] = {
    "浮": [0, 0.6, -0.8, 0],
    "沉": [0, -0.6, 0.8, 0],
    "迟": [-0.3, -0.4, 0, -0.8],
    "数": [0.3, 0.4, 0, 0.8],
    "滑": [0.4, 0, 0, 0.5],
    "涩": [-0.5, 0, 0, -0.3],
    "弦": [0.3, 0, 0, 0],
    "紧": [0.3, 0, -0.3, -0.7],
    "缓": [-0.3, 0, 0, 0],
    "洪": [0.6, 0.5, 0, 0.7],
    "微": [-0.8, -0.6, 0, -0.5],
    "细": [-0.5, -0.4, 0, -0.2],
    "大": [0.4, 0.3, 0, 0],
    "弱": [-0.6, -0.3, 0, -0.2],
    "短": [-0.4, 0, 0, 0],
    "长": [0.3, 0, 0, 0],
    "空": [-0.8, -0.5, 0, -0.3],
    "窄": [-0.3, -0.3, 0, -0.6],
    "宽": [0.2, 0.2, 0, 0.3],
    "应指": [0.4, 0.3, 0, 0],
    "稍空": [-0.4, -0.3, 0, -0.2],
    "不空": [0.2, 0.1, 0, 0],
    "有力": [0.6, 0.3, 0, 0],
    "无力": [-0.6, -0.3, 0, 0],
    "顶": [0.5, 0.3, 0, 0.4],
}

# Position depth weights: 沉取 reflects true qi, weighted highest
_DEPTH_WEIGHTS = {"chen": 1.5, "zhong": 1.0, "fu": 0.8}
_OVERALL_WEIGHT = 1.2


def _extract_keywords(text: str) -> List[str]:
    """Extract matching pulse keywords from text, longest match first."""
    found = []
    # Sort keywords by length descending so multi-char keywords match first
    sorted_kw = sorted(PULSE_KEYWORD_VECTORS.keys(), key=len, reverse=True)
    remaining = text
    while remaining:
        matched = False
        for kw in sorted_kw:
            if remaining.startswith(kw):
                found.append(kw)
                remaining = remaining[len(kw):]
                matched = True
                break
        if not matched:
            remaining = remaining[1:]
    return found


def _text_to_vector(text: str) -> List[float]:
    """Convert a pulse description text to a 4D 八纲 vector by summing keyword vectors."""
    vec = [0.0, 0.0, 0.0, 0.0]
    keywords = _extract_keywords(text)
    for kw in keywords:
        kw_vec = PULSE_KEYWORD_VECTORS[kw]
        for i in range(4):
            vec[i] += kw_vec[i]
    return vec


def _normalize_vector(vec: List[float]) -> List[float]:
    """Normalize vector to [-1, 1] by dividing by max absolute value."""
    max_abs = max(abs(v) for v in vec) if vec else 0
    if max_abs == 0:
        return [0.0, 0.0, 0.0, 0.0]
    return [v / max_abs for v in vec]


def _grid_to_vector(grid: Dict[str, Any]) -> List[float]:
    """Convert an entire pulse grid to a weighted 4D 八纲 vector."""
    base_positions = [
        "cun-fu", "guan-fu", "chi-fu",
        "cun-zhong", "guan-zhong", "chi-zhong",
        "cun-chen", "guan-chen", "chi-chen",
    ]
    accumulated = [0.0, 0.0, 0.0, 0.0]
    total_weight = 0.0

    for prefix in ("left-", "right-", ""):
        for pos in base_positions:
            key = f"{prefix}{pos}" if prefix else pos
            text = grid.get(key, "")
            if not isinstance(text, str):
                continue
            text = text.strip()
            if not text:
                continue
            # Determine depth weight from position name
            depth = pos.split("-")[-1]  # fu / zhong / chen
            weight = _DEPTH_WEIGHTS.get(depth, 1.0)
            vec = _text_to_vector(text)
            for i in range(4):
                accumulated[i] += vec[i] * weight
            total_weight += weight

    # Overall description
    overall = grid.get("overall_description", "")
    if isinstance(overall, str) and overall.strip():
        vec = _text_to_vector(overall.strip())
        for i in range(4):
            accumulated[i] += vec[i] * _OVERALL_WEIGHT
        total_weight += _OVERALL_WEIGHT

    if total_weight == 0:
        return [0.0, 0.0, 0.0, 0.0]

    # Average by total weight, then normalize
    averaged = [accumulated[i] / total_weight for i in range(4)]
    return _normalize_vector(averaged)


def _format_grid_for_prompt(grid: Dict[str, Any]) -> str:
    """Format pulse grid data into readable text for LLM prompt."""
    lines = []
    for side, prefix in [("左手", "left-"), ("右手", "right-")]:
        side_lines = []
        for pos_name, pos_key in [("寸", "cun"), ("关", "guan"), ("尺", "chi")]:
            for depth_name, depth_key in [("浮取", "fu"), ("中取", "zhong"), ("沉取", "chen")]:
                key = f"{prefix}{pos_key}-{depth_key}"
                text = grid.get(key, "")
                if isinstance(text, str) and text.strip():
                    side_lines.append(f"  {pos_name}{depth_name}: {text.strip()}")
        if side_lines:
            lines.append(f"{side}:")
            lines.extend(side_lines)

    overall = grid.get("overall_description", "")
    if isinstance(overall, str) and overall.strip():
        lines.append(f"整体描述: {overall.strip()}")

    return "\n".join(lines) if lines else ""


_LLM_PULSE_SYSTEM_PROMPT = "你是一位中医脉诊专家。请分析以下九宫格脉象记录，综合判断患者的八纲辨证属性。"

_LLM_PULSE_USER_PROMPT_TEMPLATE = """脉象数据：
{grid_text}

请根据所有位点的脉象描述，输出一个JSON对象，包含四个维度的评分（-1到1之间的小数）：
- xu_shi: 虚(-1)到实(+1)
- yin_yang: 阴(-1)到阳(+1)
- biao_li: 表(-1)到里(+1)
- han_re: 寒(-1)到热(+1)

只输出JSON，不要其他文字。"""


def _llm_grid_to_vector(grid: Dict[str, Any], llm_service) -> Optional[List[float]]:
    """Use LLM to extract a 4D 八纲辨证 vector from pulse grid data.
    Returns None if LLM is unavailable or fails."""
    grid_text = _format_grid_for_prompt(grid)
    if not grid_text:
        return None

    try:
        user_prompt = _LLM_PULSE_USER_PROMPT_TEMPLATE.format(grid_text=grid_text)
        response = llm_service._call_llm(_LLM_PULSE_SYSTEM_PROMPT, user_prompt)

        # Strip markdown code fences if present
        text = response.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        parsed = json.loads(text)
        vec = [
            float(parsed["xu_shi"]),
            float(parsed["yin_yang"]),
            float(parsed["biao_li"]),
            float(parsed["han_re"]),
        ]
        # Clamp to [-1, 1]
        vec = [max(-1.0, min(1.0, v)) for v in vec]
        return vec
    except Exception as e:
        logger.warning(f"LLM pulse vector extraction failed: {e}")
        return None


def _vector_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute similarity between two 4D vectors. Returns 0.0 ~ 1.0."""
    dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(vec_a, vec_b)))
    max_dist = math.sqrt(4 * (2.0 ** 2))  # 4.0
    return 1.0 - (dist / max_dist)


def search_similar_records(db: Session, current_grid: Dict[str, Any], llm_service=None) -> List[Dict[str, Any]]:
    """
    Search for similar medical records based on 八纲辨证 vector similarity.
    When llm_service is provided, uses LLM to extract semantic vectors from free-text
    pulse descriptions. Falls back to keyword-based vectors when LLM is unavailable.
    Only searches records that have a practitioner (teacher records) for learning reference.
    """
    if not current_grid:
        return []

    # Try LLM vector first, fall back to keyword-based
    current_vec = None
    used_llm = False
    if llm_service:
        current_vec = _llm_grid_to_vector(current_grid, llm_service)
        if current_vec:
            used_llm = True
            logger.info(f"Using LLM vector for current input: {current_vec}")

    if current_vec is None:
        current_vec = _grid_to_vector(current_grid)

    # Skip if input has no meaningful pulse data
    if current_vec == [0.0, 0.0, 0.0, 0.0]:
        return []

    candidates = db.query(MedicalRecord).filter(
        MedicalRecord.practitioner_id.isnot(None)
    ).order_by(MedicalRecord.created_at.desc()).limit(200).all()

    results = []
    # LLM vectors are more precise and spread out, so use a lower threshold
    similarity_threshold = 0.80 if used_llm else 0.90

    for record in candidates:
        if not record.data or "pulse_grid" not in record.data:
            continue

        # Prefer cached LLM vector if available
        candidate_vec = None
        if used_llm and record.data.get("pulse_vector"):
            try:
                candidate_vec = [float(v) for v in record.data["pulse_vector"]]
                if len(candidate_vec) != 4:
                    candidate_vec = None
            except (TypeError, ValueError):
                candidate_vec = None

        if candidate_vec is None:
            candidate_grid = record.data["pulse_grid"]
            candidate_vec = _grid_to_vector(candidate_grid)

        if candidate_vec == [0.0, 0.0, 0.0, 0.0]:
            continue

        similarity = _vector_similarity(current_vec, candidate_vec)
        if similarity >= similarity_threshold:
            patient = record.patient
            results.append({
                "record_id": record.id,
                "patient_name": patient.name if patient else "Unknown",
                "visit_date": record.visit_date.strftime("%Y-%m-%d"),
                "score": round(similarity * 100, 1),
                "similarity": round(similarity, 4),
                "vector": [round(v, 3) for v in candidate_vec],
                "pulse_grid": record.data["pulse_grid"],
                "complaint": record.complaint,
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:5]


def precompute_pulse_vectors(db: Session, llm_service) -> int:
    """Batch compute LLM pulse vectors for records that don't have one cached.
    Returns the number of records updated."""
    records = db.query(MedicalRecord).filter(
        MedicalRecord.practitioner_id.isnot(None)
    ).all()

    updated = 0
    for record in records:
        if not record.data or "pulse_grid" not in record.data:
            continue
        # Skip if already has a cached vector
        if record.data.get("pulse_vector"):
            continue

        vec = _llm_grid_to_vector(record.data["pulse_grid"], llm_service)
        if vec is None:
            continue

        new_data = copy.deepcopy(record.data)
        new_data["pulse_vector"] = [round(v, 4) for v in vec]
        record.data = new_data
        updated += 1

        # Commit in batches of 10 to avoid long transactions
        if updated % 10 == 0:
            db.commit()
            logger.info(f"Precomputed {updated} pulse vectors so far...")

    db.commit()
    logger.info(f"Precomputed pulse vectors for {updated} records total.")
    return updated
