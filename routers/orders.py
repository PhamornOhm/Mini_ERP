import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from exceptions import CustomerNotFoundError, InsufficientStockError, ProductNotFoundError
from schemas import CreateOrderRequest, CreateOrderResponse, ErrorResponse
from services import OrderService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["Orders"])


from dependencies import get_current_user

@router.post(
    "",
    response_model=CreateOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
    responses={
        404: {"model": ErrorResponse, "description": "Customer or Product not found"},
        409: {"model": ErrorResponse, "description": "Insufficient stock"},
        422: {"description": "Validation error"},
    },
    summary="Create a new order",
    description=(
        "Creates an order, deducts stock, and generates an invoice atomically. "
        "All steps run inside a single database transaction — any failure rolls back."
    ),
)
async def create_order(
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    username: str = Depends(get_current_user)
) -> CreateOrderResponse:
    service = OrderService(db)

    try:
        result = await service.create_order(payload, username)
    except CustomerNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error while creating order: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later.",
        )

    return CreateOrderResponse(
        order_id=result.order_id,
        invoice_id=result.invoice_id,
        total_amount=result.total_amount,
        order_status=result.order_status,
        subtotal=result.subtotal,
        vat_rate=result.vat_rate,
        vat_amount=result.vat_amount,
    )

from schemas import UpdateOrderStatusRequest

@router.patch("/{order_id}/status", response_model=CreateOrderResponse, dependencies=[Depends(get_current_user)])
async def update_order_status(
    order_id: int, 
    payload: UpdateOrderStatusRequest, 
    db: AsyncSession = Depends(get_db),
    username: str = Depends(get_current_user)
) -> CreateOrderResponse:
    service = OrderService(db)
    try:
        result = await service.update_order_status(order_id, payload.status, username)
        return CreateOrderResponse(
            order_id=result.order_id,
            invoice_id=result.invoice_id,
            total_amount=result.total_amount,
            order_status=result.order_status,
            subtotal=result.subtotal,
            vat_rate=result.vat_rate,
            vat_amount=result.vat_amount,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
