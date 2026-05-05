from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Stock


class StockRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_for_update(self, product_id: int) -> Stock | None:
        """
        SELECT ... FOR UPDATE — acquires a row-level lock so concurrent
        transactions cannot deduct the same stock simultaneously.
        """
        result = await self._db.execute(
            select(Stock)
            .where(Stock.product_id == product_id)
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def deduct(self, stock: Stock, qty: int) -> None:
        """Deduct qty from stock. Caller must have acquired the row lock first."""
        stock.quantity -= qty
        self._db.add(stock)
