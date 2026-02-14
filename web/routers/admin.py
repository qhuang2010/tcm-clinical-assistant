from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.services import auth_service
from src.database.models import User, Practitioner

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(auth_service.check_admin)]
)

@router.get("/users")
async def list_users(
    db: Session = Depends(get_db)
):
    users = auth_service.get_all_users(db)
    return [{
        "id": u.id, 
        "username": u.username, 
        "role": u.role, 
        "is_active": u.is_active,
        "real_name": u.real_name,
        "email": u.email,
        "phone": u.phone,
        "organization": u.organization,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]

@router.put("/users/{user_id}/activate")
async def toggle_user_active(
    user_id: int,
    data: Dict[str, bool],
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user account."""
    is_active = data.get("is_active", True)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = is_active
    db.commit()
    return {"id": user.id, "username": user.username, "is_active": user.is_active}

@router.post("/users")
async def create_new_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    try:
        user = auth_service.create_user(db, user_data)
        return {"id": user.id, "username": user.username}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}/role")
async def change_user_role(
    user_id: int,
    data: Dict[str, str],
    db: Session = Depends(get_db)
):
    new_role = data.get("role")
    if new_role not in ["admin", "practitioner"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = auth_service.update_user_role(db, user_id, new_role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "role": user.role}

@router.post("/practitioners")
async def create_practitioner(
    data: Dict[str, str],
    db: Session = Depends(get_db)
):
    name = data.get("name")
    role = data.get("role", "teacher")
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    existing = db.query(Practitioner).filter(Practitioner.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Practitioner already exists")
    
    new_p = Practitioner(name=name, role=role)
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return {"id": new_p.id, "name": new_p.name, "role": new_p.role}

@router.delete("/practitioners/{p_id}")
async def delete_practitioner(
    p_id: int,
    db: Session = Depends(get_db)
):
    p = db.query(Practitioner).filter(Practitioner.id == p_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Practitioner not found")
    
    db.delete(p)
    db.commit()
    return {"status": "success"}
