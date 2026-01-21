import sys
import os
from sqlalchemy import text

# Ensure src is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.connection import get_cloud_db

def migrate_cloud():
    print("Migrating Cloud Database...")
    
    # Get cloud session generator and fetch session
    gen = get_cloud_db()
    try:
        db = next(gen)
    except StopIteration:
        print("Could not get cloud DB session.")
        return

    if not db:
        print("Cloud DB not configured.")
        return

    tables = ['users', 'patients', 'practitioners', 'medical_records']
    
    try:
        for table in tables:
            print(f"Migrating table {table}...")
            # UUID
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS uuid VARCHAR(36)"))
                db.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_uuid ON {table} (uuid)"))
            except Exception as e:
                print(f"Error adding uuid to {table}: {e}")
                db.rollback()

            # Sync Status
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS sync_status VARCHAR DEFAULT 'pending'"))
                db.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_sync_status ON {table} (sync_status)"))
            except Exception as e:
                print(f"Error adding sync_status to {table}: {e}")
                db.rollback()

            # Last Synced At
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP"))
            except Exception as e:
                print(f"Error adding last_synced_at to {table}: {e}")
                db.rollback()

            # Is Deleted
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE"))
                db.execute(text(f"CREATE INDEX IF NOT EXISTS ix_{table}_is_deleted ON {table} (is_deleted)"))
            except Exception as e:
                print(f"Error adding is_deleted to {table}: {e}")
                db.rollback()
                
            db.commit()
            print(f"Table {table} migrated.")

        print("Cloud migration completed.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_cloud()
