import os
from sqlalchemy import create_engine, text

# Session Pooler URL (IPv4 compatible)
DATABASE_URL = "postgresql://postgres.lddtpexxziuvqkhejukr:Ucn%3Fch3PCVcF*Wg@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

def test_connection():
    print(f"Testing connection to: {DATABASE_URL}")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Connection successful! Result:", result.scalar())
            return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()
