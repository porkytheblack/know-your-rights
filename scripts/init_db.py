import asyncio
import asyncpg
import os

# Database URL from env or default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/labor_rights_db")

async def init_db():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Read schema file
        with open("database/init.sql", "r") as f:
            schema_sql = f.read()
            
        print("Applying schema...")
        await conn.execute(schema_sql)
        print("Schema applied successfully.")
        
        await conn.close()
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    asyncio.run(init_db())
