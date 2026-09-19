import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentStatusUpdate
from app.services import assignment_service
from app.services.assignment_service import NotFoundError, ResourceUnavailableError

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentRead, status_code=201)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db)) -> AssignmentRead:
    try:
        assignment = assignment_service.create_assignment(db, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ResourceUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return AssignmentRead.model_validate(assignment)


@router.get("", response_model=list[AssignmentRead])
def list_assignments(
    incident_id: uuid.UUID | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[AssignmentRead]:
    assignments = assignment_service.list_assignments(db, incident_id=incident_id, limit=limit, offset=offset)
    return [AssignmentRead.model_validate(a) for a in assignments]


@router.patch("/{assignment_id}/status", response_model=AssignmentRead)
def update_assignment_status(
    assignment_id: uuid.UUID, payload: AssignmentStatusUpdate, db: Session = Depends(get_db)
) -> AssignmentRead:
    try:
        assignment = assignment_service.update_assignment_status(db, assignment_id, payload.status)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return AssignmentRead.model_validate(assignment)
