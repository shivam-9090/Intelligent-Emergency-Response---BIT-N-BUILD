import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.enums import AlertType, IncidentStatus, Severity
from app.models.incident import Incident

DELAYED_RESPONSE_MINUTES = 30
ESCALATION_MINUTES = 60


def create_alert(db: Session, incident_id: uuid.UUID, alert_type: AlertType, message: str) -> Alert:
    alert = Alert(incident_id=incident_id, alert_type=alert_type, message=message)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def _has_unresolved_alert(db: Session, incident_id: uuid.UUID, alert_type: AlertType) -> bool:
    existing = db.execute(
        select(Alert)
        .where(Alert.incident_id == incident_id)
        .where(Alert.alert_type == alert_type)
        .where(Alert.resolved.is_(False))
    ).scalar_one_or_none()
    return existing is not None


def generate_critical_incident_alert(db: Session, incident: Incident) -> Alert | None:
    if incident.severity != Severity.CRITICAL:
        return None
    if _has_unresolved_alert(db, incident.id, AlertType.CRITICAL_INCIDENT):
        return None
    return create_alert(
        db,
        incident.id,
        AlertType.CRITICAL_INCIDENT,
        f"Critical incident reported: {incident.title}",
    )


def check_delayed_responses(db: Session, threshold_minutes: int = DELAYED_RESPONSE_MINUTES) -> list[Alert]:
    cutoff = datetime.now(UTC) - timedelta(minutes=threshold_minutes)
    stale_incidents = (
        db.execute(
            select(Incident)
            .where(Incident.status.in_([IncidentStatus.REPORTED, IncidentStatus.VERIFIED]))
            .where(Incident.reported_at < cutoff)
        )
        .scalars()
        .all()
    )

    created = []
    for incident in stale_incidents:
        if _has_unresolved_alert(db, incident.id, AlertType.DELAYED_RESPONSE):
            continue
        alert = create_alert(
            db,
            incident.id,
            AlertType.DELAYED_RESPONSE,
            f"No response assigned for '{incident.title}' after {threshold_minutes} minutes",
        )
        created.append(alert)
    return created


def check_escalations(db: Session, threshold_minutes: int = ESCALATION_MINUTES) -> list[Alert]:
    cutoff = datetime.now(UTC) - timedelta(minutes=threshold_minutes)
    overdue_incidents = (
        db.execute(
            select(Incident)
            .where(Incident.status.in_([IncidentStatus.REPORTED, IncidentStatus.VERIFIED]))
            .where(Incident.priority <= 2)
            .where(Incident.reported_at < cutoff)
        )
        .scalars()
        .all()
    )

    created = []
    for incident in overdue_incidents:
        if _has_unresolved_alert(db, incident.id, AlertType.ESCALATION):
            continue
        alert = create_alert(
            db,
            incident.id,
            AlertType.ESCALATION,
            f"High-priority incident '{incident.title}' requires escalation "
            f"after {threshold_minutes} minutes without assignment",
        )
        created.append(alert)
    return created


def list_alerts(db: Session, resolved: bool | None = None, limit: int = 100, offset: int = 0) -> list[Alert]:
    query = select(Alert)
    if resolved is not None:
        query = query.where(Alert.resolved.is_(resolved))
    query = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
    return list(db.execute(query).scalars().all())


def resolve_alert(db: Session, alert_id: uuid.UUID) -> Alert | None:
    alert = db.get(Alert, alert_id)
    if alert is None:
        return None
    alert.resolved = True
    db.commit()
    db.refresh(alert)
    return alert
