from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from src.database.connection import get_db
from src.services import auth_service
from src.database.models import User, Patient, MedicalRecord, RecordPermission

router = APIRouter(
    prefix="/api/permissions",
    tags=["permissions"],
    dependencies=[Depends(auth_service.get_current_active_user)]
)


class GrantRequest(BaseModel):
    user_id: int
    patient_id: int
    permission: str = "read"  # 'read' or 'write'


class RevokeRequest(BaseModel):
    user_id: int
    patient_id: int


@router.post("/grant")
async def grant_permission(
    req: GrantRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """Grant a user permission to access a patient's records."""
    if req.permission not in ("read", "write"):
        raise HTTPException(status_code=400, detail="权限类型必须是 read 或 write")

    # Only admin or record creator for this patient can grant
    if current_user.role != "admin":
        has_record = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == req.patient_id,
            MedicalRecord.user_id == current_user.id
        ).first()
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        is_creator = patient and patient.creator_id == current_user.id
        if not has_record and not is_creator:
            raise HTTPException(status_code=403, detail="只有记录创建者或管理员可以授权")

    # Check if grant already exists
    existing = db.query(RecordPermission).filter(
        RecordPermission.user_id == req.user_id,
        RecordPermission.patient_id == req.patient_id
    ).first()

    if existing:
        existing.permission = req.permission
    else:
        grant = RecordPermission(
            user_id=req.user_id,
            patient_id=req.patient_id,
            permission=req.permission,
            granted_by=current_user.id
        )
        db.add(grant)

    db.commit()
    return {"status": "success", "message": "授权成功"}


@router.delete("/revoke")
async def revoke_permission(
    req: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """Revoke a user's permission to access a patient's records."""
    if current_user.role != "admin":
        has_record = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == req.patient_id,
            MedicalRecord.user_id == current_user.id
        ).first()
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        is_creator = patient and patient.creator_id == current_user.id
        if not has_record and not is_creator:
            raise HTTPException(status_code=403, detail="只有记录创建者或管理员可以撤销授权")

    grant = db.query(RecordPermission).filter(
        RecordPermission.user_id == req.user_id,
        RecordPermission.patient_id == req.patient_id
    ).first()

    if not grant:
        raise HTTPException(status_code=404, detail="未找到该授权记录")

    db.delete(grant)
    db.commit()
    return {"status": "success", "message": "授权已撤销"}


@router.get("/patient/{patient_id}")
async def list_patient_permissions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_active_user)
):
    """List all permission grants for a patient."""
    if not auth_service.check_patient_permission(db, current_user, patient_id):
        raise HTTPException(status_code=403, detail="无权查看该患者的授权信息")

    grants = db.query(RecordPermission).filter(
        RecordPermission.patient_id == patient_id
    ).all()

    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "username": g.user.username if g.user else None,
            "real_name": g.user.real_name if g.user else None,
            "permission": g.permission,
            "granted_by": g.granted_by,
            "created_at": g.created_at.isoformat() if g.created_at else None
        }
        for g in grants
    ]
