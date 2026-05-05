from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import AuditLog
from dependencies import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit"], dependencies=[Depends(get_current_user)])

@router.get("/{order_id}")
async def get_audit_logs(order_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AuditLog).where(AuditLog.order_id == order_id).order_by(AuditLog.created_at.desc())
    )
    logs = result.scalars().all()
    return [{
        "id": log.id,
        "order_id": log.order_id,
        "action": log.action,
        "username": log.username,
        "date": log.created_at.isoformat()
    } for log in logs]
