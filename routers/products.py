from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Product, Stock
from schemas import ProductCreate, ProductPriceUpdate, StockUpdate
from dependencies import get_current_user

router = APIRouter(prefix="/products", tags=["Products"], dependencies=[Depends(get_current_user)])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate name
    result = await db.execute(select(Product).where(Product.name == payload.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="มีสินค้านี้ในระบบแล้ว")

    new_product = Product(name=payload.name, price=payload.price)
    db.add(new_product)
    await db.flush() # get product ID

    # Create initial stock
    new_stock = Stock(product_id=new_product.id, quantity=payload.initial_stock)
    db.add(new_stock)
    await db.commit()
    
    return {"message": "เพิ่มสินค้าสำเร็จ", "product_id": new_product.id}

@router.patch("/{product_id}/price")
async def update_product_price(product_id: int, payload: ProductPriceUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้า")
    
    product.price = payload.price
    db.add(product)
    await db.commit()
    return {"message": "แก้ไขราคาสำเร็จ"}

@router.patch("/{product_id}/stock")
async def add_product_stock(product_id: int, payload: StockUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stock).where(Stock.product_id == product_id).with_for_update())
    stock = result.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail="ไม่พบสต๊อกสินค้านี้")
    
    stock.quantity += payload.quantity_added
    db.add(stock)
    await db.commit()
    return {"message": "เพิ่มสต๊อกสำเร็จ", "new_quantity": stock.quantity}
