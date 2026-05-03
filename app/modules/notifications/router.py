"""
FlowERP — Notifications Module
================================
GET  /notifications              — paginated list (newest first)
GET  /notifications/unread-count — badge count
POST /notifications/{id}/read    — mark one read
POST /notifications/read-all     — mark all read
POST /notifications              — create (internal use)
DELETE /notifications/{id}       — delete one
"""
import math
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSON
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class Notification(Base):
    __tablename__ = "notifications"
    tenant_id  = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id    = sa.Column(PG_UUID(as_uuid=True), nullable=True, index=True)  # None = all users
    type       = sa.Column(sa.String(50), nullable=False, index=True)
    # info | success | warning | error
    level      = sa.Column(sa.String(20), default="info", nullable=False)
    title      = sa.Column(sa.String(300), nullable=False)
    message    = sa.Column(sa.Text, nullable=True)
    link       = sa.Column(sa.String(300), nullable=True)   # route to navigate to
    is_read    = sa.Column(sa.Boolean, default=False, nullable=False, index=True)
    read_at    = sa.Column(sa.DateTime(timezone=True), nullable=True)
    meta       = sa.Column(JSON, default=dict, nullable=False)


class NotificationCreate(BaseModel):
    type:    str
    level:   str = "info"
    title:   str
    message: Optional[str] = None
    link:    Optional[str] = None
    user_id: Optional[UUID] = None
    meta:    dict = {}


def notif_out(n: Notification) -> dict:
    return {
        "id":         str(n.id),
        "type":       n.type,
        "level":      n.level,
        "title":      n.title,
        "message":    n.message,
        "link":       n.link,
        "is_read":    n.is_read,
        "read_at":    n.read_at.isoformat() if n.read_at else None,
        "meta":       n.meta or {},
        "created_at": n.created_at.isoformat() if n.created_at else "",
    }


@router.get("")
async def list_notifications(
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Notification).where(
        Notification.tenant_id == current_user.tenant_id,
        sa.or_(Notification.user_id == current_user.id, Notification.user_id.is_(None))
    )
    if unread_only:
        q = q.where(Notification.is_read == False)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    items = (await db.execute(q.order_by(Notification.created_at.desc()).offset((page-1)*page_size).limit(page_size))).scalars().all()
    return {
        "items": [notif_out(i) for i in items],
        "total": total,
        "unread": sum(1 for i in items if not i.is_read),
        "page": page,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


@router.get("/unread-count")
async def unread_count(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    count = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == current_user.tenant_id,
            sa.or_(Notification.user_id == current_user.id, Notification.user_id.is_(None)),
            Notification.is_read == False,
        )
    )).scalar_one()
    return {"count": count}


@router.post("/{notif_id}/read")
async def mark_read(notif_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.tenant_id == current_user.tenant_id))
    n = r.scalar_one_or_none()
    if not n: raise HTTPException(404)
    n.is_read = True
    n.read_at = datetime.now(timezone.utc)
    return notif_out(n)


@router.post("/read-all")
async def mark_all_read(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    await db.execute(sa.text(f"""
        UPDATE notifications SET is_read=true, read_at=now()
        WHERE tenant_id='{current_user.tenant_id}'
          AND (user_id='{current_user.id}' OR user_id IS NULL)
          AND is_read=false
    """))
    return {"success": True}


@router.post("", status_code=201)
async def create_notification(payload: NotificationCreate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    n = Notification(tenant_id=current_user.tenant_id, **payload.model_dump())
    db.add(n); await db.flush()
    return notif_out(n)


@router.delete("/{notif_id}")
async def delete_notification(notif_id: UUID, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    r = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.tenant_id == current_user.tenant_id))
    n = r.scalar_one_or_none()
    if not n: raise HTTPException(404)
    await db.delete(n)
    return {"success": True}


# ── Helper for other modules to create notifications ──────────────────
async def push_notification(db: AsyncSession, tenant_id, title: str, message: str = None,
                             type: str = "system", level: str = "info", link: str = None):
    """Call from any module to push a notification to all users in the tenant."""
    n = Notification(tenant_id=tenant_id, type=type, level=level, title=title, message=message, link=link)
    db.add(n)
