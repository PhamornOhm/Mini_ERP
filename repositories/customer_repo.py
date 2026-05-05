from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Customer


class CustomerRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_id(self, customer_id: int) -> Customer | None:
        result = await self._db.execute(
            select(Customer).where(Customer.id == customer_id)
        )
        return result.scalar_one_or_none()
