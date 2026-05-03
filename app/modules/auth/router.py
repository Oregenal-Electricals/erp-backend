"""
Oregenal ERP — Auth + RBAC Module
===================================
Auth:
  POST /auth/login
  POST /auth/refresh
  GET  /auth/me
  POST /auth/logout
  POST /auth/forgot-password
  POST /auth/change-password

User Management (Admin+):
  GET    /users/
  POST   /users/
  GET    /users/{user_id}
  PUT    /users/{user_id}
  PATCH  /users/{user_id}/status
  PUT    /users/{user_id}/role
  DELETE /users/{user_id}

Role Management (Admin+):
  GET  /roles/
  POST /roles/
  GET  /roles/{role_id}
  PUT  /roles/{role_id}
  DELETE /roles/{role_id}
  GET  /roles/{role_id}/permissions
  PUT  /roles/{role_id}/permissions

RBAC:
  GET /rbac/my-permissions
  GET /rbac/audit-log

RBAC Rules:
  - super_admin bypasses all checks
  - Admin cannot view/edit super_admin users
  - Users cannot assign a role with level >= their own level
  - is_system roles cannot be deleted
  - Every permission change is written to permission_audit_log
"""
import math
from datetime import timedelta
from typing import List, Optional, Dict, Any, Set
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import select, update, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, Base
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token,
    decode_refresh_token,
)
from app.core.config import settings
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User, Role
from app.models.tenant import Tenant
from app.schemas.auth import (
    LoginRequest, LoginResponse, RefreshTokenRequest, TokenResponse,
    UserOut, ForgotPasswordRequest,
)

# ── Routers ──────────────────────────────────────────────────────────────
router       = APIRouter(prefix="/auth",  tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["User Management"])
roles_router = APIRouter(prefix="/roles", tags=["Role Management"])
rbac_router  = APIRouter(prefix="/rbac",  tags=["RBAC"])


# ── Audit Log Model ──────────────────────────────────────────────────────
class PermissionAuditLog(Base):
    __tablename__ = "permission_audit_log"

    tenant_id     = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    changed_by_id = sa.Column(PG_UUID(as_uuid=True), sa.ForeignKey("users.id",   ondelete="SET NULL"), nullable=True)
    target_type   = sa.Column(sa.String(20),  nullable=False)
    target_id     = sa.Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    action        = sa.Column(sa.String(30),  nullable=False)
    module        = sa.Column(sa.String(50),  nullable=True)
    old_value     = sa.Column(JSONB, nullable=True)
    new_value     = sa.Column(JSONB, nullable=True)
    ip_address    = sa.Column(sa.String(45),  nullable=True)
    notes         = sa.Column(sa.Text,        nullable=True)


# ── Pydantic Schemas ─────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name:          str
    email:         EmailStr
    password:      str
    role_slug:     str = "staff"
    phone:         Optional[str]  = None
    department_id: Optional[UUID] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    name:          Optional[str]  = None
    phone:         Optional[str]  = None
    department_id: Optional[UUID] = None
    preferences:   Optional[dict] = None
    avatar_url:    Optional[str]  = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role_slug: str


class RoleCreate(BaseModel):
    name:        str
    slug:        str
    description: Optional[str] = None
    level:       int = 1
    permissions: dict = {}

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        import re
        v = v.lower().strip().replace(" ", "_")
        if not re.match(r"^[a-z][a-z0-9_]{1,49}$", v):
            raise ValueError("Slug: 2-50 chars, letters/digits/underscore, must start with letter")
        return v

    @field_validator("level")
    @classmethod
    def level_range(cls, v: int) -> int:
        if not (1 <= v <= 89):
            raise ValueError("Level must be 1-89 (only system can have 90+)")
        return v


class RoleUpdate(BaseModel):
    name:        Optional[str]  = None
    description: Optional[str] = None
    level:       Optional[int]  = None
    permissions: Optional[dict] = None

    @field_validator("level")
    @classmethod
    def level_range(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 89):
            raise ValueError("Level must be 1-89")
        return v


class PermissionsUpdate(BaseModel):
    permissions: Dict[str, List[str]]


VALID_ACTIONS: Set[str] = {"view", "create", "edit", "delete", "approve", "export"}


# ── Private helpers ──────────────────────────────────────────────────────
async def _role_by_slug(slug: str, tid: UUID, db: AsyncSession) -> Optional[Role]:
    r = await db.execute(select(Role).where(Role.slug == slug, Role.tenant_id == tid))
    return r.scalar_one_or_none()


async def _role_by_id(rid: UUID, tid: UUID, db: AsyncSession) -> Optional[Role]:
    r = await db.execute(select(Role).where(Role.id == rid, Role.tenant_id == tid))
    return r.scalar_one_or_none()


async def _user_by_id(uid: UUID, tid: UUID, db: AsyncSession) -> Optional[User]:
    r = await db.execute(select(User).where(User.id == uid, User.tenant_id == tid))
    return r.scalar_one_or_none()


async def _my_level(user: User, db: AsyncSession) -> int:
    if user.role == "super_admin":
        return 100
    r = await db.execute(
        select(Role.level).where(Role.slug == user.role, Role.tenant_id == user.tenant_id)
    )
    val = r.scalar_one_or_none()
    return val if val is not None else 1


async def _audit(
    db: AsyncSession, tid: UUID, by: User,
    target_type: str, target_id: UUID, action: str,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    module: Optional[str] = None,
    req: Optional[Request] = None,
):
    ip = None
    if req:
        fwd = req.headers.get("X-Forwarded-For")
        ip = fwd.split(",")[0].strip() if fwd else (req.client.host if req.client else None)
    db.add(PermissionAuditLog(
        tenant_id=tid, changed_by_id=by.id,
        target_type=target_type, target_id=target_id,
        action=action, module=module,
        old_value=old_value, new_value=new_value,
        ip_address=ip,
    ))


def _uo(u: User) -> dict:
    return {
        "id":         str(u.id), "name": u.name, "email": u.email,
        "role":       u.role, "phone": u.phone, "avatar_url": u.avatar_url,
        "tenant_id":  str(u.tenant_id), "is_active": u.is_active,
        "preferences":u.preferences or {},
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


def _ro(r: Role) -> dict:
    return {
        "id":          str(r.id), "name": r.name, "slug": r.slug,
        "description": r.description, "level": r.level,
        "permissions": r.permissions or {}, "is_system": r.is_system,
        "tenant_id":   str(r.tenant_id),
    }


# ── AUTH ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == request.email.lower().strip()))
    user = res.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled. Contact administrator.")

    tr = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tr.scalar_one_or_none()
    if not tenant or not tenant.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tenant is inactive")

    rr = await db.execute(select(Role).where(Role.id == user.role_id))
    role_obj = rr.scalar_one_or_none()
    permissions = dict(role_obj.permissions or {}) if role_obj else {}
    for mod, acts in (user.extra_permissions or {}).items():
        permissions[mod] = acts

    tok = {"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role}
    await db.execute(
        update(User).where(User.id == user.id)
        .values(last_login_at=__import__("datetime").datetime.utcnow().isoformat())
    )
    from app.schemas.auth import TenantOut
    return LoginResponse(
        access_token=create_access_token(tok),
        refresh_token=create_refresh_token(tok),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
        permissions=permissions,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(request.refresh_token)
    res = await db.execute(select(User).where(User.id == UUID(payload["sub"]), User.is_active == True))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    tok = {"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(tok),
        refresh_token=create_refresh_token(tok),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    rr = await db.execute(select(Role).where(Role.id == current_user.role_id))
    role_obj = rr.scalar_one_or_none()
    permissions = dict(role_obj.permissions or {}) if role_obj else {}
    for mod, acts in (current_user.extra_permissions or {}).items():
        permissions[mod] = acts
    return {**_uo(current_user), "permissions": permissions}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    return {"success": True, "message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Always return 200 — prevent user enumeration
    return {"success": True, "message": "If that email exists, a reset link has been sent"}


@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if len(new_password) < 8:
        raise HTTPException(422, "Password must be at least 8 characters")
    await db.execute(
        update(User).where(User.id == current_user.id)
        .values(hashed_password=hash_password(new_password))
    )
    return {"success": True, "message": "Password changed successfully"}


# ── USERS ────────────────────────────────────────────────────────────────
@users_router.get("/")
async def list_users(
    search:    Optional[str]  = Query(None),
    role_slug: Optional[str]  = Query(None),
    is_active: Optional[bool] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(25, le=100),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    q = select(User).where(User.tenant_id == current_user.tenant_id)
    if current_user.role != "super_admin":
        q = q.where(User.role != "super_admin")
    if search:
        t = f"%{search}%"
        q = q.where(sa.or_(User.name.ilike(t), User.email.ilike(t)))
    if role_slug:   q = q.where(User.role == role_slug)
    if is_active is not None: q = q.where(User.is_active == is_active)

    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    users  = (await db.execute(q.order_by(User.name).offset(offset).limit(page_size))).scalars().all()
    return {"items": [_uo(u) for u in users], "total": total, "page": page, "page_size": page_size, "total_pages": math.ceil(total / page_size) if page_size else 1}


@users_router.post("/", status_code=201)
async def create_user(
    payload: UserCreate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    target_role = await _role_by_slug(payload.role_slug, current_user.tenant_id, db)
    if not target_role:
        raise HTTPException(404, f"Role '{payload.role_slug}' not found")

    my_lv = await _my_level(current_user, db)
    if current_user.role != "super_admin" and target_role.level >= my_lv:
        raise HTTPException(403, f"Cannot assign role '{target_role.name}' (level {target_role.level}). Your level: {my_lv}.")

    existing = await db.execute(
        select(User).where(User.email == payload.email.lower(), User.tenant_id == current_user.tenant_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already exists in this organisation")

    user = User(
        tenant_id=current_user.tenant_id,
        name=payload.name, email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=target_role.slug, role_id=target_role.id,
        phone=payload.phone, department_id=payload.department_id,
    )
    db.add(user)
    await db.flush()
    await _audit(db, current_user.tenant_id, current_user, "user", user.id, "user_create",
                 new_value={"email": user.email, "role": user.role}, req=req)
    return _uo(user)


@users_router.get("/{user_id}")
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    user = await _user_by_id(user_id, current_user.tenant_id, db)
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.role == "super_admin":
        raise HTTPException(403, "Access denied")
    return _uo(user)


@users_router.put("/{user_id}")
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    user = await _user_by_id(user_id, current_user.tenant_id, db)
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin accounts")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    return _uo(user)


@users_router.patch("/{user_id}/status")
async def toggle_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot change your own active status")
    user = await _user_by_id(user_id, current_user.tenant_id, db)
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin accounts")
    old = user.is_active
    user.is_active = payload.is_active
    await _audit(db, current_user.tenant_id, current_user, "user", user_id,
                 "user_activate" if payload.is_active else "user_deactivate",
                 old_value={"is_active": old}, new_value={"is_active": payload.is_active}, req=req)
    return _uo(user)


@users_router.put("/{user_id}/role")
async def change_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot change your own role")
    user = await _user_by_id(user_id, current_user.tenant_id, db)
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.role == "super_admin":
        raise HTTPException(403, "Cannot modify Super Admin accounts")

    target_role = await _role_by_slug(payload.role_slug, current_user.tenant_id, db)
    if not target_role:
        raise HTTPException(404, f"Role '{payload.role_slug}' not found")

    my_lv = await _my_level(current_user, db)
    if current_user.role != "super_admin" and target_role.level >= my_lv:
        raise HTTPException(403, f"Cannot assign role '{target_role.name}' (level {target_role.level}). Your level: {my_lv}.")

    old_role = user.role
    user.role = target_role.slug
    user.role_id = target_role.id
    await _audit(db, current_user.tenant_id, current_user, "user", user_id, "user_role_change",
                 old_value={"role": old_role}, new_value={"role": target_role.slug}, req=req)
    return _uo(user)


@users_router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account")
    user = await _user_by_id(user_id, current_user.tenant_id, db)
    if not user:
        raise HTTPException(404, "User not found")
    if current_user.role != "super_admin" and user.role == "super_admin":
        raise HTTPException(403, "Cannot delete Super Admin accounts")
    user.is_active = False
    await _audit(db, current_user.tenant_id, current_user, "user", user_id, "user_delete",
                 old_value={"email": user.email, "role": user.role}, req=req)
    return {"success": True, "message": "User deactivated"}


# ── ROLES ────────────────────────────────────────────────────────────────
@roles_router.get("/")
async def list_roles(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Role).where(Role.tenant_id == current_user.tenant_id)
        .order_by(Role.level.desc(), Role.name)
    )
    roles = res.scalars().all()
    return {"items": [_ro(r) for r in roles], "total": len(roles)}


@roles_router.post("/", status_code=201)
async def create_role(
    payload: RoleCreate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    my_lv = await _my_level(current_user, db)
    if current_user.role != "super_admin" and payload.level >= my_lv:
        raise HTTPException(403, f"Cannot create role at level {payload.level}. Your level: {my_lv}.")

    if await _role_by_slug(payload.slug, current_user.tenant_id, db):
        raise HTTPException(409, f"Role slug '{payload.slug}' already exists")

    role = Role(
        tenant_id=current_user.tenant_id,
        name=payload.name, slug=payload.slug,
        description=payload.description,
        level=payload.level, permissions=payload.permissions,
        is_system=False,
    )
    db.add(role)
    await db.flush()
    await _audit(db, current_user.tenant_id, current_user, "role", role.id, "role_create",
                 new_value={"name": role.name, "slug": role.slug, "level": role.level}, req=req)
    return _ro(role)


@roles_router.get("/{role_id}")
async def get_role(
    role_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    role = await _role_by_id(role_id, current_user.tenant_id, db)
    if not role:
        raise HTTPException(404, "Role not found")
    return _ro(role)


@roles_router.put("/{role_id}")
async def update_role(
    role_id: UUID,
    payload: RoleUpdate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    role = await _role_by_id(role_id, current_user.tenant_id, db)
    if not role:
        raise HTTPException(404, "Role not found")
    if role.is_system and role.level >= 90 and current_user.role != "super_admin":
        raise HTTPException(403, f"Cannot modify system role '{role.name}'")

    old = {"name": role.name, "level": role.level}
    if payload.name        is not None: role.name        = payload.name
    if payload.description is not None: role.description = payload.description
    if payload.permissions is not None: role.permissions = payload.permissions
    if payload.level       is not None:
        my_lv = await _my_level(current_user, db)
        if current_user.role != "super_admin" and payload.level >= my_lv:
            raise HTTPException(403, f"Cannot set level {payload.level}. Your level: {my_lv}.")
        role.level = payload.level

    await _audit(db, current_user.tenant_id, current_user, "role", role_id, "role_update",
                 old_value=old, new_value={"name": role.name, "level": role.level}, req=req)
    return _ro(role)


@roles_router.delete("/{role_id}")
async def delete_role(
    role_id: UUID,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    role = await _role_by_id(role_id, current_user.tenant_id, db)
    if not role:
        raise HTTPException(404, "Role not found")
    if role.is_system:
        raise HTTPException(400, f"Cannot delete system role '{role.name}'")

    count = (await db.execute(
        select(func.count(User.id)).where(
            User.role_id == role_id, User.tenant_id == current_user.tenant_id, User.is_active == True
        )
    )).scalar_one()
    if count > 0:
        raise HTTPException(400, f"Cannot delete: {count} active user(s) use this role. Reassign first.")

    await _audit(db, current_user.tenant_id, current_user, "role", role_id, "role_delete",
                 old_value={"name": role.name, "slug": role.slug}, req=req)
    await db.delete(role)
    return {"success": True, "message": f"Role '{role.name}' deleted"}


@roles_router.get("/{role_id}/permissions")
async def get_permissions(
    role_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    role = await _role_by_id(role_id, current_user.tenant_id, db)
    if not role:
        raise HTTPException(404, "Role not found")
    return {"role_id": str(role_id), "slug": role.slug, "permissions": role.permissions or {}}


@roles_router.put("/{role_id}/permissions")
async def update_permissions(
    role_id: UUID,
    payload: PermissionsUpdate,
    req: Request,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    role = await _role_by_id(role_id, current_user.tenant_id, db)
    if not role:
        raise HTTPException(404, "Role not found")
    if role.is_system and role.level >= 90 and current_user.role != "super_admin":
        raise HTTPException(403, f"Cannot modify system role '{role.name}'")

    for module, actions in payload.permissions.items():
        bad = set(actions) - VALID_ACTIONS
        if bad:
            raise HTTPException(422, f"Unknown actions for '{module}': {bad}. Allowed: {VALID_ACTIONS}")

    old_perms = dict(role.permissions or {})
    role.permissions = payload.permissions

    for mod in set(list(old_perms.keys()) + list(payload.permissions.keys())):
        old_a = set(old_perms.get(mod, []))
        new_a = set(payload.permissions.get(mod, []))
        if old_a != new_a:
            await _audit(db, current_user.tenant_id, current_user, "role", role_id,
                         "permission_change", module=mod,
                         old_value={"actions": sorted(old_a)},
                         new_value={"actions": sorted(new_a)}, req=req)

    return {"role_id": str(role_id), "slug": role.slug, "permissions": role.permissions}


# ── RBAC UTILITIES ───────────────────────────────────────────────────────
@rbac_router.get("/my-permissions")
async def my_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    rr = await db.execute(select(Role).where(Role.id == current_user.role_id))
    role_obj = rr.scalar_one_or_none()
    perms = dict(role_obj.permissions or {}) if role_obj else {}
    for mod, acts in (current_user.extra_permissions or {}).items():
        perms[mod] = acts
    return {
        "user_id":        str(current_user.id),
        "role":           current_user.role,
        "role_level":     role_obj.level if role_obj else 1,
        "is_super_admin": current_user.role == "super_admin",
        "permissions":    perms,
    }


@rbac_router.get("/audit-log")
async def audit_log(
    page:        int           = Query(1, ge=1),
    page_size:   int           = Query(25, le=100),
    target_type: Optional[str] = Query(None),
    action:      Optional[str] = Query(None),
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    q = select(PermissionAuditLog).where(PermissionAuditLog.tenant_id == current_user.tenant_id)
    if target_type: q = q.where(PermissionAuditLog.target_type == target_type)
    if action:      q = q.where(PermissionAuditLog.action == action)

    total  = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    offset = (page - 1) * page_size
    rows   = (await db.execute(
        q.order_by(PermissionAuditLog.created_at.desc()).offset(offset).limit(page_size)
    )).scalars().all()

    return {
        "items": [{
            "id":            str(r.id),
            "created_at":    r.created_at.isoformat(),
            "target_type":   r.target_type,
            "target_id":     str(r.target_id),
            "action":        r.action,
            "module":        r.module,
            "old_value":     r.old_value,
            "new_value":     r.new_value,
            "changed_by_id": str(r.changed_by_id) if r.changed_by_id else None,
            "ip_address":    r.ip_address,
        } for r in rows],
        "total": total, "page": page, "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if page_size else 1,
    }
