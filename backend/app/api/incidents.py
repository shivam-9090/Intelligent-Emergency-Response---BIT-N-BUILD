import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.cascade_forecaster import forecast_cascade_risk
from app.ml.classification import classify_raw_text
from app.ml.vision_analyzer import analyze_incident_image
from app.schemas.cascade import CascadeRiskResponse
from app.schemas.incident import (
    ClassifyTextRequest,
    ClassifyTextResponse,
    IncidentCreate,
    IncidentRead,
)
from app.schemas.resource import (
    ResourceBundleItem,
    ResourceBundleResponse,
    ResourceUnitRead,
)
from app.schemas.summary import IncidentSummary
from app.schemas.vision import ImageAnalysisRequest, ImageAnalysisResponse
from app.services import incident_service, resource_service, summary_service

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/classify-text", response_model=ClassifyTextResponse)
def classify_text(payload: ClassifyTextRequest) -> ClassifyTextResponse:
    """Analyze unstructured emergency text in real-time using trained ML models."""
    res = classify_raw_text(payload.description)
    return ClassifyTextResponse(
        incident_type=res["incident_type"],
        severity=res["severity"],
        priority=res["priority"],
        confidence=res["confidence"],
        method=res["method"],
    )


@router.post("", response_model=IncidentRead, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> IncidentRead:
    incident = incident_service.create_incident(db, payload)
    return IncidentRead.model_validate(incident)


@router.get("", response_model=list[IncidentRead])
def list_incidents(limit: int = 100, offset: int = 0, db: Session = Depends(get_db)) -> list[IncidentRead]:
    incidents = incident_service.list_incidents(db, limit=limit, offset=offset)
    return [IncidentRead.model_validate(i) for i in incidents]


@router.get("/{incident_id}", response_model=IncidentRead)
def get_incident(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> IncidentRead:
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentRead.model_validate(incident)


@router.get("/{incident_id}/recommended-resources", response_model=list[ResourceUnitRead])
def recommended_resources(
    incident_id: uuid.UUID, limit: int = 5, db: Session = Depends(get_db)
) -> list[ResourceUnitRead]:
    resources = resource_service.recommend_for_incident(db, incident_id, limit=limit)
    return [ResourceUnitRead.model_validate(r) for r in resources]


@router.get("/{incident_id}/bundle", response_model=ResourceBundleResponse)
def recommended_bundle(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> ResourceBundleResponse:
    """Get optimal multi-unit response bundle with travel ETAs tailored to incident severity."""
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    raw_bundle = resource_service.recommend_bundle_for_incident(db, incident_id)
    bundle_items: dict[str, list[ResourceBundleItem]] = {
        r_type: [
            ResourceBundleItem(
                unit=ResourceUnitRead.model_validate(item["unit"]),
                eta_minutes=item["eta_minutes"],
            )
            for item in items
        ]
        for r_type, items in raw_bundle.items()
    }
    return ResourceBundleResponse(incident_id=incident_id, bundle=bundle_items)


@router.get("/{incident_id}/summary", response_model=IncidentSummary)
def incident_summary(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> IncidentSummary:
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    summary, ai_generated = summary_service.generate_summary(incident)
    return IncidentSummary(incident_id=incident.id, summary=summary, ai_generated=ai_generated)


@router.get("/{incident_id}/cascade-risk", response_model=CascadeRiskResponse)
def get_incident_cascade_risk(
    incident_id: uuid.UUID,
    wind_speed_kmh: float = 16.0,
    wind_direction_deg: float = 45.0,
    temperature_c: float = 28.0,
    humidity_pct: float = 65.0,
    db: Session = Depends(get_db),
) -> CascadeRiskResponse:
    """Forecast predictive cascade escalation risk, atmospheric dispersion plume,
    secondary hazards, and civic infrastructure threats."""
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    lat = incident.latitude if incident.latitude is not None else 12.9716
    lon = incident.longitude if incident.longitude is not None else 77.5946

    forecast = forecast_cascade_risk(
        incident_type=incident.incident_type,
        severity=incident.severity,
        priority=incident.priority,
        inc_lat=lat,
        inc_lon=lon,
        wind_speed_kmh=wind_speed_kmh,
        wind_direction_deg=wind_direction_deg,
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
    )

    return CascadeRiskResponse(incident_id=incident_id, **forecast)


@router.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image(payload: ImageAnalysisRequest) -> ImageAnalysisResponse:
    """Perform multi-modal visual damage assessment and false-alarm verification."""
    try:
        return analyze_incident_image(
            image_base64=payload.image_base64,
            incident_type=payload.incident_type_hint,
            context_description=payload.context_description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{incident_id}/analyze-image", response_model=ImageAnalysisResponse)
def analyze_incident_image_attachment(
    incident_id: uuid.UUID,
    payload: ImageAnalysisRequest,
    db: Session = Depends(get_db),
) -> ImageAnalysisResponse:
    """Analyze emergency photo attached to an active incident."""
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        return analyze_incident_image(
            image_base64=payload.image_base64,
            incident_type=payload.incident_type_hint or incident.incident_type,
            context_description=payload.context_description or incident.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
