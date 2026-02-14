from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.services import auth_service
from src.database.models import User

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

from web.schemas import UserCreate, UserResponse

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth_service.get_user_by_username(db, form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户尚未激活，请等待管理员审核"
        )
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role, 
        "account_type": user.account_type,
        "username": user.username,
        "real_name": user.real_name
    }

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """User self-registration endpoint. New users are inactive by default."""
    # Check if username already exists
    existing = auth_service.get_user_by_username(db, user_in.username)
    if existing:
        raise HTTPException(status_code=400, detail="该用户名已被注册")
    
    # Create user with is_active=False (requires admin approval)
    # For personal users, we might want auto-activation or different flow?
    # Keeping is_active=False for safety for now.
    
    new_user = User(
        username=user_in.username,
        hashed_password=auth_service.get_password_hash(user_in.password),
        role="practitioner",  # Default role, can be upgraded by admin
        account_type=user_in.account_type,
        is_active=False,  # Requires admin approval
        real_name=user_in.real_name,
        email=user_in.email,
        phone=user_in.phone,
        organization=user_in.organization
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(auth_service.get_current_active_user)):
    return current_user
