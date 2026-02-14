"""Create admin user script"""
import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database.connection import SessionLocal
from src.database.models import User
from src.services.auth_service import get_password_hash

db = SessionLocal()
try:
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        existing.hashed_password = get_password_hash("hp6457")
        existing.role = "admin"
        existing.is_active = True
        print("Admin user password updated.")
    else:
        admin = User(
            username="admin",
            hashed_password=get_password_hash("hp6457"),
            role="admin",
            is_active=True,
            real_name="管理员",
            account_type="practitioner",
        )
        db.add(admin)
        print("Admin user created.")
    db.commit()
    print("Done!")
finally:
    db.close()
