"""FlowERP — FastAPI Application — Phase 4"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.database import check_db_connection
from app.core.exceptions import (
    ERPException, erp_exception_handler,
    validation_exception_handler, integrity_error_handler, generic_exception_handler,
)

from app.modules.auth.router         import router as auth_router, users_router
from app.modules.config.router        import router as config_router
from app.modules.crm.router           import router as crm_router
from app.modules.dashboard.router     import router as dashboard_router
from app.modules.inventory.router     import router as inventory_router
from app.modules.purchase.router      import router as purchase_router
from app.modules.manufacturing.router import router as manufacturing_router
from app.modules.qc.router            import router as qc_router
from app.modules.accounts.router      import router as accounts_router
from app.modules.hr.router            import router as hr_router
from app.modules.notifications.router import router as notifications_router
from app.modules.sales.router         import router as sales_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    import logging
    db_ok = await check_db_connection()
    logging.info("✅  DB connected" if db_ok else "⚠️  DB not connected — degraded mode")
    yield
    from app.core.database import engine
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="FlowERP — Modular ERP Platform API",
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Total-Count"],
    )

    app.add_exception_handler(ERPException, erp_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    API = settings.API_V1_PREFIX
    for r in [
        auth_router, users_router, config_router,
        sales_router,          # ← Phase 4: full sales
        crm_router, dashboard_router, inventory_router,
        purchase_router, manufacturing_router,
        qc_router, accounts_router, hr_router,
        notifications_router,
    ]:
        app.include_router(r, prefix=API)

    @app.get("/health", tags=["Health"])
    async def health():
        db_ok = await check_db_connection()
        return {
            "status": "ok" if db_ok else "degraded",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "env": settings.APP_ENV,
            "db": "connected" if db_ok else "disconnected",
            "phase": "4 — Sales complete",
            "modules": 12,
        }

    @app.get("/", tags=["Root"])
    async def root():
        return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/api/docs"}

    return app


app = create_app()
