import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from src.database.models import User, MedicalRecord, RecordPermission, Patient
from src.database.connection import get_db
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    print("FATAL: SECRET_KEY environment variable is not set. Refusing to start.")
    print("Please set SECRET_KEY in your .env file or environment.")
    sys.exit(1)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 4  # 4 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class TokenData(BaseModel):
    username: Optional[str] = None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def check_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user_data: dict):
    db_user = User(
        username=user_data["username"],
        hashed_password=get_password_hash(user_data["password"]),
        role=user_data.get("role", "practitioner")
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_all_users(db: Session):
    return db.query(User).all()

def update_user_role(db: Session, user_id: int, role: str):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
    return user


def check_patient_permission(db: Session, user: User, patient_id: int, required: str = "read") -> bool:
    """
    Check if user has permission to access a patient's records.
    - admin → always True
    - user created any record for this patient → True (creator)
    - record_permissions table has matching grant → True
    - otherwise → False
    """
    if user.role == "admin":
        return True

    # Check if user is creator of any record for this patient
    creator_record = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient_id,
        MedicalRecord.user_id == user.id
    ).first()
    if creator_record:
        return True

    # Check if user is the patient creator (personal mode)
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient and patient.creator_id == user.id:
        return True

    # Check record_permissions table
    perm_levels = {"read": ["read", "write"], "write": ["write"]}
    allowed = perm_levels.get(required, ["read", "write"])
    grant = db.query(RecordPermission).filter(
        RecordPermission.user_id == user.id,
        RecordPermission.patient_id == patient_id,
        RecordPermission.permission.in_(allowed)
    ).first()
    return grant is not None


def check_record_permission(db: Session, user: User, record: MedicalRecord, required: str = "read") -> bool:
    """
    Check if user has permission on a specific record.
    - admin → always True
    - record.user_id == user.id → True (creator)
    - patient-level permission grant → True
    - otherwise → False
    """
    if user.role == "admin":
        return True
    if record.user_id == user.id:
        return True
    return check_patient_permission(db, user, record.patient_id, required)
