import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import AlertType


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    incident_id: uuid.UUID
    alert_type: AlertType
    message: str
    resolved: bool
    created_at: datetime
