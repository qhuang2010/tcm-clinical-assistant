from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.database.connection import get_db
from src.data_preparation.validator import DataValidator
from web.schemas import ValidateInput

router = APIRouter(
    tags=["system"]
)

validator = DataValidator()

@router.get("/api/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Check database connection status
    """
    try:
        # Execute a simple query to check connection
        db.execute(text("SELECT 1"))
        return {"status": "connected", "database": "online"}
    except Exception as e:
        print(f"Health check failed: {e}")
        return {"status": "disconnected", "error": str(e)}

@router.post("/api/validate")
async def validate_data(input_data: ValidateInput):
    is_valid, errors = validator.validate_data(input_data.dict(), context="web_input")
    return {"valid": is_valid, "errors": errors}
