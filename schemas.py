from pydantic import BaseModel, Field, field_validator


# ── Request ───────────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: int = Field(..., gt=0, description="Product ID")
    qty:        int = Field(..., gt=0, description="Quantity must be ≥ 1")


class CreateOrderRequest(BaseModel):
    customer_id: int             = Field(..., gt=0, description="Customer ID")
    items:       list[OrderItemIn] = Field(..., min_length=1, description="At least one item required")

    @field_validator("items")
    @classmethod
    def no_duplicate_products(cls, items: list[OrderItemIn]) -> list[OrderItemIn]:
        product_ids = [i.product_id for i in items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product_id entries are not allowed in a single order.")
        return items


class UpdateOrderStatusRequest(BaseModel):
    status: str

class ProductCreate(BaseModel):
    name: str = Field(..., description="Product Name")
    price: float = Field(..., gt=0, description="Product Price")
    initial_stock: int = Field(0, ge=0, description="Initial Stock Quantity")

class ProductPriceUpdate(BaseModel):
    price: float = Field(..., gt=0, description="New Price")

class StockUpdate(BaseModel):
    quantity_added: int = Field(..., gt=0, description="Quantity to Add")

class CustomerCreate(BaseModel):
    name: str = Field(..., description="Customer Name")

# ── Response ──────────────────────────────────────────────────────────────────

class CreateOrderResponse(BaseModel):
    order_id:     int
    invoice_id:   int
    total_amount: float
    order_status: str


# ── Error detail ──────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str