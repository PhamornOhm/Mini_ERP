from sqlalchemy.ext.asyncio import AsyncSession

from models import Order, OrderItem, OrderStatus


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_order(self, customer_id: int) -> Order:
        order = Order(customer_id=customer_id, status=OrderStatus.CONFIRMED)
        self._db.add(order)
        await self._db.flush()   # populate order.id without committing
        return order

    async def get_by_id(self, order_id: int) -> Order | None:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        result = await self._db.execute(
            select(Order).options(selectinload(Order.items)).where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def create_order_item(
        self,
        order_id: int,
        product_id: int,
        qty: int,
        price: float,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            qty=qty,
            price=price,
        )
        self._db.add(item)
        await self._db.flush()
        return item
