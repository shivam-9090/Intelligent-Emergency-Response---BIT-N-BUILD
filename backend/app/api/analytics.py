from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics import Hotspot, IncidentBreakdown, ResourceShortage, ResponseDelayStats
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


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
