import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import IncidentSource, IncidentStatus, IncidentType, Severity


class IncidentCreate(BaseModel):
    title: str
    description: str | None = None
    source: IncidentSource
    incident_type: IncidentType
    latitude: float | None = None
    longitude: float | None = None
    address: str | None = None


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    source: IncidentSource
    incident_type: IncidentType
    severity: Severity
    priority: int
    status: IncidentStatus
    latitude: float | None
    longitude: float | None
    address: str | None
    duplicate_of_id: uuid.UUID | None
    reported_at: datetime
    created_at: datetime
    updated_at: datetime
