import asyncio
from database import engine
from sqlalchemy import text

async def update_enum():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'SHIPPED'"))
            await conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'DELIVERED'"))
            print("Enum updated successfully.")
        except Exception as e:
            print("Enum might already be updated or error:", e)

if __name__ == "__main__":
    asyncio.run(update_enum())
