"""
Database migration script to add new columns to users table.
"""
import sqlite3
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import engine, Base, SessionLocal
from src.database.models import User
from src.services import auth_service

def migrate_db():
    db_path = "sql_app.db"
    
    # First, try to add new columns using ALTER TABLE
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = [col[1] for col in cursor.fetchall()]
    print(f"Existing columns: {existing_cols}")
    
    # Add missing columns
    new_columns = [
        ("real_name", "TEXT"),
        ("email", "TEXT"),
        ("phone", "TEXT"),
        ("organization", "TEXT")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"Added column: {col_name}")
            except sqlite3.OperationalError as e:
                print(f"Could not add column {col_name}: {e}")
    
    conn.commit()
    conn.close()
    
    # Now ensure admin user is active
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            if not admin.is_active:
                admin.is_active = True
                db.commit()
                print("Admin user activated.")
            else:
                print("Admin user already active.")
        else:
            print("Admin user not found. Run init_admin.py first.")
    finally:
        db.close()
    
    print("Migration complete.")

if __name__ == "__main__":
    migrate_db()
