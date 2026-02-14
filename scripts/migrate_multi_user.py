import sys
import os
import sqlite3

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import LOCAL_DATABASE_URL

def migrate():
    print("Starting migration for Multi-User support...")
    
    # Parse SQLite path
    db_path = LOCAL_DATABASE_URL.replace("sqlite:///", "")
    if db_path.startswith("./"):
        db_path = os.path.join(os.getcwd(), db_path[2:])
        
    print(f"Connecting to database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Add account_type to users
        print("Checking users table...")
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "account_type" not in columns:
            print("Adding account_type column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN account_type TEXT DEFAULT 'practitioner' NOT NULL")
        else:
            print("Column account_type already exists in users table.")
            
        # 2. Add creator_id to patients
        print("Checking patients table...")
        cursor.execute("PRAGMA table_info(patients)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "creator_id" not in columns:
            print("Adding creator_id column to patients table...")
            cursor.execute("ALTER TABLE patients ADD COLUMN creator_id INTEGER REFERENCES users(id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_patients_creator_id ON patients(creator_id)")
        else:
            print("Column creator_id already exists in patients table.")

        conn.commit()
        print("Migration completed successfully.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
