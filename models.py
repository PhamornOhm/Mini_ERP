import enum
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger, DateTime, Enum, Float, ForeignKey,
    Integer, String, text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


# ── Enums ────────────────────────────────────────────────────────────────────

class OrderStatus(str, enum.Enum):
    PENDING   = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED   = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


# ── Models ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="Admin", nullable=False)

class Customer(Base):
    __tablename__ = "customers"

    id:   Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    orders: Mapped[list["Order"]] = relationship("Order", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id:    Mapped[int]   = mapped_column(BigInteger, primary_key=True, index=True)
    name:  Mapped[str]   = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    stock:       Mapped["Stock"]           = relationship("Stock", back_populates="product", uselist=False)
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")


class Stock(Base):
    __tablename__ = "stocks"

    product_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    product: Mapped["Product"] = relationship("Product", back_populates="stock")


class Order(Base):
    __tablename__ = "orders"

    id:          Mapped[int]         = mapped_column(BigInteger, primary_key=True, index=True)
    customer_id: Mapped[int]         = mapped_column(BigInteger, ForeignKey("customers.id"), nullable=False)
    status:      Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus), nullable=False, default=OrderStatus.CONFIRMED,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
    )

    customer:    Mapped["Customer"]        = relationship("Customer", back_populates="orders")
    items:       Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order")
    invoice:     Mapped["Invoice"]         = relationship("Invoice", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id:         Mapped[int]   = mapped_column(BigInteger, primary_key=True, index=True)
    order_id:   Mapped[int]   = mapped_column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int]   = mapped_column(BigInteger, ForeignKey("products.id"), nullable=False)
    qty:        Mapped[int]   = mapped_column(Integer, nullable=False)
    price:      Mapped[float] = mapped_column(Float, nullable=False)   # snapshot price at order time

    order:   Mapped["Order"]   = relationship("Order",   back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")


class Invoice(Base):
    __tablename__ = "invoices"

    id:           Mapped[int]      = mapped_column(BigInteger, primary_key=True, index=True)
    order_id:     Mapped[int]      = mapped_column(
        BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False,
    )
    total_amount: Mapped[float]    = mapped_column(Float, nullable=False)
    created_at:   Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
    )

    order: Mapped["Order"] = relationship("Order", back_populates="invoice")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
    )