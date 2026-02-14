from fastapi import APIRouter, Depends
from src.services import auth_service, analysis_service
from src.database.connection import get_db
from web.schemas import AnalysisInput

router = APIRouter(
    prefix="/api/analyze",
    tags=["analysis"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)

@router.post("")
async def analyze_record(
    data: AnalysisInput
):
    """
    Advanced Rule-Based Analysis Simulation.
    """
    return analysis_service.analyze_pulse_data(data.dict())

@router.post("/llm/report")
async def generate_health_report(
    data: AnalysisInput,
    current_user = Depends(auth_service.get_current_active_user)
):
    """
    Generate a detailed AI Health Report for a single record.
    """
    from src.services.llm_service import llm_service
    return {"report": llm_service.generate_health_report(data.dict())}

@router.post("/llm/trend")
async def analyze_health_trend(
    patient_id: int,
    db = Depends(get_db), 
    current_user = Depends(auth_service.get_current_active_user)
):
    """
    Analyze health trends for a patient based on history.
    """
    from src.services.llm_service import llm_service
    from src.services import record_service
    
    records = record_service.get_patient_history(db, patient_id)
    if not records:
         return {"report": "No records found for this patient."}
         
    # We need full record data for analysis
    full_records = []
    for r in records[:5]:
        full_data = record_service.get_record_by_id(db, r['id'])
        full_record = {
            'visit_date': r['visit_date'],
            'complaint': r['complaint'],
            'pulse_grid': full_data.get('pulse_grid', {}),
            'diagnosis': full_data.get('medical_record', {}).get('diagnosis')
        }
        full_records.append(full_record)
        
    return {"report": llm_service.analyze_health_trend(full_records)}

class ChatInput(AnalysisInput): # Or create new Pydantic model
    query: str
    patient_id: int

@router.post("/llm/chat")
async def chat_with_data(
    payload: dict, # Using dict to avoid schema issues for now, or define ChatInput
    db = Depends(get_db),
    current_user = Depends(auth_service.get_current_active_user)
):
    """
    RAG Chat with patient's medical records.
    """
    from src.services.llm_service import llm_service
    from src.services import record_service
    
    patient_id = payload.get("patient_id")
    query = payload.get("query")
    
    if not patient_id or not query:
        return {"answer": "Please provide patient_id and query."}
        
    records = record_service.get_patient_history(db, patient_id)
    if not records:
         return {"answer": "No records found for this patient."}
         
    # Fetch full details for context (limit to last 10 for context window)
    context_records = []
    for r in records[:10]:
        full_data = record_service.get_record_by_id(db, r['id'])
        context_record = {
            'visit_date': r['visit_date'],
            'complaint': r['complaint'],
            'diagnosis': full_data.get('medical_record', {}).get('diagnosis'),
            'note': full_data.get('medical_record', {}).get('note'),
            'pulse_grid': full_data.get('pulse_grid', {}) # Optional, might be token heavy
        }
        context_records.append(context_record)
        
    answer = llm_service.chat_with_records(query, context_records)
    return {"answer": answer}
