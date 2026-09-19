from pydantic import BaseModel, ConfigDict

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


class ClassMetric(BaseModel):
    precision: float
    recall: float
    f1_score: float
    support: int


class ModelEvaluationSummary(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_version: str
    trained_at: str | None
    dataset_sha256: str | None
    split_strategy: str
    incident_type_accuracy: float
    incident_type_macro_f1: float
    incident_type_classes: dict[str, ClassMetric]
    severity_accuracy: float
    severity_macro_f1: float
    severity_classes: dict[str, ClassMetric]
    calibration_status: str
