from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class Notification(Base):
    __tablename__ = "notifications"
    tenant_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = sa.Column(sa.String(300), nullable=False)
    message    = sa.Column(sa.Text, nullable=True)
    link       = sa.Column(sa.String(500), nullable=True)
    type       = sa.Column(sa.String(30), default="info", nullable=False)
    is_read    = sa.Column(sa.Boolean, default=False, nullable=False)

def notif_out(n):
    return {"id": str(n.id), "title": n.title, "message": n.message, "link": n.link, "type": n.type, "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else ""}

@router.get("")
async def list_notifications(limit: int=Query(20, le=50), current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    q=select(Notification).where(Notification.user_id==current_user.id, Notification.tenant_id==current_user.tenant_id).order_by(Notification.created_at.desc()).limit(limit)
    items=(await db.execute(q)).scalars().all()
    return {"items":[notif_out(n) for n in items],"total":len(items)}

@router.get("/unread-count")
async def unread_count(current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    count=(await db.execute(select(func.count()).where(Notification.user_id==current_user.id, Notification.is_read==False))).scalar_one()
    return {"count": count}

@router.put("/{nid}/read")
async def mark_read(nid: UUID, current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    await db.execute(update(Notification).where(Notification.id==nid, Notification.user_id==current_user.id).values(is_read=True))
    return {"success": True}

@router.put("/read-all")
async def mark_all_read(current_user: User=Depends(get_current_active_user), db: AsyncSession=Depends(get_db)):
    await db.execute(update(Notification).where(Notification.user_id==current_user.id, Notification.tenant_id==current_user.tenant_id).values(is_read=True))
    return {"success": True}
