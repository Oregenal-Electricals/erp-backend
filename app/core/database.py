from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import Column, DateTime, func
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.core.config import settings


# ── Async Engine ──────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# ── Session Factory ───────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ── Base Model ────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    Provides: UUID primary key, created_at, updated_at.
    """

    @declared_attr.directive
    def __tablename__(cls) -> str:
        # Auto-generate table name from class name (snake_case)
        import re
        name = re.sub(r"(?<!^)(?=[A-Z])", "_", cls.__name__).lower()
        return name

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ── Dependency ────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Health check ──────────────────────────────────────────────────────
async def check_db_connection() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(__import__("sqlalchemy").text("SELECT 1"))
        return True
    except Exception:
        return False
