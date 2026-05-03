"""
conftest.py — pytest configuration for Oregenal ERP.

THE PROBLEM:
  SQLAlchemy's async engine uses a connection pool (asyncpg).
  asyncpg connections are bound to the event loop that created them.
  pytest-asyncio creates a new event loop per test by default.
  Result: "Future attached to a different loop" RuntimeError.

THE FIX:
  Use NullPool during tests. NullPool creates a new DB connection
  for every request and immediately closes it — no pooling, no loop
  binding across tests. This is the officially recommended approach
  for testing async SQLAlchemy apps.

  References:
  - https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html#using-multiple-asyncio-event-loops
  - https://github.com/sqlalchemy/sqlalchemy/discussions/5823
"""
import pytest
import pytest_asyncio
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings


# ── Override the engine with NullPool for all tests ───────────────────
@pytest.fixture(scope="session", autouse=True)
def patch_engine():
    """
    Replace the module-level engine in database.py with a NullPool engine.
    Must run before any test imports the app or creates DB sessions.
    autouse=True means it runs automatically for every test session.
    """
    import app.core.database as db_module

    # Create a NullPool engine — no connection reuse across event loops
    test_engine = create_async_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    test_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    # Patch the module-level objects so FastAPI's get_db() uses NullPool
    db_module.engine = test_engine
    db_module.AsyncSessionLocal = test_session_factory

    yield  # tests run here

    # Teardown: dispose test engine after all tests complete
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(test_engine.dispose())
        else:
            loop.run_until_complete(test_engine.dispose())
    except Exception:
        pass  # best-effort cleanup
