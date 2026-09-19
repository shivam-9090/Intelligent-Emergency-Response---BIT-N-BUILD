import time

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.demand_forecaster import demand_engine
from app.models.incident import Incident
from app.schemas.analytics import (
    Hotspot,
    IncidentBreakdown,
    ModelEvaluationSummary,
    ResourceShortage,
    ResponseDelayStats,
)
from app.schemas.demand_prediction import PredictiveDemandResponse
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])

_DEMAND_CACHE: dict[int, tuple[float, PredictiveDemandResponse]] = {}
_DEMAND_CACHE_TTL_SECONDS = 30.0


@router.get("/incidents", response_model=IncidentBreakdown)
def incident_breakdown(db: Session = Depends(get_db)) -> IncidentBreakdown:
    return analytics_service.get_incident_breakdown(db)


@router.get("/response-delays", response_model=ResponseDelayStats)
def response_delays(db: Session = Depends(get_db)) -> ResponseDelayStats:
    return analytics_service.get_response_delay_stats(db)


@router.get("/resource-shortages", response_model=list[ResourceShortage])
def resource_shortages(db: Session = Depends(get_db)) -> list[ResourceShortage]:
    return analytics_service.get_resource_shortages(db)


@router.get("/hotspots", response_model=list[Hotspot])
def hotspots(limit: int = 10, db: Session = Depends(get_db)) -> list[Hotspot]:
    return analytics_service.get_hotspots(db, limit=limit)


@router.get("/predictive-demand-forecast", response_model=PredictiveDemandResponse)
def predictive_demand_forecast(
    horizon_hours: int = 2,
    db: Session = Depends(get_db),
) -> PredictiveDemandResponse:
    clamped_horizon = max(1, min(24, horizon_hours))
    now = time.time()
    cached = _DEMAND_CACHE.get(clamped_horizon)
    if cached is not None:
        cached_time, cached_response = cached
        if now - cached_time < _DEMAND_CACHE_TTL_SECONDS:
            return cached_response

    incidents = (
        db.execute(
            select(Incident).where(Incident.latitude.is_not(None)).where(Incident.longitude.is_not(None))
        )
        .scalars()
        .all()
    )

    incident_dicts = [
        {
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "severity": inc.severity.value,
            "incident_type": inc.incident_type.value,
        }
        for inc in incidents
    ]

    forecast = demand_engine.compute_forecast(
        incidents=incident_dicts,
        forecast_horizon_hours=clamped_horizon,
    )
    _DEMAND_CACHE[clamped_horizon] = (now, forecast)
    return forecast


@router.get("/model-evaluation", response_model=ModelEvaluationSummary)
def model_evaluation() -> ModelEvaluationSummary:
    return analytics_service.get_model_evaluation_metrics()
