from pydantic import BaseModel

from app.models.enums import IncidentType, ResourceType, Severity


class IncidentTypeCount(BaseModel):
    incident_type: IncidentType
    count: int


class SeverityCount(BaseModel):
    severity: Severity
    count: int


class IncidentBreakdown(BaseModel):
    total: int
    by_type: list[IncidentTypeCount]
    by_severity: list[SeverityCount]


class ResponseDelayByType(BaseModel):
    incident_type: IncidentType
    average_minutes: float
    sample_size: int


class ResponseDelayStats(BaseModel):
    overall_average_minutes: float | None
    overall_sample_size: int
    by_type: list[ResponseDelayByType]


class ResourceShortage(BaseModel):
    resource_type: ResourceType
    total: int
    available: int
    assigned: int
    unavailable: int
    shortage: bool


class Hotspot(BaseModel):
    latitude: float
    longitude: float
    count: int
