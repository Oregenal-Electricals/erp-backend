from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, Role
from app.models.tenant import Tenant

# ── Bearer token extractor ────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


# ── Current User ─────────────────────────────────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    user_id: Optional[str] = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(
        select(User).where(User.id == UUID(user_id), User.is_active == True)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    # Eagerly load the role so user.permissions property works correctly.
    # role_obj uses lazy="noload" so we must fetch it explicitly here.
    if user.role_id:
        role_result = await db.execute(
            select(Role).where(Role.id == user.role_id)
        )
        user.role_obj = role_result.scalar_one_or_none()

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return current_user


# ── Tenant Context ────────────────────────────────────────────────────
async def get_current_tenant(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.id == current_user.tenant_id, Tenant.is_active == True)
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant not found or inactive")
    return tenant


# ── Role-based gate ───────────────────────────────────────────────────
def require_roles(*roles: str):
    """Factory: returns a dependency that enforces one of the given roles."""
    async def _check(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {' or '.join(roles)}",
            )
        return current_user
    return _check


def require_admin():
    return require_roles("admin", "super_admin")


# ── Module permission gate ────────────────────────────────────────────
def require_module_permission(module: str, action: str = "view"):
    """
    Checks that current_user has permission to perform `action` on `module`.
    super_admin bypasses all checks.
    """
    async def _check(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role == "super_admin":
            return current_user
        permissions = current_user.permissions or {}
        module_perms = permissions.get(module, [])
        if action not in module_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action} on {module}",
            )
        return current_user
    return _check


# ── Pagination params ─────────────────────────────────────────────────
class PaginationParams:
    def __init__(self, page: int = 1, page_size: int = 25):
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), 200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def get_pagination(page: int = 1, page_size: int = 25) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)