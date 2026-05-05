import asyncio
from sqlalchemy import text
from database import engine

async def alter():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'Admin'"))
            print("Added role column to users")
        except Exception as e:
            print("Already added or error:", e)

if __name__ == "__main__":
    asyncio.run(alter())
