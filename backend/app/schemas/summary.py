import uuid

from pydantic import BaseModel


class IncidentSummary(BaseModel):
    incident_id: uuid.UUID
    summary: str
    ai_generated: bool
