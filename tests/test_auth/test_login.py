"""
Auth endpoint tests.
Run with: pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "admin@demo.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_login_invalid_email(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "not-an-email",
        "password": "demo1234",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_me_unauthenticated(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_always_succeeds(client):
    """Always returns 200 to prevent user enumeration."""
    response = await client.post("/api/v1/auth/forgot-password", json={
        "email": "doesnotexist@example.com",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
