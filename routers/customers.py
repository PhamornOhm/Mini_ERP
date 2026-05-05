from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Customer
from schemas import CustomerCreate
from dependencies import get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"], dependencies=[Depends(get_current_user)])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.name == payload.name))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="ชื่อลูกค้านี้มีอยู่ในระบบแล้ว")
    
    new_customer = Customer(name=payload.name)
    db.add(new_customer)
    await db.commit()
    return {"message": "เพิ่มลูกค้าสำเร็จ", "customer_id": new_customer.id}

@router.patch("/{customer_id}")
async def update_customer(customer_id: int, payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")
    customer.name = payload.name
    db.add(customer)
    await db.commit()
    return {"message": "อัปเดตลูกค้าสำเร็จ"}

@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="ไม่พบลูกค้า")
    
    try:
        await db.delete(customer)
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="ไม่สามารถลบลูกค้าที่มีออเดอร์ในระบบได้")
        
    return {"message": "ลบลูกค้าสำเร็จ"}
