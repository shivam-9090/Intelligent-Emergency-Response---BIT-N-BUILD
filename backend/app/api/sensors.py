import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.facility_matching import recommend_hospitals
from app.ml.sensor_telemetry import analyze_sensor_telemetry
from app.models.enums import IncidentSource, IncidentType, Severity
from app.schemas.incident import IncidentCreate, IncidentRead
from app.services import incident_service

router = APIRouter(tags=["sensors", "facilities"])


class SensorTelemetryPayload(BaseModel):
    sensor_id: str
    sensor_type: str
    district: str = "Urban Sector"
    latitude: float
    longitude: float
    readings: dict[str, Any]
    thresholds: dict[str, Any] = {}
    auto_create_incident: bool = True


class SensorAnalysisResponse(BaseModel):
    sensor_id: str
    is_anomaly: bool
    anomaly_score: float
    incident_type: IncidentType
    severity: Severity
    priority: int
    incident_created: bool
    incident: IncidentRead | None = None
    details: list[str]


class HospitalRecommendationResponse(BaseModel):
    incident_id: uuid.UUID
    facilities: list[dict[str, Any]]


@router.post("/sensors/telemetry", response_model=SensorAnalysisResponse)
def ingest_sensor_telemetry(
    payload: SensorTelemetryPayload, db: Session = Depends(get_db)
) -> SensorAnalysisResponse:
    """Process streaming IoT sensor telemetry packet.

    Runs anomaly detection and automatically creates a verified incident when
    readings breach critical safety thresholds.
    """
    analysis = analyze_sensor_telemetry(payload.model_dump())

    created_incident = None
    incident_was_created = False

    if analysis["is_anomaly"] and payload.auto_create_incident:
        incident_in = IncidentCreate(
            title=analysis["title"],
            description=analysis["description"],
            source=IncidentSource.SENSOR,
            incident_type=analysis["incident_type"],
            latitude=payload.latitude,
            longitude=payload.longitude,
            address=payload.district,
        )
        created_db_incident = incident_service.create_incident(db, incident_in)
        created_incident = IncidentRead.model_validate(created_db_incident)
        incident_was_created = True

    return SensorAnalysisResponse(
        sensor_id=payload.sensor_id,
        is_anomaly=analysis["is_anomaly"],
        anomaly_score=analysis["anomaly_score"],
        incident_type=analysis["incident_type"],
        severity=analysis["severity"],
        priority=analysis["priority"],
        incident_created=incident_was_created,
        incident=created_incident,
        details=analysis["details"],
    )


@router.get("/incidents/{incident_id}/hospitals", response_model=HospitalRecommendationResponse)
def get_incident_hospitals(
    incident_id: uuid.UUID, limit: int = 3, db: Session = Depends(get_db)
) -> HospitalRecommendationResponse:
    """Recommend specialized medical facilities with live bed availability and arrival ETAs."""
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    hospitals = recommend_hospitals(
        incident_type=incident.incident_type,
        severity=incident.severity,
        inc_lat=incident.latitude,
        inc_lon=incident.longitude,
        limit=limit,
    )
    return HospitalRecommendationResponse(incident_id=incident_id, facilities=hospitals)

