from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Product


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_id(self, product_id: int) -> Product | None:
        result = await self._db.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()
