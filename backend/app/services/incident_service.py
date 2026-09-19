import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.classification import classify_incident
from app.ml.duplicate_detection import find_duplicate
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate
from app.services.alert_service import generate_critical_incident_alert


def create_incident(db: Session, payload: IncidentCreate) -> Incident:
    severity, priority = classify_incident(payload.incident_type, payload.description)

    incident = Incident(
        title=payload.title,
        description=payload.description,
        source=payload.source,
        incident_type=payload.incident_type,
        severity=severity,
        priority=priority,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
    )

    db.add(incident)
    db.flush()

    recent_candidates = (
        db.execute(
            select(Incident)
            .where(Incident.incident_type == payload.incident_type)
            .where(Incident.id != incident.id)
            .where(Incident.duplicate_of_id.is_(None))
        )
        .scalars()
        .all()
    )
    duplicate = find_duplicate(incident, list(recent_candidates))
    if duplicate is not None:
        incident.duplicate_of_id = duplicate.id

    db.commit()
    db.refresh(incident)

    generate_critical_incident_alert(db, incident)

    return incident


def list_incidents(db: Session, limit: int = 100, offset: int = 0) -> list[Incident]:
    result = db.execute(select(Incident).order_by(Incident.reported_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all())


def get_incident(db: Session, incident_id: uuid.UUID) -> Incident | None:
    return db.get(Incident, incident_id)
