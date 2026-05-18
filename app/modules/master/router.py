"""
app/modules/master/router.py
==============================
Master Setup Module — HTTP Router (thin layer)

All business logic lives in app/services/master_service.py.
This file only handles HTTP concerns: request parsing, response shaping.

Endpoints:
  GET  /master/company
  PUT  /master/company
  GET  /master/branches
  POST /master/branches
  PUT  /master/branches/{id}
  DELETE /master/branches/{id}
  GET  /master/financial-years
  POST /master/financial-years
  PUT  /master/financial-years/{id}/activate
  PUT  /master/financial-years/{id}/close
  GET  /master/number-series
  PUT  /master/number-series/{document_type}
  POST /master/number-series/{document_type}/preview
  GET  /master/approval-rules
  PUT  /master/approval-rules/{document_type}
  GET  /master/change-request-settings
  PUT  /master/change-request-settings/{document_type}
  GET  /master/test-data/status
  POST /master/test-data/load
  DELETE /master/test-data/purge
  GET  /master/audit-log

RBAC:
  All GETs: admin + super_admin
  All writes: super_admin only
  Test data: super_admin only

"""
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.services import master_service as svc

router = APIRouter(prefix="/master", tags=["Master Setup"])


# ═══════════════════════════════════════════════════════════════════════
# PYDANTIC REQUEST SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class CompanyUpdate(BaseModel):
    name:                    Optional[str] = None
    legal_name:              Optional[str] = None
    gstin:                   Optional[str] = None
    pan:                     Optional[str] = None
    cin:                     Optional[str] = None
    tan:                     Optional[str] = None
    address_line1:           Optional[str] = None
    address_line2:           Optional[str] = None
    city:                    Optional[str] = None
    state:                   Optional[str] = None
    pincode:                 Optional[str] = None
    country:                 Optional[str] = None
    phone:                   Optional[str] = None
    email:                   Optional[str] = None
    website:                 Optional[str] = None
    logo_url:                Optional[str] = None
    stamp_url:               Optional[str] = None
    signature_url:           Optional[str] = None
    primary_color:           Optional[str] = None
    currency:                Optional[str] = None
    timezone:                Optional[str] = None
    date_format:             Optional[str] = None
    fiscal_year_start_month: Optional[int] = None

    @field_validator("fiscal_year_start_month")
    @classmethod
    def validate_month(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 12):
            raise ValueError("fiscal_year_start_month must be between 1 and 12.")
        return v

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) != 15:
            raise ValueError("GSTIN must be exactly 15 characters.")
        return v.upper() if v else v

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) != 10:
            raise ValueError("PAN must be exactly 10 characters.")
        return v.upper() if v else v


class BranchCreate(BaseModel):
    name:          str
    code:          Optional[str] = None
    branch_type:   str = "factory"
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city:          Optional[str] = None
    state:         Optional[str] = None
    pincode:       Optional[str] = None
    gstin:         Optional[str] = None
    phone:         Optional[str] = None
    email:         Optional[str] = None
    is_head_office: bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Branch name cannot be empty.")
        return v.strip()

    @field_validator("branch_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"factory", "warehouse", "office", "showroom", "depot"}
        if v not in allowed:
            raise ValueError(f"branch_type must be one of: {', '.join(sorted(allowed))}")
        return v


class BranchUpdate(BaseModel):
    name:          Optional[str] = None
    code:          Optional[str] = None
    branch_type:   Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city:          Optional[str] = None
    state:         Optional[str] = None
    pincode:       Optional[str] = None
    gstin:         Optional[str] = None
    phone:         Optional[str] = None
    email:         Optional[str] = None
    is_head_office: Optional[bool] = None
    is_active:     Optional[bool] = None


class FinancialYearCreate(BaseModel):
    name:       str
    start_date: date
    end_date:   date
    is_active:  bool = False

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Financial year name cannot be empty.")
        return v.strip()

    @field_validator("end_date")
    @classmethod
    def end_after_start(cls, v: date, info) -> date:
        start = info.data.get("start_date")
        if start and v <= start:
            raise ValueError("end_date must be after start_date.")
        return v


class NumberSeriesUpdate(BaseModel):
    prefix:         Optional[str]  = None
    include_year:   Optional[bool] = None
    year_format:    Optional[str]  = None
    separator:      Optional[str]  = None
    padding_digits: Optional[int]  = None
    suffix:         Optional[str]  = None
    is_active:      Optional[bool] = None

    @field_validator("padding_digits")
    @classmethod
    def validate_padding(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (1 <= v <= 10):
            raise ValueError("padding_digits must be between 1 and 10.")
        return v

    @field_validator("year_format")
    @classmethod
    def validate_year_format(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"YY", "YYYY", "YY-YY", "YYYY-YYYY"}
        if v and v not in allowed:
            raise ValueError(f"year_format must be one of: {', '.join(sorted(allowed))}")
        return v


class ApprovalRuleUpdate(BaseModel):
    is_approval_required:   Optional[bool]  = None
    auto_approve_below_amt: Optional[float] = None
    approver_role:          Optional[str]   = None
    escalation_hours:       Optional[int]   = None
    notify_on_submit:       Optional[bool]  = None
    notify_on_approve:      Optional[bool]  = None
    notify_on_reject:       Optional[bool]  = None
    is_active:              Optional[bool]  = None

    @field_validator("escalation_hours")
    @classmethod
    def validate_hours(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("escalation_hours must be >= 0.")
        return v


class ChangeRequestUpdate(BaseModel):
    allow_change_request: Optional[bool] = None
    who_can_raise:        Optional[str]  = None
    who_can_approve:      Optional[str]  = None
    requires_reason:      Optional[bool] = None
    is_active:            Optional[bool] = None


# ═══════════════════════════════════════════════════════════════════════
# SECTION 1 — COMPANY
# ═══════════════════════════════════════════════════════════════════════

@router.get("/company")
async def get_company(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get company profile. Any authenticated user."""
    result = await svc.get_company(current_user.tenant_id, db)
    if not result:
        return {
            "id": None,
            "name": None,
            "message": "No company profile found. Please create one.",
        }
    return result


@router.put("/company")
async def update_company(
    payload: CompanyUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update company profile. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.update_company(
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )


# ═══════════════════════════════════════════════════════════════════════
# SECTION 2 — BRANCHES
# ═══════════════════════════════════════════════════════════════════════

@router.get("/branches")
async def list_branches(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active branches. Admin+ only."""
    svc.require_admin_or_above(current_user)
    items = await svc.list_branches(current_user.tenant_id, db)
    return {"items": items, "total": len(items)}


@router.post("/branches", status_code=201)
async def create_branch(
    payload: BranchCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new branch. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.create_branch(
        current_user.tenant_id,
        current_user,
        payload.model_dump(),
        db,
        request,
    )


@router.put("/branches/{branch_id}")
async def update_branch(
    branch_id: UUID,
    payload: BranchUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a branch. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.update_branch(
        branch_id,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )


@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a branch. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.delete_branch(
        branch_id,
        current_user.tenant_id,
        current_user,
        db,
        request,
    )


# ═══════════════════════════════════════════════════════════════════════
# SECTION 3 — FINANCIAL YEARS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/financial-years")
async def list_financial_years(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all financial years. Admin+ only."""
    svc.require_admin_or_above(current_user)
    items = await svc.list_financial_years(current_user.tenant_id, db)
    return {"items": items}


@router.post("/financial-years", status_code=201)
async def create_financial_year(
    payload: FinancialYearCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new financial year. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.create_financial_year(
        current_user.tenant_id,
        current_user,
        payload.model_dump(),
        db,
        request,
    )


@router.put("/financial-years/{fy_id}/activate")
async def activate_financial_year(
    fy_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Set a financial year as active. Deactivates all others. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.activate_financial_year(
        fy_id, current_user.tenant_id, current_user, db, request
    )


@router.put("/financial-years/{fy_id}/close")
async def close_financial_year(
    fy_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently close a financial year. Irreversible. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.close_financial_year(
        fy_id, current_user.tenant_id, current_user, db, request
    )


# ═══════════════════════════════════════════════════════════════════════
# SECTION 4 — NUMBER SERIES
# ═══════════════════════════════════════════════════════════════════════

@router.get("/number-series")
async def list_number_series(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List number series for all document types. Admin+ only."""
    svc.require_admin_or_above(current_user)
    items = await svc.list_number_series(current_user.tenant_id, db)
    return {"items": items}


@router.put("/number-series/{document_type}")
async def update_number_series(
    document_type: str,
    payload: NumberSeriesUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update numbering series for a document type. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.update_number_series(
        document_type,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )


@router.post("/number-series/{document_type}/preview")
async def preview_number_series(
    document_type: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Preview next generated number. Admin+ only."""
    svc.require_admin_or_above(current_user)
    return await svc.preview_number_series(document_type, current_user.tenant_id, db)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 5 — APPROVAL RULES
# ═══════════════════════════════════════════════════════════════════════

@router.get("/approval-rules")
async def list_approval_rules(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List approval rules for all document types. Admin+ only."""
    svc.require_admin_or_above(current_user)
    items = await svc.list_approval_rules(current_user.tenant_id, db)
    return {"items": items}


@router.put("/approval-rules/{document_type}")
async def update_approval_rule(
    document_type: str,
    payload: ApprovalRuleUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update approval rule for a document type. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.update_approval_rule(
        document_type,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )


# ═══════════════════════════════════════════════════════════════════════
# SECTION 6 — CHANGE REQUEST SETTINGS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/change-request-settings")
async def list_change_request_settings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List change request settings. Admin+ only."""
    svc.require_admin_or_above(current_user)
    items = await svc.list_change_request_settings(current_user.tenant_id, db)
    return {"items": items}


@router.put("/change-request-settings/{document_type}")
async def update_change_request_setting(
    document_type: str,
    payload: ChangeRequestUpdate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update change request setting. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.update_change_request_setting(
        document_type,
        current_user.tenant_id,
        current_user,
        payload.model_dump(exclude_unset=True),
        db,
        request,
    )


# ═══════════════════════════════════════════════════════════════════════
# SECTION 7 — TEST DATA
# ═══════════════════════════════════════════════════════════════════════

@router.get("/test-data/status")
async def test_data_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """How many test data rows exist per table. Super Admin only."""
    svc.require_super_admin(current_user)
    return await svc.get_test_data_status(current_user.tenant_id, db)


@router.post("/test-data/load")
async def load_test_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Load realistic dummy data. All rows marked is_test_data=True.
    Idempotent — skips existing records. Super Admin only.
    """
    svc.require_super_admin(current_user)
    return await svc.load_test_data(current_user.tenant_id, current_user, db, request)


@router.delete("/test-data/purge")
async def purge_test_data(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete ALL rows where is_test_data=True for this tenant.
    Live data is NEVER touched. Super Admin only. Irreversible.
    """
    svc.require_super_admin(current_user)
    return await svc.purge_test_data(current_user.tenant_id, current_user, db, request)


# ═══════════════════════════════════════════════════════════════════════
# SECTION 8 — AUDIT LOG
# ═══════════════════════════════════════════════════════════════════════

@router.get("/audit-log")
async def get_audit_log(
    page:          int           = Query(1, ge=1),
    page_size:     int           = Query(25, ge=1, le=100),
    action:        Optional[str] = Query(None),
    module:        Optional[str] = Query(None),
    document_type: Optional[str] = Query(None),
    user_id:       Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Paginated audit log. Admin+ only."""
    svc.require_admin_or_above(current_user)
    return await svc.list_audit_log(
        current_user.tenant_id,
        db,
        page=page,
        page_size=page_size,
        action=action,
        module=module,
        document_type=document_type,
        user_id=user_id,
    )
