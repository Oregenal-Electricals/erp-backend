"""
Celery Background Workers
=========================
All async tasks: notifications, emails, automations, PDF generation.
"""
from celery import Celery
from app.core.config import settings

# ── Celery app ────────────────────────────────────────────────────────
celery_app = Celery(
    "flowerp",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "workers.tasks.send_notification":    {"queue": "notifications"},
        "workers.tasks.send_email":           {"queue": "emails"},
        "workers.tasks.generate_pdf":         {"queue": "documents"},
        "workers.tasks.run_automation":       {"queue": "automations"},
        "workers.tasks.run_scheduled_checks": {"queue": "scheduler"},
    },
    beat_schedule={
        "daily-overdue-checks": {
            "task": "workers.tasks.run_scheduled_checks",
            "schedule": 86400.0,  # every 24 hours
        },
    },
)


# ── Task: In-app notification ─────────────────────────────────────────
@celery_app.task(name="workers.tasks.send_notification", bind=True, max_retries=3)
def send_notification(self, tenant_id: str, user_ids: list, message: str, link: str = None, notification_type: str = "info"):
    """Push an in-app notification to one or more users."""
    try:
        import asyncio
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

        async def _run():
            eng = create_async_engine(settings.DATABASE_URL, echo=False)
            Session = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)

            from app.models.engines import AuditLog  # reuse connection
            # In production: insert into notifications table
            # For now just log
            print(f"[NOTIFICATION] → {len(user_ids)} users: {message}")
            await eng.dispose()

        asyncio.run(_run())
        return {"status": "sent", "count": len(user_ids)}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


# ── Task: Email ───────────────────────────────────────────────────────
@celery_app.task(name="workers.tasks.send_email", bind=True, max_retries=3)
def send_email(self, to: str, subject: str, template: str, context: dict = None):
    """Send an email via AWS SES."""
    try:
        # TODO: Render Jinja2 template + send via boto3 SES
        print(f"[EMAIL] → {to}: {subject} (template: {template})")
        return {"status": "sent", "to": to}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=120)


# ── Task: PDF Generation ──────────────────────────────────────────────
@celery_app.task(name="workers.tasks.generate_pdf", bind=True, max_retries=2)
def generate_pdf(self, tenant_id: str, template: str, record_id: str, record_type: str):
    """Generate a PDF document from a Jinja2 template and upload to S3."""
    try:
        # TODO: Load record data → render template → WeasyPrint → upload to S3
        print(f"[PDF] Generating {template} for {record_type}/{record_id}")
        s3_key = f"{tenant_id}/{record_type}/{record_id}/{template}.pdf"
        return {"status": "generated", "s3_key": s3_key}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


# ── Task: Automation Engine Runner ────────────────────────────────────
@celery_app.task(name="workers.tasks.run_automation", bind=True, max_retries=3)
def run_automation(self, tenant_id: str, event: str, module: str, record: dict, old_record: dict = None):
    """Run automation rules for a given event asynchronously."""
    try:
        import asyncio
        from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
        from app.engines.workflow import WorkflowEngine
        import uuid

        async def _run():
            eng = create_async_engine(settings.DATABASE_URL, echo=False)
            Session = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)
            async with Session() as db:
                engine = WorkflowEngine(db, uuid.UUID(tenant_id))
                results = await engine.process_event(event, module, record, old_record)
                await db.commit()
            await eng.dispose()
            return results

        results = asyncio.run(_run())
        print(f"[AUTOMATION] {event}/{module}: {len(results)} rules fired")
        return {"status": "complete", "rules_fired": len(results)}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


# ── Task: Scheduled checks ────────────────────────────────────────────
@celery_app.task(name="workers.tasks.run_scheduled_checks")
def run_scheduled_checks():
    """
    Daily checks:
    - Overdue invoices → notify accounts
    - Stock below reorder → notify store manager
    - Pending approvals older than X hours → escalate
    """
    print("[SCHEDULER] Running daily checks...")
    # TODO: implement per-tenant checks
    return {"status": "complete"}
