from sqlalchemy.ext.asyncio import AsyncSession

from models import Invoice


class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_invoice(self, order_id: int, total_amount: float) -> Invoice:
        invoice = Invoice(order_id=order_id, total_amount=total_amount)
        self._db.add(invoice)
        await self._db.flush()
        return invoice
