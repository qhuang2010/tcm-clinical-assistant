from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="practitioner") # 'admin', 'practitioner'
    is_active = Column(Boolean, default=False)  # Default False: requires admin approval
    
    # Extended registration info
    real_name = Column(String, nullable=True)  # 真实姓名
    email = Column(String, nullable=True)  # 邮箱
    phone = Column(String, nullable=True)  # 电话
    organization = Column(String, nullable=True)  # 所属机构/医院
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    records = relationship("MedicalRecord", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    pinyin = Column(String, index=True, nullable=True) # Added pinyin for search
    phone = Column(String, index=True, nullable=True) # Added phone number
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    
    # JSONB Flesh for extensible patient details (e.g., lifestyle, family history)
    info = Column(JSON, nullable=True, server_default='{}')
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    records = relationship("MedicalRecord", back_populates="patient")

class Practitioner(Base):
    __tablename__ = "practitioners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False, default="teacher") # 'doctor' or 'teacher'
    created_at = Column(DateTime, default=datetime.now)

    records = relationship("MedicalRecord", back_populates="practitioner")

class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    practitioner_id = Column(Integer, ForeignKey("practitioners.id"), nullable=True) # Link to doctor/teacher
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Link to system user
    
    visit_date = Column(DateTime, default=datetime.now, index=True)
    
    # Relational Skeleton for common queries
    complaint = Column(Text, nullable=True) # 主诉
    diagnosis = Column(Text, nullable=True) # 诊断 (could be extracted later)
    
    # JSONB Flesh for the core data
    data = Column(JSON, nullable=False, server_default='{}')
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    patient = relationship("Patient", back_populates="records")
    practitioner = relationship("Practitioner", back_populates="records")
    user = relationship("User", back_populates="records")
