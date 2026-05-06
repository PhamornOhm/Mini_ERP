from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from models import StockMovement, StockMovementType


class StockMovementRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create(
        self,
        product_id:    int,
        movement_type: StockMovementType,
        qty:           int,
        qty_before:    int,
        qty_after:     int,
        order_id:      int | None = None,
        note:          str | None = None,
    ) -> StockMovement:
        movement = StockMovement(
            product_id=product_id,
            movement_type=movement_type,
            qty=qty,
            qty_before=qty_before,
            qty_after=qty_after,
            order_id=order_id,
            note=note,
        )
        self._db.add(movement)
        await self._db.flush()
        return movement

    async def get_by_product(
        self,
        product_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[int, list[StockMovement]]:
        """ดูประวัติสต็อกของสินค้าชิ้นนึง"""
        count_result = await self._db.execute(
            select(func.count()).where(StockMovement.product_id == product_id)
        )
        total = count_result.scalar_one()

        result = await self._db.execute(
            select(StockMovement)
            .options(joinedload(StockMovement.product))
            .where(StockMovement.product_id == product_id)
            .order_by(StockMovement.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return total, list(result.scalars().all())

    async def get_all(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[int, list[StockMovement]]:
        """ดูประวัติสต็อกทั้งหมด"""
        count_result = await self._db.execute(select(func.count()).select_from(StockMovement))
        total = count_result.scalar_one()

        result = await self._db.execute(
            select(StockMovement)
            .options(joinedload(StockMovement.product))
            .order_by(StockMovement.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return total, list(result.scalars().all())
