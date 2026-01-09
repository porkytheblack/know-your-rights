import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.models.database import db
from app.config import settings

async def main():
    try:
        await db.connect()
        print(f"Connected to {settings.POSTGRES_DB}")
        
        # Get columns for documents table
        query = """
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'documents';
        """
        rows = await db.fetch(query)
        print("\n--- Documents Table Schema ---")
        for row in rows:
            print(f"- {row['column_name']} ({row['data_type']})")

        # Also peek at one row if exists
        row = await db.fetch_val("SELECT row_to_json(d) FROM (SELECT * FROM documents LIMIT 1) d")
        if row:
            print(f"\n--- Sample Row ---\n{row}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
