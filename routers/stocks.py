import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import StockMovementType
from repositories.stock_movement_repo import StockMovementRepository
from repositories.stock_repo import StockRepository
from repositories.product_repo import ProductRepository
from schemas import (
    ErrorResponse,
    StockAdjustRequest,
    StockMovementListResponse,
    StockMovementResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stocks", tags=["Stocks"])


# ── GET /stocks/movements — ดูประวัติสต็อกทั้งหมด ────────────────────────────

@router.get(
    "/movements",
    response_model=StockMovementListResponse,
    summary="ดูประวัติการเคลื่อนไหวสต็อกทั้งหมด",
)
async def get_all_movements(
    limit:  int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> StockMovementListResponse:
    repo = StockMovementRepository(db)
    total, movements = await repo.get_all(limit=limit, offset=offset)

    return StockMovementListResponse(
        total=total,
        items=[
            StockMovementResponse(
                id=m.id,
                product_id=m.product_id,
                product_name=m.product.name,
                movement_type=m.movement_type.value,
                qty=m.qty,
                qty_before=m.qty_before,
                qty_after=m.qty_after,
                order_id=m.order_id,
                note=m.note,
                created_at=m.created_at,
            )
            for m in movements
        ],
    )


# ── GET /stocks/movements/{product_id} — ดูประวัติสต็อกรายสินค้า ─────────────

@router.get(
    "/movements/{product_id}",
    response_model=StockMovementListResponse,
    summary="ดูประวัติการเคลื่อนไหวสต็อกของสินค้า",
)
async def get_movements_by_product(
    product_id: int,
    limit:  int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> StockMovementListResponse:
    repo = StockMovementRepository(db)
    total, movements = await repo.get_by_product(
        product_id=product_id, limit=limit, offset=offset
    )

    return StockMovementListResponse(
        total=total,
        items=[
            StockMovementResponse(
                id=m.id,
                product_id=m.product_id,
                product_name=m.product.name,
                movement_type=m.movement_type.value,
                qty=m.qty,
                qty_before=m.qty_before,
                qty_after=m.qty_after,
                order_id=m.order_id,
                note=m.note,
                created_at=m.created_at,
            )
            for m in movements
        ],
    )


# ── POST /stocks/adjust — ปรับสต็อกด้วยมือ ───────────────────────────────────

@router.post(
    "/adjust",
    summary="ปรับสต็อกด้วยมือ (เติม/ลด)",
    responses={404: {"model": ErrorResponse}},
)
async def adjust_stock(
    payload: StockAdjustRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    async with db.begin():
        product_repo = ProductRepository(db)
        stock_repo   = StockRepository(db)
        history_repo = StockMovementRepository(db)

        # เช็คสินค้า
        product = await product_repo.get_by_id(payload.product_id)
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {payload.product_id} not found")

        # ล็อค row สต็อก
        stock = await stock_repo.get_for_update(payload.product_id)
        if stock is None:
            raise HTTPException(status_code=404, detail=f"Stock for product {payload.product_id} not found")

        # เช็คไม่ให้ติดลบ
        new_qty = stock.quantity + payload.qty
        if new_qty < 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"ไม่สามารถลดสต็อกได้ มีสต็อกอยู่ {stock.quantity} ชิ้น",
            )

        qty_before    = stock.quantity
        stock.quantity = new_qty
        db.add(stock)

        # บันทึกประวัติ
        movement_type = StockMovementType.IN if payload.qty > 0 else StockMovementType.ADJUST
        await history_repo.create(
            product_id=payload.product_id,
            movement_type=movement_type,
            qty=payload.qty,
            qty_before=qty_before,
            qty_after=new_qty,
            note=payload.note or ("เติมสต็อก" if payload.qty > 0 else "ปรับลดสต็อก"),
        )

    return {
        "product_id":   payload.product_id,
        "product_name": product.name,
        "qty_before":   qty_before,
        "qty_after":    new_qty,
        "adjusted":     payload.qty,
    }
