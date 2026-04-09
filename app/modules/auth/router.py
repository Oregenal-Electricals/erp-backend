from datetime import timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.database import get_db
from app.core.security import (
    verify_password, hash_password,
    create_access_token, create_refresh_token,
    decode_refresh_token,
)
from app.core.config import settings
from app.core.dependencies import get_current_active_user, get_current_tenant, require_admin
from app.models.user import User, Role
from app.models.tenant import Tenant
from app.schemas.auth import (
    LoginRequest, LoginResponse, RefreshTokenRequest, TokenResponse,
    UserOut, UserCreate, UserUpdate, ForgotPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Login ─────────────────────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email.lower().strip())
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact your administrator.",
        )

    # Load tenant
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()

    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant is inactive")

    # Load role + permissions
    role_result = await db.execute(select(Role).where(Role.id == user.role_id))
    role_obj = role_result.scalar_one_or_none()
    permissions = (role_obj.permissions or {}) if role_obj else {}

    # Create tokens
    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role,
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Update last login
    await db.execute(
        update(User)
        .where(User.id == user.id)
        .values(last_login_at=__import__("datetime").datetime.utcnow().isoformat())
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user),
        tenant=tenant,
        permissions=permissions,
    )


# ── Refresh Token ─────────────────────────────────────────────────────
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(request.refresh_token)
    user_id = payload.get("sub")

    result = await db.execute(select(User).where(User.id == UUID(user_id), User.is_active == True))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    token_data = {"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── Current User ──────────────────────────────────────────────────────
@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return UserOut.model_validate(current_user)


# ── Logout ────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    # In production: add token to a Redis blocklist
    return {"success": True, "message": "Logged out successfully"}


# ── Forgot Password ───────────────────────────────────────────────────
@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    user = result.scalar_one_or_none()

    # Always return success to prevent user enumeration
    if user:
        # TODO: generate reset token, store in Redis with TTL, send email via SES
        pass

    return {"success": True, "message": "If that email exists, a reset link has been sent"}


# ── Change Password ───────────────────────────────────────────────────
@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(new_password) < 8:
        raise HTTPException(status_code=422, detail="New password must be at least 8 characters")

    await db.execute(
        update(User)
        .where(User.id == current_user.id)
        .values(hashed_password=hash_password(new_password))
    )
    return {"success": True, "message": "Password changed successfully"}


# ── User Management (Admin only) ──────────────────────────────────────
users_router = APIRouter(prefix="/users", tags=["User Management"])


@users_router.get("/", response_model=List[UserOut])
async def list_users(
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.tenant_id == current_user.tenant_id)
        .order_by(User.name)
    )
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@users_router.post("/", response_model=UserOut, status_code=201)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    # Check email uniqueness within tenant
    existing = await db.execute(
        select(User).where(User.email == payload.email.lower(), User.tenant_id == current_user.tenant_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already exists in this tenant")

    user = User(
        tenant_id=current_user.tenant_id,
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        phone=payload.phone,
        department_id=payload.department_id,
    )
    db.add(user)
    await db.flush()
    return UserOut.model_validate(user)


@users_router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    return UserOut.model_validate(user)


@users_router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_admin()),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    result = await db.execute(
        select(User).where(User.id == user_id, User.tenant_id == current_user.tenant_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete — deactivate instead of hard delete
    user.is_active = False
    return {"success": True, "message": "User deactivated"}
