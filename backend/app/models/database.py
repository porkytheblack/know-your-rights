import asyncpg
from app.config import settings
from typing import Optional

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=1,
                max_size=10
            )
            print("Database connected")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            print("Database disconnected")

    async def get_db(self):
        if not self.pool:
            await self.connect()
        return self.pool

    async def fetch(self, query, *args):
        if not self.pool:
            await self.connect()
        return await self.pool.fetch(query, *args)

    async def fetch_val(self, query, *args):
        if not self.pool:
            await self.connect()
        return await self.pool.fetchval(query, *args)

    async def execute(self, query, *args):
        if not self.pool:
            await self.connect()
        return await self.pool.execute(query, *args)

db = Database()

# Dependency for FastAPI routes
async def get_database_pool():
    if not db.pool:
        await db.connect()
    return db.pool
