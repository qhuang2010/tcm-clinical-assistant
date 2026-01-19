from sqlalchemy.orm import Session
from src.database.connection import SessionLocal, engine, Base
from src.database.models import User
from src.services import auth_service
import sys
import os

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def init_admin():
    db = SessionLocal()
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            print("Creating default admin user...")
            new_admin = User(
                username="admin",
                hashed_password=auth_service.get_password_hash("admin-password-123"),
                role="admin",
                is_active=True  # Admin is always active
            )
            db.add(new_admin)
            db.commit()
            print("Admin user created: admin / admin-password-123")
        else:
            # Ensure admin is always active
            if not admin.is_active:
                admin.is_active = True
                db.commit()
                print("Admin user activated.")
            else:
                print("Admin user already exists and is active.")
            
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
