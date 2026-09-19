import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserCreate(BaseModel):
    """Public self-registration payload. Deliberately has no `role` field —
    every self-registered account starts as FIELD_TEAM. Role elevation only
    happens through the admin-only /auth/users/{id}/role endpoint."""

    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
