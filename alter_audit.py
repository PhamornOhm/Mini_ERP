import asyncio
from database import AsyncSessionLocal, engine, Base
from models import AuditLog

async def alter():
    async with engine.begin() as conn:
        # Create missing tables safely
        await conn.run_sync(Base.metadata.create_all)
        print("Audit table created.")

if __name__ == "__main__":
    asyncio.run(alter())
