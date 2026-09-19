import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentRead, AssignmentStatusUpdate
from app.services import assignment_service
from app.services.assignment_service import ForbiddenError, NotFoundError, ResourceUnavailableError

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post(
    "",
    response_model=AssignmentRead,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.DISPATCHER))],
)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db)) -> AssignmentRead:
    try:
        assignment = assignment_service.create_assignment(db, payload)
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ResourceUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return AssignmentRead.model_validate(assignment)


@router.get("", response_model=list[AssignmentRead], dependencies=[Depends(get_current_user)])
def list_assignments(
    incident_id: uuid.UUID | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[AssignmentRead]:
    assignments = assignment_service.list_assignments(db, incident_id=incident_id, limit=limit, offset=offset)
    return [AssignmentRead.model_validate(a) for a in assignments]


@router.patch(
    "/{assignment_id}/status",
    response_model=AssignmentRead,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.FIELD_TEAM))],
)
def update_assignment_status(
    assignment_id: uuid.UUID,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssignmentRead:
    try:
        assignment = assignment_service.update_assignment_status(
            db, assignment_id, payload.status, current_user
        )
    except NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ForbiddenError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return AssignmentRead.model_validate(assignment)
