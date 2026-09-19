import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AssignmentStatus


class AssignmentCreate(BaseModel):
    incident_id: uuid.UUID
    resource_id: uuid.UUID


class AssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    resource_id: uuid.UUID
    status: AssignmentStatus
    assigned_at: datetime
    updated_at: datetime
