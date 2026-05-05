from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database import get_db
from models import Customer, Product, Order
from dependencies import get_current_user

router = APIRouter(tags=["UI API"])

@router.get("/customers", dependencies=[Depends(get_current_user)])
async def get_customers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer))
    return result.scalars().all()

@router.get("/products", dependencies=[Depends(get_current_user)])
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).options(selectinload(Product.stock)))
    products = result.scalars().all()
    return [{
        "id": p.id,
        "name": p.name,
        "price": p.price,
        "stock": p.stock.quantity if p.stock else 0
    } for p in products]

@router.get("/orders", dependencies=[Depends(get_current_user)])
async def get_orders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Order).options(selectinload(Order.customer), selectinload(Order.invoice))
        .order_by(Order.id.desc())
    )
    orders = result.scalars().all()
    return [{
        "id": o.id,
        "customer_id": o.customer_id,
        "customer_name": o.customer.name if o.customer else "Unknown",
        "total_amount": o.invoice.total_amount if o.invoice else 0,
        "status": o.status.value,
        "date": o.created_at.isoformat()
    } for o in orders]
