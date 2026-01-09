import asyncio
import os
import sys
import uuid
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.models.database import db
from app.config import settings

async def main():
    try:
        await db.connect()
        print(f"Connected to {settings.POSTGRES_DB}")

        # 1. Test Queries by Category Aggregation
        print("--- Testing Analytics ---")
        sid = str(uuid.uuid4())
        # Insert a message with category
        await db.execute("INSERT INTO chat_sessions (id, title) VALUES ($1, $2)", sid, "Test Session")
        await db.execute(
            "INSERT INTO messages (id, session_id, role, content, metadata) VALUES ($1, $2, $3, $4, $5)",
            str(uuid.uuid4()), sid, 'user', 'Test union query', json.dumps({"category": "union"})
        )
        
        # Manually run the query from analytics.py
        cat_query = """
            SELECT metadata->>'category' as category, COUNT(*) as count
            FROM messages
            WHERE role = 'user' AND metadata IS NOT NULL
            GROUP BY 1
            ORDER BY count DESC
        """
        rows = await db.fetch(cat_query)
        print("Category Counts:", [dict(r) for r in rows])
        
        # Verify 'union' is present
        union_present = any(r['category'] == 'union' for r in rows)
        if union_present:
            print("✅ Category aggregation working.")
        else:
            print("❌ Category aggregation FAILED.")

        # 2. Test Delete Document
        print("\n--- Testing Document Delete ---")
        doc_id = str(uuid.uuid4())
        await db.execute(
            "INSERT INTO documents (id, title, content, document_type) VALUES ($1, $2, $3, $4)",
            doc_id, "To Be Deleted", "Content", "Policy"
        )
        print(f"Inserted doc {doc_id}")
        
        # Verify it exists
        exists = await db.fetch_val("SELECT 1 FROM documents WHERE id = $1", doc_id)
        if exists:
             print("Document confirmed in DB.")
        
        # Delete it (simulating API logic)
        await db.execute("DELETE FROM documents WHERE id = $1", doc_id)
        
        # Verify gone
        gone = await db.fetch_val("SELECT 1 FROM documents WHERE id = $1", doc_id)
        if not gone:
            print("✅ Document deleted successfully.")
        else:
             print("❌ Document delete FAILED.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
