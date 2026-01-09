import asyncio
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.models.database import db
from app.config import settings

async def main():
    try:
        await db.connect()
        print(f"Connected to {settings.POSTGRES_DB}")
        
        # Check if metadata column exists in messages
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'messages' AND column_name = 'metadata';
        """
        row = await db.fetch_val(check_query)
        
        if not row:
            print("Adding metadata column to messages table...")
            await db.execute("ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb")
            print("Column added.")
        else:
            print("Metadata column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
