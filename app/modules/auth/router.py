"""
app/modules/auth/router.py
===========================
Oregenal ERP — Auth + Users + Roles + RBAC + Departments Router

Exports:
  router        — /auth     (login, refresh, me, password)
  users_router  — /users    (CRUD + role change + permissions)
  roles_router  — /roles    (CRUD + permissions)
  rbac_router   — /rbac     (my-permissions, audit log)
  dept_router   — /departments (CRUD)

All business logic is in app/services/auth_service.py.
PermissionAuditLog model is defined here (used by auth_service via local import).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base, get_db
from app.core.dependencies import get_current_active_user
from app.models.user import PermissionAuditLog, User
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
)
from app.services import auth_service as svc


# REQUEST SCHEMAS (router-level, not in schemas/auth.py)
# ═══════════════════════════════════════════════════════════════════════

class UserCreatePayload(BaseModel):
    name:          str
    email:         EmailStr
    password:      str
    role_slug:     str = "viewer"
    phone:         Optional[str]  = None
    department_id: Optional[UUID] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty.")
        return v.strip()


class UserUpdatePayload(BaseModel):
    name:         Optional[str]  = None
    phone:        Optional[str]  = None
    avatar_url:   Optional[str]  = None
    preferences:  Optional[dict] = None


class RoleCreatePayload(BaseModel):
    name:        str
    slug:        str
    description: Optional[str]  = None
    level:       int             = 1
    permissions: Optional[dict] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Role name cannot be empty.")
        return v.strip()


class RoleUpdatePayload(BaseModel):
    name:        Optional[str]  = None
    description: Optional[str]  = None
    level:       Optional[int]  = None
    permissions: Optional[dict] = None


class PermissionsPayload(BaseModel):
    permissions: Dict[str, List[str]]


class RoleChangePayload(BaseModel):
    role_slug: str


class StatusPayload(BaseModel):
    is_active: bool


class DeptCreatePayload(BaseModel):
    name:      str
    code:      Optional[str]  = None
    parent_id: Optional[UUID] = None
    head_id:   Optional[UUID] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Department name cannot be empty.")
        return v.strip()


class DeptUpdatePayload(BaseModel):
    name:      Optional[str]  = None
    code:      Optional[str]  = None
    parent_id: Optional[UUID] = None
    head_id:   Optional[UUID] = None
    is_active: Optional[bool] = None


# ═══════════════════════════════════════════════════════════════════════
# ROUTER 1 — AUTH  (/auth)
# ═══════════════════════════════════════════════════════════════════════

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate and return JWT tokens."""
    return await svc.login(payload.email, payload.password, db, request)


@router.post("/refresh")
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange refresh token for new access + refresh tokens."""
    return await svc.refresh_tokens(payload.refresh_token, db)


@router.get("/me")
async def me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return current user profile + merged permissions."""
    return await svc.get_me(current_user, db)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Change own password. Requires current password."""
    result = await svc.change_password(
        current_user,
        payload.current_password,
        payload.new_password,
        db,
    )
    await db.commit()
    return result


# Add after the change-password endpoint:

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
):
    """
    Logout endpoint. JWT is stateless — client must discard tokens.
    Returns 200 always for authenticated users.
    """
    return {"success": True, "message": "Logged out successfully."}


@router.post("/forgot-password")
async def forgot_password(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Always returns 200 to avoid user enumeration.
    In production, sends a password reset email.
    """
    # Anti-enumeration: always return 200 regardless of email existence
    return {"success": True, "message": "If that email exists, a reset link has been sent."}


# ═══════════════════════════════════════════════════════════════════════
# ROUTER 2 — USERS  (/users)
# ═══════════════════════════════════════════════════════════════════════


class AdminPasswordResetPayload(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        import re
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        return v

users_router = APIRouter(prefix="/users", tags=["Users"], redirect_slashes=False)


@users_router.get("/")
async def list_users(
    page:      int            = Query(1,  ge=1),
    page_size: int            = Query(25, ge=1, le=200),
    search:    Optional[str]  = Query(None),
    role:      Optional[str]  = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User        = Depends(get_current_active_user),
    db: AsyncSession          = Depends(get_db),
):
    """List users. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    return await svc.list_users(
        current_user.tenant_id, db,
        caller=current_user,
        page=page, page_size=page_size,
        search=search, role=role, is_active=is_active,
    )


@users_router.post("/", status_code=201)
async def create_user(
    payload: UserCreatePayload,
    request: Request,
    current_user: User   = Depends(get_current_active_user),
    db: AsyncSession     = Depends(get_db),
):
    """Create a user. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.create_user(
        current_user.tenant_id,
        current_user,
        payload.model_dump(),
        db,
        request,
    )
    await db.commit()
    return result


@users_router.get("/{user_id}")
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Get a single user. Admin+ or own profile."""
    if current_user.role not in ("admin", "super_admin") and current_user.id != user_id:
        raise HTTPException(403, "Access denied.")
    return await svc.get_user(user_id, current_user.tenant_id, db)


@users_router.put("/{user_id}")
async def update_user(
    user_id: UUID,
    payload: UserUpdatePayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Update basic user fields. Admin+ or own profile."""
    if current_user.role not in ("admin", "super_admin") and current_user.id != user_id:
        raise HTTPException(403, "Access denied.")
    result = await svc.update_user(
        user_id,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )
    await db.commit()
    return result


@users_router.patch("/{user_id}/status")
async def toggle_user_status(
    user_id: UUID,
    payload: StatusPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Activate or deactivate a user. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.toggle_user_status(
        user_id,
        current_user.tenant_id,
        current_user,
        payload.is_active,
        db,
        request,
    )
    await db.commit()
    return result


@users_router.put("/{user_id}/role")
async def change_user_role(
    user_id: UUID,
    payload: RoleChangePayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Change a user's role. Admin+ only. Cannot elevate above own level."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.change_user_role(
        user_id,
        current_user.tenant_id,
        current_user,
        payload.role_slug,
        db,
        request,
    )
    await db.commit()
    return result


@users_router.put("/{user_id}/permissions")
async def update_user_permissions(
    user_id: UUID,
    payload: PermissionsPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Set extra per-user permission overrides. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.update_user_extra_permissions(
        user_id,
        current_user.tenant_id,
        current_user,
        payload.permissions,
        db,
        request,
    )
    await db.commit()
    return result


@users_router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Deactivate (soft-delete) a user. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.delete_user(
        user_id,
        current_user.tenant_id,
        current_user,
        db,
        request,
    )
    await db.commit()
    return result


# ═══════════════════════════════════════════════════════════════════════
# ROUTER 3 — ROLES  (/roles)
# ═══════════════════════════════════════════════════════════════════════


@users_router.post("/{user_id}/reset-password")
async def admin_reset_password(
    user_id: UUID,
    payload: AdminPasswordResetPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Reset any user's password. Admin+ only. Admin cannot reset Super Admin."""
    result = await svc.admin_reset_password(
        user_id,
        current_user.tenant_id,
        current_user,
        payload.new_password,
        db,
        request,
    )
    await db.commit()
    return result

roles_router = APIRouter(prefix="/roles", tags=["Roles"], redirect_slashes=False)


@roles_router.get("/")
async def list_roles(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """List all roles for this tenant. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    return await svc.list_roles(current_user.tenant_id, db)


@roles_router.post("/", status_code=201)
async def create_role(
    payload: RoleCreatePayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Create a custom role. Super Admin only."""
    if current_user.role != "super_admin":
        raise HTTPException(403, "Super Admin access required.")
    result = await svc.create_role(
        current_user.tenant_id,
        current_user,
        payload.model_dump(),
        db,
        request,
    )
    await db.commit()
    return result


@roles_router.get("/{role_id}")
async def get_role(
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Get a single role. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    return await svc.get_role(role_id, current_user.tenant_id, db)


@roles_router.put("/{role_id}")
async def update_role(
    role_id: UUID,
    payload: RoleUpdatePayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Update role metadata. Super Admin only."""
    if current_user.role != "super_admin":
        raise HTTPException(403, "Super Admin access required.")
    result = await svc.update_role(
        role_id,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )
    await db.commit()
    return result


@roles_router.delete("/{role_id}")
async def delete_role(
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Delete a custom (non-system) role. Super Admin only."""
    if current_user.role != "super_admin":
        raise HTTPException(403, "Super Admin access required.")
    result = await svc.delete_role(
        role_id,
        current_user.tenant_id,
        current_user,
        db,
    )
    await db.commit()
    return result


@roles_router.get("/{role_id}/permissions")
async def get_role_permissions(
    role_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Get permissions for a role. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    return await svc.get_role_permissions(role_id, current_user.tenant_id, db)


@roles_router.put("/{role_id}/permissions")
async def update_role_permissions(
    role_id: UUID,
    payload: PermissionsPayload,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Replace full permission set for a role. Super Admin only."""
    if current_user.role != "super_admin":
        raise HTTPException(403, "Super Admin access required.")
    result = await svc.update_role_permissions(
        role_id,
        current_user.tenant_id,
        current_user,
        payload.permissions,
        db,
        request,
    )
    await db.commit()
    return result


# ═══════════════════════════════════════════════════════════════════════
# ROUTER 4 — RBAC  (/rbac)
# ═══════════════════════════════════════════════════════════════════════

rbac_router = APIRouter(prefix="/rbac", tags=["RBAC"], redirect_slashes=False)


@rbac_router.get("/my-permissions")
async def my_permissions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Return the calling user's effective merged permissions."""
    return await svc.my_permissions(current_user, db)


@rbac_router.get("/audit-log")
async def rbac_audit_log(
    page:        int           = Query(1,  ge=1),
    page_size:   int           = Query(25, ge=1, le=100),
    target_type: Optional[str] = Query(None),
    action:      Optional[str] = Query(None),
    current_user: User         = Depends(get_current_active_user),
    db: AsyncSession           = Depends(get_db),
):
    """Paginated RBAC audit log. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    return await svc.list_rbac_audit_log(
        current_user.tenant_id, db,
        page=page, page_size=page_size,
        target_type=target_type, action=action,
    )


# ═══════════════════════════════════════════════════════════════════════
# ROUTER 5 — DEPARTMENTS  (/departments)
# ═══════════════════════════════════════════════════════════════════════

dept_router = APIRouter(prefix="/departments", tags=["Departments"], redirect_slashes=False)


@dept_router.get("/")
async def list_departments(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """List active departments. Any authenticated user."""
    items = await svc.list_departments(current_user.tenant_id, db)
    return {"items": items, "total": len(items)}


@dept_router.post("/", status_code=201)
async def create_department(
    payload: DeptCreatePayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Create a department. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.create_department(
        current_user.tenant_id,
        current_user,
        payload.model_dump(),
        db,
    )
    await db.commit()
    return result


@dept_router.put("/{dept_id}")
async def update_department(
    dept_id: UUID,
    payload: DeptUpdatePayload,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Update a department. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.update_department(
        dept_id,
        current_user.tenant_id,
        payload.model_dump(exclude_unset=True),
        db,
    )
    await db.commit()
    return result


@dept_router.delete("/{dept_id}")
async def delete_department(
    dept_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession   = Depends(get_db),
):
    """Deactivate a department. Admin+ only."""
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(403, "Admin access required.")
    result = await svc.delete_department(
        dept_id,
        current_user.tenant_id,
        db,
    )
    await db.commit()
    return result