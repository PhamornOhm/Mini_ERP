from sqlalchemy.ext.asyncio import AsyncSession

from models import Invoice

VAT_RATE = 0.07  # 7%


class InvoiceRepository:
    def __init__(self, db: AsyncSession):
        self._db = db

    async def create_invoice(self, order_id: int, subtotal: float) -> Invoice:
        """
        สร้าง Invoice พร้อมคำนวณ VAT 7% อัตโนมัติ
        subtotal = ราคาก่อนภาษี
        vat_amount = subtotal * 0.07
        total_amount = subtotal + vat_amount
        """
        vat_amount   = round(subtotal * VAT_RATE, 2)
        total_amount = round(subtotal + vat_amount, 2)

        invoice = Invoice(
            order_id=order_id,
            subtotal=subtotal,
            vat_rate=VAT_RATE,
            vat_amount=vat_amount,
            total_amount=total_amount,
        )
        self._db.add(invoice)
        await self._db.flush()
        return invoice