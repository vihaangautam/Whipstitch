"""Unit and API tests for Authentication & User Profile System."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.main import app


def test_password_hashing_and_verification():
    """Verifies that PBKDF2 password hashing works and correctly validates passwords."""
    raw_password = "SecretPassword123!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert "$" in hashed
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(raw_password, "invalid_hash_string") is False


def test_jwt_token_generation_and_decoding():
    """Verifies that JWT creation and decoding roundtrips with payload preservation."""
    payload = {
        "sub": "user-12345",
        "email": "test@example.com",
        "role": "sales_representative",
    }
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-12345"
    assert decoded["email"] == "test@example.com"
    assert decoded["role"] == "sales_representative"

    # Corrupted token should return None
    assert decode_access_token("corrupted.token.value") is None


@pytest.mark.asyncio
async def test_auth_demo_login_and_me_lifecycle():
    """Tests 1-click demo login, token retrieval, and /v1/auth/me endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. 1-Click Demo Login
        demo_resp = await client.post("/v1/auth/demo-login")
        assert demo_resp.status_code == 200
        data = demo_resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "rep@trifidmedia.in"
        assert data["user"]["role"] == "sales_representative"
        assert data["user"]["full_name"] == "Alex Morgan"

        token = data["access_token"]

        # 2. Access /v1/auth/me with Bearer token
        me_resp = await client.get(
            "/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data["email"] == "rep@trifidmedia.in"
        assert me_data["role"] == "sales_representative"

        # 3. Access /v1/auth/me without token -> 401 Unauthorized
        unauth_resp = await client.get("/v1/auth/me")
        assert unauth_resp.status_code == 401


@pytest.mark.asyncio
async def test_auth_registration_and_login():
    """Tests registering a new user and subsequent login."""
    unique_email = f"rep_test_{hash_password('salt')[:8]}@example.com"
    register_payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Jordan Lee",
        "tenant_id": "trifid_media",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register new user
        reg_resp = await client.post("/v1/auth/register", json=register_payload)
        assert reg_resp.status_code == 201
        reg_data = reg_resp.json()
        assert reg_data["user"]["email"] == unique_email
        assert reg_data["user"]["full_name"] == "Jordan Lee"
        assert reg_data["user"]["role"] == "sales_representative"

        # 2. Login with valid credentials
        login_resp = await client.post(
            "/v1/auth/login",
            json={"email": unique_email, "password": "SecurePassword123!"},
        )
        assert login_resp.status_code == 200
        login_data = login_resp.json()
        assert "access_token" in login_data

        # 3. Login with invalid password -> 401
        bad_login = await client.post(
            "/v1/auth/login",
            json={"email": unique_email, "password": "WrongPassword999!"},
        )
        assert bad_login.status_code == 401


@pytest.mark.asyncio
async def test_new_workspace_requires_onboarding_then_completes():
    """A freshly registered company workspace is not onboarded until the wizard is submitted."""
    email = f"founder_{hash_password('seed2')[:8]}@example.com"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        reg = await client.post(
            "/v1/auth/register",
            json={
                "email": email,
                "password": "SecurePassword123!",
                "full_name": "Sam Founder",
                "company_name": f"Wizard Co {hash_password('seed2')[:6]}",
            },
        )
        assert reg.status_code == 201
        token = reg.json()["access_token"]
        assert reg.json()["user"]["onboarded"] is False

        auth = {"Authorization": f"Bearer {token}"}
        done = await client.post(
            "/v1/auth/onboarding",
            headers=auth,
            json={
                "company_description": "We sell CRM automation.",
                "offering": "Managed lead routing.",
                "target_industries": ["B2B SaaS", "Fintech"],
                "geographies": ["US"],
                "target_decision_maker_roles": ["VP RevOps"],
                "trigger_roles": ["Sales Operations Manager", "RevOps Analyst"],
                "employee_count_min": 50,
                "employee_count_max": 500,
            },
        )
        assert done.status_code == 200
        assert done.json()["onboarded"] is True

        me = await client.get("/v1/auth/me", headers=auth)
        assert me.json()["onboarded"] is True

        from app.core.config import settings
        cfg = await client.get(
            f"/v1/tenants/{me.json()['tenant_id']}/config",
            headers={"X-API-Key": settings.API_KEY},
        )
        assert cfg.status_code == 200
        assert cfg.json()["trigger_roles"] == ["Sales Operations Manager", "RevOps Analyst"]
