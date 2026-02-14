from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import Practitioner
from src.services import auth_service

router = APIRouter(
    prefix="/api/practitioners",
    tags=["practitioners"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)

@router.get("")
async def get_practitioners(
    db: Session = Depends(get_db)
):
    """
    Get all practitioners (teachers and doctors)
    """
    practitioners = db.query(Practitioner).all()
    return [{
        "id": p.id,
        "name": p.name,
        "role": p.role
    } for p in practitioners]
