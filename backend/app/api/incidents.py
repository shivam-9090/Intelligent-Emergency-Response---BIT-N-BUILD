import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.incident import IncidentCreate, IncidentRead
from app.schemas.resource import ResourceUnitRead
from app.schemas.summary import IncidentSummary
from app.services import incident_service, resource_service, summary_service

router = APIRouter(prefix="/incidents", tags=["incidents"])


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


@router.get("/{incident_id}/summary", response_model=IncidentSummary)
def incident_summary(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> IncidentSummary:
    incident = incident_service.get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    summary, ai_generated = summary_service.generate_summary(incident)
    return IncidentSummary(incident_id=incident.id, summary=summary, ai_generated=ai_generated)
