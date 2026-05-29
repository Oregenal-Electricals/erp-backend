"""
app/main.py
============
Oregenal ERP — FastAPI Application Entry Point
Oregenal Electrical India Private Limited
"""
from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.core.database import check_db_connection
from app.core.exceptions import (
    ERPException,
    erp_exception_handler,
    validation_exception_handler,
    integrity_error_handler,
    generic_exception_handler,
)

# ── Module routers ────────────────────────────────────────────────────────
from app.modules.auth.router import (
    router as auth_router,
    users_router,
    roles_router,
    rbac_router,
    dept_router,
)
from app.modules.config.router            import router as config_router
from app.modules.crm.router               import router as crm_router
from app.modules.dashboard.router         import router as dashboard_router
from app.modules.inventory.router         import router as inventory_router
from app.modules.purchase.router          import router as purchase_router
from app.modules.manufacturing.router     import router as manufacturing_router
from app.modules.manufacturing.bom_router import router as bom_router, work_router as bom_work_router
from app.modules.qc.router                import router as qc_router
from app.modules.accounts.router          import router as accounts_router
from app.modules.hr.router                import router as hr_router
from app.modules.notifications.router     import router as notifications_router
from app.modules.sales.router             import router as sales_router
from app.modules.documents.router         import router as documents_router
from app.modules.reports.router           import router as reports_router
from app.modules.saas.router              import router as saas_router
from app.modules.stock_ledger.router      import router as stock_ledger_router
from app.modules.gst.router               import router as gst_router
from app.modules.email.router             import router as email_router
from app.modules.dispatch.router          import router as dispatch_router
from app.modules.maintenance.router       import router as maintenance_router
from app.modules.payroll.router           import router as payroll_router
from app.modules.costing.router           import router as costing_router
from app.modules.finance.router           import router as finance_router
from app.modules.master.router            import router as master_router
from app.modules.masters.router           import router as masters_router
from app.modules.gate.router              import router as gate_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    db_ok = await check_db_connection()
    logging.info("✅  DB connected" if db_ok else "⚠️  DB not connected")
    yield
    from app.core.database import engine
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        redirect_slashes=False,
        title=settings.APP_NAME,
        version="9.0.0",
        description="Oregenal ERP — Oregenal Electrical India Private Limited",
        docs_url="/api/docs"        if not settings.is_production else None,
        redoc_url="/api/redoc"      if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────
    

    app.add_middleware(
    CORSMiddleware,
        allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ─────────────────────────────────────────────
    app.add_exception_handler(ERPException, erp_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # ── API v1 routes ──────────────────────────────────────────────────
    prefix = settings.API_V1_PREFIX  # /api/v1

    # Auth + Users + Roles + RBAC + Departments
    app.include_router(auth_router,    prefix=prefix)
    app.include_router(users_router,   prefix=prefix)
    app.include_router(roles_router,   prefix=prefix)
    app.include_router(rbac_router,    prefix=prefix)
    app.include_router(dept_router,    prefix=prefix)

    # Config / Settings
    app.include_router(config_router,       prefix=prefix)

    # Core modules
    app.include_router(master_router,       prefix=prefix)
    app.include_router(masters_router,      prefix=prefix)
    app.include_router(crm_router,          prefix=prefix)
    app.include_router(sales_router,        prefix=prefix)
    app.include_router(purchase_router,     prefix=prefix)
    app.include_router(inventory_router,    prefix=prefix)
    app.include_router(stock_ledger_router, prefix=prefix)
    app.include_router(manufacturing_router, prefix=prefix)
    app.include_router(bom_router,          prefix=prefix)
    app.include_router(bom_work_router,     prefix=prefix)
    app.include_router(qc_router,           prefix=prefix)
    app.include_router(accounts_router,     prefix=prefix)
    app.include_router(hr_router,           prefix=prefix)
    app.include_router(finance_router,      prefix=prefix)
    app.include_router(gst_router,          prefix=prefix)
    app.include_router(payroll_router,      prefix=prefix)
    app.include_router(costing_router,      prefix=prefix)
    app.include_router(maintenance_router,  prefix=prefix)
    app.include_router(gate_router,         prefix=prefix)
    app.include_router(dispatch_router,     prefix=prefix)
    app.include_router(documents_router,    prefix=prefix)
    app.include_router(reports_router,      prefix=prefix)
    app.include_router(notifications_router, prefix=prefix)
    app.include_router(email_router,        prefix=prefix)
    app.include_router(saas_router,         prefix=prefix)
    app.include_router(dashboard_router,    prefix=prefix)

    # ── Health check ───────────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health():
        db_ok = await check_db_connection()
        return {
            "status": "ok" if db_ok else "degraded",
            "db": "connected" if db_ok else "disconnected",
            "version": "9.0.0",
            "env": settings.APP_ENV,
        }

    return app


app = create_app()
