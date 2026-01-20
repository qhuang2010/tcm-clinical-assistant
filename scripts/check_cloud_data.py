import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env
load_dotenv()

database_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {database_url}")

try:
    engine = create_engine(database_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT count(*) FROM practitioners"))
        count = result.scalar()
        print(f"Successfully connected! Found {count} practitioners.")
        
        result = conn.execute(text("SELECT name, role FROM practitioners LIMIT 5"))
        print("Sample practitioners:")
        for row in result:
            print(f" - {row[0]} ({row[1]})")
            
except Exception as e:
    print(f"Connection failed: {e}")
