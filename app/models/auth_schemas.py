"""Pydantic schemas for User Authentication and Profile Management."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    full_name: str = Field(..., min_length=2, description="Full name of the user")
    company_name: Optional[str] = Field(None, description="Company name or organization")
    tenant_id: Optional[str] = Field(None, description="Tenant key to bind this user to")
    role: str = Field("sales_representative", description="User role (defaults to sales_representative)")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str = "sales_representative"
    tenant_id: Optional[str] = None
    is_active: bool = True
    onboarded: bool = False
    created_at: Optional[datetime] = None


class OnboardingRequest(BaseModel):
    company_description: str = Field("", max_length=2000)
    offering: str = Field("", max_length=2000)
    target_industries: list[str] = Field(default_factory=list)
    geographies: list[str] = Field(default_factory=list)
    target_decision_maker_roles: list[str] = Field(default_factory=list)
    trigger_roles: list[str] = Field(default_factory=list)
    employee_count_min: Optional[int] = None
    employee_count_max: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
