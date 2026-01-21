from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Connection 1: Local Database (Always SQLite for offline support) ---
# Hardcode local DB path to ensure it persists as the primary source of truth
LOCAL_DATABASE_URL = "sqlite:///./sql_app.db"
connect_args_local = {"check_same_thread": False}

local_engine = create_engine(LOCAL_DATABASE_URL, connect_args=connect_args_local)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=local_engine)

# --- Connection 2: Cloud Database (PostgreSQL) ---
# Used only by the Sync Service
CLOUD_DATABASE_URL = os.getenv("DATABASE_URL")
cloud_engine = None
SessionCloud = None

if CLOUD_DATABASE_URL and CLOUD_DATABASE_URL.startswith("postgresql"):
    try:
        cloud_engine = create_engine(
            CLOUD_DATABASE_URL, 
            pool_size=5, 
            max_overflow=10,
            pool_timeout=30
        )
        SessionCloud = sessionmaker(autocommit=False, autoflush=False, bind=cloud_engine)
        print("Cloud database engine configured.")
    except Exception as e:
        print(f"Warning: Failed to configure cloud database engine: {e}")

# Base class for models
Base = declarative_base()

# Default Dependency: Returns LOCAL DB session
# The app primarily interacts with this to ensure offline-first capability
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency for Sync Service: Returns CLOUD DB session
def get_cloud_db():
    if not SessionCloud:
        print("Error: Cloud session not configured. Check DATABASE_URL.")
        yield None
        return
        
    db = SessionCloud()
    try:
        yield db
    finally:
        db.close()
    
# Export engine as default (for legacy code compatibility if any)
engine = local_engine
