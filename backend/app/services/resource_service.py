import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.resource_matching import recommend_resources
from app.models.enums import ResourceStatus
from app.models.incident import Incident
from app.models.resource import ResourceUnit
from app.schemas.resource import ResourceUnitCreate


def create_resource(db: Session, payload: ResourceUnitCreate) -> ResourceUnit:
    resource = ResourceUnit(
        name=payload.name,
        resource_type=payload.resource_type,
        capability=payload.capability,
        latitude=payload.latitude,
        longitude=payload.longitude,
        assigned_user_id=payload.assigned_user_id,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def list_resources(db: Session, limit: int = 100, offset: int = 0) -> list[ResourceUnit]:
    result = db.execute(select(ResourceUnit).offset(offset).limit(limit))
    return list(result.scalars().all())


def recommend_for_incident(db: Session, incident_id: uuid.UUID, limit: int = 5) -> list[ResourceUnit]:
    incident = db.get(Incident, incident_id)
    if incident is None:
        return []

    available = list(
        db.execute(select(ResourceUnit).where(ResourceUnit.status == ResourceStatus.AVAILABLE))
        .scalars()
        .all()
    )
    return recommend_resources(incident, available, limit=limit)
