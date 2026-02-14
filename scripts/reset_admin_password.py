import sys
import os

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.database.connection import SessionLocal
from src.database.models import User
from src.services import auth_service

def create_admin():
    db = SessionLocal()
    username = "admin"
    password = "801111"
    role = "admin"
    real_name = "系统管理员"

    try:
        user = db.query(User).filter(User.username == username).first()
        hashed_pwd = auth_service.get_password_hash(password)

        if not user:
            print(f"Creating user {username}...")
            user = User(
                username=username,
                hashed_password=hashed_pwd,
                role=role,
                is_active=True,
                real_name=real_name
            )
            db.add(user)
            print(f"User {username} created successfully.")
        else:
            print(f"Updating user {username}...")
            user.hashed_password = hashed_pwd
            user.role = role
            user.is_active = True
            user.real_name = real_name
            print(f"User {username} updated successfully.")
        
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
