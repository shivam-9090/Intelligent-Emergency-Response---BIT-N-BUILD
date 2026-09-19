import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ResourceStatus, ResourceType


class ResourceUnitCreate(BaseModel):
    name: str
    resource_type: ResourceType
    capability: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    assigned_user_id: uuid.UUID | None = None


class ResourceUnitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    resource_type: ResourceType
    status: ResourceStatus
    capability: str | None
    latitude: float | None
    longitude: float | None
    assigned_user_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
