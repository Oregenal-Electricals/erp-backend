from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
import re


# ── Request Schemas ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Password cannot be empty")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v


# ── Response Schemas ──────────────────────────────────────────────────
class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    tenant_id: UUID
    is_active: bool
    preferences: dict = {}

    model_config = {"from_attributes": True}


class TenantOut(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    settings: dict = {}
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserOut
    tenant: TenantOut
    permissions: dict = {}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


# ── User management schemas ───────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "staff"
    phone: Optional[str] = None
    department_id: Optional[UUID] = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    preferences: Optional[dict] = None
