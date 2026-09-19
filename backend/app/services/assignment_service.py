import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.realtime import manager
from app.models.assignment import Assignment
from app.models.enums import AssignmentStatus, IncidentStatus, ResourceStatus, UserRole
from app.models.incident import Incident
from app.models.resource import ResourceUnit
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentRead
from app.schemas.incident import IncidentRead


class ResourceUnavailableError(Exception):
    pass


class NotFoundError(Exception):
    pass


class ForbiddenError(Exception):
    pass


def create_assignment(db: Session, payload: AssignmentCreate) -> Assignment:
    incident = db.get(Incident, payload.incident_id)
    if incident is None:
        raise NotFoundError("Incident not found")

    resource = db.get(ResourceUnit, payload.resource_id)
    if resource is None:
        raise NotFoundError("Resource not found")

    if resource.status != ResourceStatus.AVAILABLE:
        raise ResourceUnavailableError("Resource is not available")

    assignment = Assignment(incident_id=incident.id, resource_id=resource.id)
    db.add(assignment)

    resource.status = ResourceStatus.ASSIGNED
    if incident.status in (IncidentStatus.REPORTED, IncidentStatus.VERIFIED):
        incident.status = IncidentStatus.ASSIGNED

    db.commit()
    db.refresh(assignment)

    manager.broadcast_event(
        "assignment_created", AssignmentRead.model_validate(assignment).model_dump(mode="json")
    )

    return assignment


def update_assignment_status(
    db: Session, assignment_id: uuid.UUID, status: AssignmentStatus, current_user: User
) -> Assignment:
    assignment = db.get(Assignment, assignment_id)
    if assignment is None:
        raise NotFoundError("Assignment not found")

    resource = db.get(ResourceUnit, assignment.resource_id)

    if current_user.role == UserRole.FIELD_TEAM and (
        resource is None or resource.assigned_user_id != current_user.id
    ):
        raise ForbiddenError("You can only update assignments for resources assigned to you")

    assignment.status = status
    incident = db.get(Incident, assignment.incident_id)
    incident_status_before = incident.status if incident is not None else None

    if resource is not None and status in (AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED):
        resource.status = ResourceStatus.AVAILABLE
    elif resource is not None and status in (AssignmentStatus.EN_ROUTE, AssignmentStatus.ON_SCENE):
        resource.status = ResourceStatus.ASSIGNED

    if incident is not None:
        if status == AssignmentStatus.ON_SCENE and incident.status == IncidentStatus.ASSIGNED:
            incident.status = IncidentStatus.IN_PROGRESS
        elif status == AssignmentStatus.COMPLETED:
            remaining = (
                db.execute(
                    select(Assignment)
                    .where(Assignment.incident_id == incident.id)
                    .where(Assignment.id != assignment.id)
                    .where(Assignment.status.notin_([AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]))
                )
                .scalars()
                .all()
            )
            if not remaining:
                incident.status = IncidentStatus.RESOLVED

    db.commit()
    db.refresh(assignment)

    manager.broadcast_event(
        "assignment_status_updated", AssignmentRead.model_validate(assignment).model_dump(mode="json")
    )
    if incident is not None and incident.status != incident_status_before:
        db.refresh(incident)
        manager.broadcast_event(
            "incident_updated", IncidentRead.model_validate(incident).model_dump(mode="json")
        )

    return assignment


def list_assignments(
    db: Session, incident_id: uuid.UUID | None = None, limit: int = 100, offset: int = 0
) -> list[Assignment]:
    query = select(Assignment)
    if incident_id is not None:
        query = query.where(Assignment.incident_id == incident_id)
    query = query.order_by(Assignment.assigned_at.desc()).offset(offset).limit(limit)
    return list(db.execute(query).scalars().all())
