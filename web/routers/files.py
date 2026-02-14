from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from src.database.connection import get_db
from src.database.models import User
from src.services import auth_service
from src.services.import_service import ImportService

router = APIRouter(
    prefix="/api/import",
    tags=["import"]
)

import_service = ImportService()

@router.post("/excel")
async def import_excel_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """Import medical records from Excel file."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="仅支持Excel文件 (.xlsx, .xls)")
    
    try:
        contents = await file.read()
        result = import_service.process_excel_import(contents, db, current_user.id)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")
