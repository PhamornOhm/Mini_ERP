import logging
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from exceptions import CustomerNotFoundError, InsufficientStockError, ProductNotFoundError
from repositories import (
    CustomerRepository,
    InvoiceRepository,
    OrderRepository,
    ProductRepository,
    StockRepository,
)
from schemas import CreateOrderRequest, CreateOrderResponse

logger = logging.getLogger(__name__)


@dataclass
class OrderResult:
    order_id:     int
    invoice_id:   int
    total_amount: float
    order_status: str


class OrderService:
    def __init__(self, db: AsyncSession):
        self._db         = db
        self._customers  = CustomerRepository(db)
        self._products   = ProductRepository(db)
        self._stocks     = StockRepository(db)
        self._orders     = OrderRepository(db)
        self._invoices   = InvoiceRepository(db)

    async def create_order(self, payload: CreateOrderRequest, username: str) -> OrderResult:
        """
        Execute all order-creation steps inside a single DB transaction.
        Any exception causes an automatic rollback (handled by get_db dependency).
        """
        async with self._db.begin():
            # ── 1. Validate customer ─────────────────────────────────────────
            customer = await self._customers.get_by_id(payload.customer_id)
            if customer is None:
                raise CustomerNotFoundError(payload.customer_id)

            # ── 2. Validate products & check stock (with row locks) ───────────
            line_items: list[dict] = []   # holds (product, qty, unit_price)

            for item in payload.items:
                # a) Product must exist
                product = await self._products.get_by_id(item.product_id)
                if product is None:
                    raise ProductNotFoundError(item.product_id)

                # b) Stock row must exist and be sufficient
                #    SELECT FOR UPDATE prevents concurrent over-selling
                stock = await self._stocks.get_for_update(item.product_id)
                if stock is None or stock.quantity < item.qty:
                    available = stock.quantity if stock else 0
                    raise InsufficientStockError(item.product_id, item.qty, available)

                line_items.append({
                    "product":    product,
                    "stock":      stock,
                    "qty":        item.qty,
                    "unit_price": product.price,
                })

            # ── 3. Deduct stock & trigger email if low ────────────────────────
            from email_service import send_low_stock_email
            for li in line_items:
                await self._stocks.deduct(li["stock"], li["qty"])
                new_qty = li["stock"].quantity - li["qty"]
                if new_qty <= 5:
                    send_low_stock_email(li["product"].name, new_qty)

            # ── 4. Create Order ───────────────────────────────────────────────
            order = await self._orders.create_order(payload.customer_id)

            # ── 5. Create OrderItems & accumulate total ───────────────────────
            total_amount = 0.0
            for li in line_items:
                subtotal = li["unit_price"] * li["qty"]
                total_amount += subtotal
                await self._orders.create_order_item(
                    order_id=order.id,
                    product_id=li["product"].id,
                    qty=li["qty"],
                    price=li["unit_price"],
                )

            total_amount = round(total_amount, 2)

            # ── 6. Create Invoice ─────────────────────────────────────────────
            invoice = await self._invoices.create_invoice(order.id, total_amount)

            # ── 7. Write Audit Log ────────────────────────────────────────────
            from models import AuditLog
            audit_log = AuditLog(order_id=order.id, action="CREATED", username=username)
            self._db.add(audit_log)

            # ── 8. Commit happens automatically on __aexit__ of begin() ───────
            logger.info(
                "Order created: order_id=%s  invoice_id=%s  total=%.2f",
                order.id, invoice.id, total_amount,
            )

        return OrderResult(
            order_id=order.id,
            invoice_id=invoice.id,
            total_amount=total_amount,
            order_status=order.status.value,
        )

    async def update_order_status(self, order_id: int, status: str, username: str) -> OrderResult:
        async with self._db.begin():
            order = await self._orders.get_by_id(order_id)
            if not order:
                raise Exception(f"Order {order_id} not found")
            
            if order.status.value == "CANCELLED":
                raise Exception("Cannot change status of a cancelled order")
                
            if status == "CANCELLED":
                # Return stock
                for item in order.items:
                    stock = await self._stocks.get_for_update(item.product_id)
                    if stock:
                        stock.quantity += item.qty
                        self._db.add(stock)

            from models import OrderStatus, AuditLog
            order.status = OrderStatus(status)
            self._db.add(order)

            # Log audit
            audit_log = AuditLog(order_id=order.id, action=f"STATUS_{status}", username=username)
            self._db.add(audit_log)
            
            # Fetch invoice
            from sqlalchemy import select
            from models import Invoice
            inv = await self._db.execute(select(Invoice).where(Invoice.order_id == order_id))
            invoice = inv.scalar_one_or_none()
            
            return OrderResult(
                order_id=order.id,
                invoice_id=invoice.id if invoice else 0,
                total_amount=invoice.total_amount if invoice else 0.0,
                order_status=order.status.value,
            )
