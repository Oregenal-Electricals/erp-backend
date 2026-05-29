"""
tests/conftest.py
==================
Shared fixtures for all test modules.
Session-scoped client + login helpers.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest_asyncio.fixture(scope="session")
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


async def login(client, email: str, password: str) -> dict:
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    if r.status_code != 200:
        return {}
    d = r.json()
    return {
        "token": d["access_token"],
        "refresh": d.get("refresh_token"),
        "user": d["user"],
    }


def H(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def skip_if_no_seed(session: dict):
    if not session:
        pytest.skip("Seed data missing — run scripts/seed_rbac.py first")
