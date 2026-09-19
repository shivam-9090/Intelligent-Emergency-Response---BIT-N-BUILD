from collections import defaultdict

from sqlalchemy import Numeric, cast, func, select
from sqlalchemy.orm import Session

from app.models.assignment import Assignment
from app.models.enums import ResourceStatus
from app.models.incident import Incident
from app.models.resource import ResourceUnit
from app.schemas.analytics import (
    Hotspot,
    IncidentBreakdown,
    IncidentTypeCount,
    ResourceShortage,
    ResponseDelayByType,
    ResponseDelayStats,
    SeverityCount,
)


def get_incident_breakdown(db: Session) -> IncidentBreakdown:
    total = db.execute(select(func.count()).select_from(Incident)).scalar_one()

    by_type_rows = db.execute(
        select(Incident.incident_type, func.count()).group_by(Incident.incident_type)
    ).all()
    by_severity_rows = db.execute(select(Incident.severity, func.count()).group_by(Incident.severity)).all()

    return IncidentBreakdown(
        total=total,
        by_type=[IncidentTypeCount(incident_type=t, count=c) for t, c in by_type_rows],
        by_severity=[SeverityCount(severity=s, count=c) for s, c in by_severity_rows],
    )


def get_response_delay_stats(db: Session) -> ResponseDelayStats:
    first_assignment = (
        select(Assignment.incident_id, func.min(Assignment.assigned_at).label("first_assigned_at"))
        .group_by(Assignment.incident_id)
        .subquery()
    )

    rows = db.execute(
        select(Incident.incident_type, Incident.reported_at, first_assignment.c.first_assigned_at).join(
            first_assignment, first_assignment.c.incident_id == Incident.id
        )
    ).all()

    minutes_by_type = defaultdict(list)
    all_minutes = []
    for incident_type, reported_at, first_assigned_at in rows:
        if reported_at is None or first_assigned_at is None:
            continue
        minutes = (first_assigned_at - reported_at).total_seconds() / 60
        minutes_by_type[incident_type].append(minutes)
        all_minutes.append(minutes)

    by_type = [
        ResponseDelayByType(
            incident_type=incident_type,
            average_minutes=sum(values) / len(values),
            sample_size=len(values),
        )
        for incident_type, values in minutes_by_type.items()
    ]

    return ResponseDelayStats(
        overall_average_minutes=(sum(all_minutes) / len(all_minutes)) if all_minutes else None,
        overall_sample_size=len(all_minutes),
        by_type=by_type,
    )


def get_resource_shortages(db: Session) -> list[ResourceShortage]:
    rows = db.execute(
        select(ResourceUnit.resource_type, ResourceUnit.status, func.count()).group_by(
            ResourceUnit.resource_type, ResourceUnit.status
        )
    ).all()

    counts: dict = defaultdict(lambda: defaultdict(int))
    for resource_type, status, count in rows:
        counts[resource_type][status] = count

    shortages = []
    for resource_type, status_counts in counts.items():
        available = status_counts.get(ResourceStatus.AVAILABLE, 0)
        assigned = status_counts.get(ResourceStatus.ASSIGNED, 0)
        unavailable = status_counts.get(ResourceStatus.UNAVAILABLE, 0)
        total = available + assigned + unavailable
        shortages.append(
            ResourceShortage(
                resource_type=resource_type,
                total=total,
                available=available,
                assigned=assigned,
                unavailable=unavailable,
                shortage=available == 0 and total > 0,
            )
        )
    return shortages


def get_hotspots(db: Session, limit: int = 10) -> list[Hotspot]:
    lat_bucket = func.round(cast(Incident.latitude, Numeric), 2)
    lon_bucket = func.round(cast(Incident.longitude, Numeric), 2)

    rows = db.execute(
        select(lat_bucket, lon_bucket, func.count())
        .where(Incident.latitude.is_not(None))
        .where(Incident.longitude.is_not(None))
        .group_by(lat_bucket, lon_bucket)
        .order_by(func.count().desc())
        .limit(limit)
    ).all()

    return [Hotspot(latitude=lat, longitude=lon, count=count) for lat, lon, count in rows]
