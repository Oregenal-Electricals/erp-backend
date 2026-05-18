"""
app/services/auth_service.py
==============================
Auth + User + Role + RBAC — Service Layer

All business logic lives here.
Routers are thin: they parse HTTP → call service → return result.
"""
from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

import sqlalchemy as sa
from fastapi import HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.core.config import settings
from app.models.user import Department, PermissionAuditLog, Role, User

# ── Constants ──────────────────────────────────────────────────────────────

ALL_MODULES: List[str] = [
    "crm", "sales", "purchase", "inventory", "manufacturing",
    "qc", "accounts", "hr", "reports", "settings",
    "dispatch", "gate", "masters", "finance", "gst",
    "payroll", "maintenance", "costing", "documents",
]

VALID_ACTIONS: Set[str] = {"view", "create", "edit", "delete", "approve", "export"}

SYSTEM_ROLES: Set[str] = {"super_admin", "admin", "store_manager", "iqc_inspector", "gate_guard"}

# ── Serialisers ───────────────────────────────────────────────────────────

def _uo(u: User) -> Dict:
    """User → dict (no password)."""
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "role_id": str(u.role_id) if u.role_id else None,
        "phone": u.phone,
        "avatar_url": u.avatar_url,
        "tenant_id": str(u.tenant_id),
        "department_id": str(u.department_id) if u.department_id else None,
        "is_active": u.is_active,
        "is_email_verified": u.is_email_verified,
        "last_login_at": u.last_login_at,
        "preferences": u.preferences or {},
        "extra_permissions": u.extra_permissions or {},
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
    }


def _ro(r: Role) -> Dict:
    """Role → dict."""
    return {
        "id": str(r.id),
        "name": r.name,
        "slug": r.slug,
        "description": r.description,
        "level": r.level,
        "permissions": r.permissions or {},
        "is_system": r.is_system,
        "tenant_id": str(r.tenant_id),
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _dept(d: Department) -> Dict:
    return {
        "id": str(d.id),
        "name": d.name,
        "code": d.code,
        "parent_id": str(d.parent_id) if d.parent_id else None,
        "head_id": str(d.head_id) if d.head_id else None,
        "is_active": d.is_active,
        "tenant_id": str(d.tenant_id),
    }


# ── Internal helpers ──────────────────────────────────────────────────────

async def _get_role_by_slug(slug: str, tenant_id: UUID, db: AsyncSession) -> Optional[Role]:
    return (await db.execute(
        select(Role).where(Role.slug == slug, Role.tenant_id == tenant_id)
    )).scalar_one_or_none()


async def _get_role_by_id(role_id: UUID, tenant_id: UUID, db: AsyncSession) -> Optional[Role]:
    return (await db.execute(
        select(Role).where(Role.id == role_id, Role.tenant_id == tenant_id)
    )).scalar_one_or_none()


async def _get_user_by_id(user_id: UUID, tenant_id: UUID, db: AsyncSession) -> Optional[User]:
    return (await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    )).scalar_one_or_none()


async def _get_caller_level(caller: User, db: AsyncSession) -> int:
    if caller.role == "super_admin":
        return 100
    if caller.role_id:
        result = (await db.execute(
            select(Role.level).where(Role.id == caller.role_id)
        )).scalar_one_or_none()
        return result or 1
    return 1


async def _get_permissions(user: User, db: AsyncSession) -> Dict:
    """Merge role permissions with user-level overrides."""
    base: Dict = {}
    if user.role_id:
        role = (await db.execute(
            select(Role).where(Role.id == user.role_id)
        )).scalar_one_or_none()
        if role:
            base = dict(role.permissions or {})
    for mod, acts in (user.extra_permissions or {}).items():
        base[mod] = acts
    return base


def _validate_slug(slug: str) -> str:
    slug = slug.lower().strip().replace(" ", "_")
    if not re.match(r"^[a-z][a-z0-9_]{1,49}$", slug):
        raise HTTPException(422, "Slug must be 2-50 chars, letters/digits/underscore, start with letter.")
    return slug


def _validate_permissions(permissions: Dict) -> None:
    """Raise 422 if any action is not in VALID_ACTIONS."""
    bad = []
    for mod, acts in permissions.items():
        for a in acts:
            if a not in VALID_ACTIONS:
                bad.append(f"{mod}.{a}")
    if bad:
        raise HTTPException(422, f"Invalid permission actions: {', '.join(bad)}. Allowed: {', '.join(sorted(VALID_ACTIONS))}")


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(422, "Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(422, "Password must contain at least one uppercase letter.")
    if not re.search(r"[0-9]", password):
        raise HTTPException(422, "Password must contain at least one digit.")


# ── Auth Service ──────────────────────────────────────────────────────────

async def login(
    email: str,
    password: str,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    from app.models.tenant import Tenant

    user = (await db.execute(
        select(User).where(
            sa.func.lower(User.email) == email.lower().strip()
        )
    )).scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password.")

    if not user.is_active:
        raise HTTPException(403, "Account is disabled. Contact your administrator.")

    tenant = (await db.execute(
        select(Tenant).where(Tenant.id == user.tenant_id, Tenant.is_active == True)
    )).scalar_one_or_none()

    if not tenant:
        raise HTTPException(403, "Tenant account is inactive.")

    # Update last login
    await db.execute(
        sa.update(User)
        .where(User.id == user.id)
        .values(last_login_at=datetime.now(timezone.utc).isoformat())
    )

    permissions = await _get_permissions(user, db)

    access_token = create_access_token({"sub": str(user.id), "tenant": str(user.tenant_id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "tenant": str(user.tenant_id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": _uo(user),
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
            "plan": tenant.plan,
            "settings": tenant.settings or {},
            "logo_url": tenant.logo_url,
            "primary_color": tenant.primary_color,
        },
        "permissions": permissions,
    }


async def refresh_tokens(refresh_token: str, db: AsyncSession) -> Dict:
    payload = decode_refresh_token(refresh_token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Invalid refresh token.")

    user = (await db.execute(
        select(User).where(User.id == UUID(user_id), User.is_active == True)
    )).scalar_one_or_none()

    if not user:
        raise HTTPException(401, "User not found or inactive.")

    access_token = create_access_token({"sub": str(user.id), "tenant": str(user.tenant_id)})
    new_refresh = create_refresh_token({"sub": str(user.id), "tenant": str(user.tenant_id)})

    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


async def get_me(user: User, db: AsyncSession) -> Dict:
    permissions = await _get_permissions(user, db)
    return {**_uo(user), "permissions": permissions}


async def change_password(
    user: User,
    current_password: str,
    new_password: str,
    db: AsyncSession,
) -> Dict:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(400, "Current password is incorrect.")
    _validate_password(new_password)
    await db.execute(
        sa.update(User)
        .where(User.id == user.id)
        .values(hashed_password=hash_password(new_password))
    )
    return {"success": True, "message": "Password changed successfully."}


# ── User Service ──────────────────────────────────────────────────────────

async def list_users(
    tenant_id: UUID,
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Dict:
    q = select(User).where(User.tenant_id == tenant_id)
    if search:
        like = f"%{search}%"
        q = q.where(sa.or_(User.name.ilike(like), User.email.ilike(like)))
    if role:
        q = q.where(User.role == role)
    if is_active is not None:
        q = q.where(User.is_active == is_active)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        q.order_by(User.name).offset(offset).limit(page_size)
    )).scalars().all()

    return {
        "items": [_uo(u) for u in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


async def get_user(user_id: UUID, tenant_id: UUID, db: AsyncSession) -> Dict:
    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    return _uo(u)


async def create_user(
    tenant_id: UUID,
    caller: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    """Create a new user. Admin+ only. Cannot assign role at or above own level."""

    # Validate password
    _validate_password(payload["password"])

    # Check role exists and level
    role = await _get_role_by_slug(payload.get("role_slug", "staff"), tenant_id, db)
    if not role:
        raise HTTPException(404, f"Role '{payload.get('role_slug')}' not found.")

    caller_level = await _get_caller_level(caller, db)
    if caller.role != "super_admin" and role.level >= caller_level:
        raise HTTPException(
            403,
            f"Cannot create user with role level {role.level}. Your level: {caller_level}.",
        )

    # Unique email per tenant
    exists = (await db.execute(
        select(User).where(
            sa.func.lower(User.email) == payload["email"].lower().strip(),
            User.tenant_id == tenant_id,
        )
    )).scalar_one_or_none()
    if exists:
        raise HTTPException(409, f"Email '{payload['email']}' already exists in this tenant.")

    u = User(
        tenant_id=tenant_id,
        name=payload["name"].strip(),
        email=payload["email"].lower().strip(),
        hashed_password=hash_password(payload["password"]),
        role=role.slug,
        role_id=role.id,
        phone=payload.get("phone"),
        department_id=payload.get("department_id"),
        is_active=True,
    )
    db.add(u)
    await db.flush()
    await db.refresh(u)

    # Audit
    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="user",
        target_id=u.id,
        action="user_create",
        new_value={"email": u.email, "role": u.role},
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    await db.flush()

    return _uo(u)


async def update_user(
    user_id: UUID,
    tenant_id: UUID,
    caller: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:
    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    if caller.role != "super_admin" and u.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin accounts.")

    updatable = {"name", "phone", "avatar_url", "preferences"}
    for k, v in payload.items():
        if k in updatable and v is not None and hasattr(u, k):
            setattr(u, k, v)

    await db.flush()
    await db.refresh(u)
    return _uo(u)


async def toggle_user_status(
    user_id: UUID,
    tenant_id: UUID,
    caller: User,
    is_active: bool,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    if user_id == caller.id:
        raise HTTPException(400, "Cannot change your own account status.")

    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    if caller.role != "super_admin" and u.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin accounts.")

    u.is_active = is_active
    await db.flush()

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="user",
        target_id=user_id,
        action="user_status_change",
        old_value={"is_active": not is_active},
        new_value={"is_active": is_active},
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    await db.refresh(u)
    return _uo(u)


async def change_user_role(
    user_id: UUID,
    tenant_id: UUID,
    caller: User,
    role_slug: str,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    if caller.role != "super_admin" and u.role == "super_admin":
        raise HTTPException(403, "Cannot reassign Super Admin accounts.")

    new_role = await _get_role_by_slug(role_slug, tenant_id, db)
    if not new_role:
        raise HTTPException(404, f"Role '{role_slug}' not found.")

    caller_level = await _get_caller_level(caller, db)
    if caller.role != "super_admin" and new_role.level >= caller_level:
        raise HTTPException(
            403,
            f"Cannot assign role at level {new_role.level}. Your level: {caller_level}.",
        )

    old_role = u.role
    u.role = new_role.slug
    u.role_id = new_role.id
    await db.flush()

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="user",
        target_id=user_id,
        action="user_role_change",
        old_value={"role": old_role},
        new_value={"role": new_role.slug},
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    await db.refresh(u)
    return _uo(u)


async def update_user_extra_permissions(
    user_id: UUID,
    tenant_id: UUID,
    caller: User,
    permissions: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    _validate_permissions(permissions)

    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    if caller.role != "super_admin" and u.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin permissions.")

    old_perms = u.extra_permissions or {}
    u.extra_permissions = permissions
    await db.flush()

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="user",
        target_id=user_id,
        action="user_permission_change",
        old_value=old_perms,
        new_value=permissions,
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    return {"user_id": str(user_id), "extra_permissions": permissions}


async def delete_user(
    user_id: UUID,
    tenant_id: UUID,
    caller: User,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    if user_id == caller.id:
        raise HTTPException(400, "Cannot delete your own account.")

    u = await _get_user_by_id(user_id, tenant_id, db)
    if not u:
        raise HTTPException(404, "User not found.")
    if caller.role != "super_admin" and u.role == "super_admin":
        raise HTTPException(403, "Cannot delete Super Admin accounts.")

    u.is_active = False
    await db.flush()

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="user",
        target_id=user_id,
        action="user_delete",
        old_value={"email": u.email, "role": u.role},
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    return {"success": True, "message": "User deactivated."}


# ── Role Service ──────────────────────────────────────────────────────────

async def list_roles(tenant_id: UUID, db: AsyncSession) -> Dict:
    rows = (await db.execute(
        select(Role)
        .where(Role.tenant_id == tenant_id)
        .order_by(Role.level.desc(), Role.name)
    )).scalars().all()
    return {"items": [_ro(r) for r in rows], "total": len(rows)}


async def get_role(role_id: UUID, tenant_id: UUID, db: AsyncSession) -> Dict:
    r = await _get_role_by_id(role_id, tenant_id, db)
    if not r:
        raise HTTPException(404, "Role not found.")
    return _ro(r)


async def create_role(
    tenant_id: UUID,
    caller: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    slug = _validate_slug(payload["slug"])
    _validate_permissions(payload.get("permissions", {}))

    caller_level = await _get_caller_level(caller, db)
    level = payload.get("level", 1)
    # Hard cap: levels 90+ reserved for system roles
    if level >= 90:
        raise HTTPException(422, "Role level must be less than 90. Levels 90+ are reserved for system roles.")
    if caller.role != "super_admin" and level >= caller_level:
        raise HTTPException(
            403,
            f"Cannot create role at level {level}. Your level: {caller_level}.",
        )

    existing = (await db.execute(
        select(Role).where(Role.slug == slug, Role.tenant_id == tenant_id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(409, f"Role slug '{slug}' already exists.")

    r = Role(
        tenant_id=tenant_id,
        name=payload["name"],
        slug=slug,
        description=payload.get("description"),
        level=level,
        permissions=payload.get("permissions", {}),
        is_system=False,
    )
    db.add(r)
    await db.flush()
    await db.refresh(r)

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="role",
        target_id=r.id,
        action="role_create",
        new_value={"slug": r.slug, "level": r.level},
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    return _ro(r)


async def update_role(
    role_id: UUID,
    tenant_id: UUID,
    caller: User,
    payload: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    r = await _get_role_by_id(role_id, tenant_id, db)
    if not r:
        raise HTTPException(404, "Role not found.")

    if "level" in payload and payload["level"] is not None:
        caller_level = await _get_caller_level(caller, db)
        if caller.role != "super_admin" and payload["level"] >= caller_level:
            raise HTTPException(403, f"Cannot set role level {payload['level']}. Your level: {caller_level}.")

    if "permissions" in payload and payload["permissions"]:
        _validate_permissions(payload["permissions"])

    old_val = _ro(r)
    for k, v in payload.items():
        if v is not None and hasattr(r, k):
            setattr(r, k, v)

    await db.flush()
    await db.refresh(r)

    log = PermissionAuditLog(
        tenant_id=tenant_id,
        changed_by_id=caller.id,
        target_type="role",
        target_id=role_id,
        action="role_update",
        old_value=old_val,
        new_value=_ro(r),
        ip_address=request.client.host if request and request.client else None,
    )
    db.add(log)
    return _ro(r)


async def delete_role(
    role_id: UUID,
    tenant_id: UUID,
    caller: User,
    db: AsyncSession,
) -> Dict:
    r = await _get_role_by_id(role_id, tenant_id, db)
    if not r:
        raise HTTPException(404, "Role not found.")
    if r.is_system:
        raise HTTPException(400, "Cannot delete system roles.")

    # Check if any users have this role
    count = (await db.execute(
        select(func.count()).where(User.role_id == role_id, User.tenant_id == tenant_id)
    )).scalar_one()
    if count > 0:
        raise HTTPException(400, f"Cannot delete role — {count} user(s) are assigned to it. Reassign them first.")

    await db.execute(sa.delete(Role).where(Role.id == role_id, Role.tenant_id == tenant_id))
    return {"success": True, "message": f"Role '{r.name}' deleted."}


async def update_role_permissions(
    role_id: UUID,
    tenant_id: UUID,
    caller: User,
    permissions: Dict,
    db: AsyncSession,
    request: Optional[Request] = None,
) -> Dict:

    _validate_permissions(permissions)

    r = await _get_role_by_id(role_id, tenant_id, db)
    if not r:
        raise HTTPException(404, "Role not found.")

    old_perms = dict(r.permissions or {})
    r.permissions = permissions

    # Log per-module diffs
    for mod in set(list(old_perms.keys()) + list(permissions.keys())):
        old_a = set(old_perms.get(mod, []))
        new_a = set(permissions.get(mod, []))
        if old_a != new_a:
            log = PermissionAuditLog(
                tenant_id=tenant_id,
                changed_by_id=caller.id,
                target_type="role",
                target_id=role_id,
                action="permission_change",
                module=mod,
                old_value={"actions": sorted(old_a)},
                new_value={"actions": sorted(new_a)},
                ip_address=request.client.host if request and request.client else None,
            )
            db.add(log)

    await db.flush()
    return {"role_id": str(role_id), "slug": r.slug, "permissions": r.permissions}


async def get_role_permissions(role_id: UUID, tenant_id: UUID, db: AsyncSession) -> Dict:
    r = await _get_role_by_id(role_id, tenant_id, db)
    if not r:
        raise HTTPException(404, "Role not found.")
    return {
        "role_id": str(r.id),
        "slug": r.slug,
        "level": r.level,
        "permissions": r.permissions or {},
    }


# ── RBAC Utilities ────────────────────────────────────────────────────────

async def my_permissions(user: User, db: AsyncSession) -> Dict:
    permissions = await _get_permissions(user, db)
    role = await _get_role_by_id(user.role_id, user.tenant_id, db) if user.role_id else None
    return {
        "user_id": str(user.id),
        "role": user.role,
        "role_level": role.level if role else 1,
        "is_super_admin": user.role == "super_admin",
        "permissions": permissions,
    }


async def list_rbac_audit_log(
    tenant_id: UUID,
    db: AsyncSession,
    *,
    page: int = 1,
    page_size: int = 25,
    target_type: Optional[str] = None,
    action: Optional[str] = None,
) -> Dict:

    q = select(PermissionAuditLog).where(PermissionAuditLog.tenant_id == tenant_id)
    if target_type:
        q = q.where(PermissionAuditLog.target_type == target_type)
    if action:
        q = q.where(PermissionAuditLog.action == action)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows = (await db.execute(
        q.order_by(PermissionAuditLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return {
        "items": [
            {
                "id": str(r.id),
                "created_at": r.created_at.isoformat(),
                "target_type": r.target_type,
                "target_id": str(r.target_id),
                "action": r.action,
                "module": r.module,
                "old_value": r.old_value,
                "new_value": r.new_value,
                "changed_by_id": str(r.changed_by_id) if r.changed_by_id else None,
                "ip_address": r.ip_address,
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }


# ── Department Service ────────────────────────────────────────────────────

async def list_departments(tenant_id: UUID, db: AsyncSession) -> List[Dict]:
    rows = (await db.execute(
        select(Department)
        .where(Department.tenant_id == tenant_id, Department.is_active == True)
        .order_by(Department.name)
    )).scalars().all()
    return [_dept(d) for d in rows]


async def create_department(
    tenant_id: UUID,
    caller: User,
    payload: Dict,
    db: AsyncSession,
) -> Dict:
    d = Department(
        tenant_id=tenant_id,
        name=payload["name"].strip(),
        code=payload.get("code"),
        parent_id=payload.get("parent_id"),
        head_id=payload.get("head_id"),
        is_active=True,
    )
    db.add(d)
    await db.flush()
    await db.refresh(d)
    return _dept(d)


async def update_department(
    dept_id: UUID,
    tenant_id: UUID,
    payload: Dict,
    db: AsyncSession,
) -> Dict:
    d = (await db.execute(
        select(Department).where(Department.id == dept_id, Department.tenant_id == tenant_id)
    )).scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Department not found.")
    for k, v in payload.items():
        if v is not None and hasattr(d, k):
            setattr(d, k, v)
    await db.flush()
    await db.refresh(d)
    return _dept(d)


async def delete_department(dept_id: UUID, tenant_id: UUID, db: AsyncSession) -> Dict:
    d = (await db.execute(
        select(Department).where(Department.id == dept_id, Department.tenant_id == tenant_id)
    )).scalar_one_or_none()
    if not d:
        raise HTTPException(404, "Department not found.")
    d.is_active = False
    return {"success": True, "message": f"Department '{d.name}' deactivated."}
