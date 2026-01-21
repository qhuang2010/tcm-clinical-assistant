import sys
import os

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.database.connection import engine, Base
from src.database.models import User, Patient, MedicalRecord, Practitioner

def reset_db():
    print("Warning: This will DROP ALL DATA in the database!")
    confirm = input("Are you sure? (y/n) ")
    if confirm.lower() != 'y':
        print("Cancelled.")
        return

    print("Dropping all tables...")
    try:
        # Drop all tables in reverse order of dependencies if possible, 
        # but drop_all usually handles this or we can force it.
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")
        
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables recreated successfully.")
        
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    # Auto-confirm for non-interactive run if arg provided, else simple run
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        print("Dropping all tables (FORCE)...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped.")
        Base.metadata.create_all(bind=engine)
        print("Tables recreated successfully.")
    else:
        reset_db()
