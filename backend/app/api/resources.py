from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.enums import UserRole
from app.schemas.resource import ResourceUnitCreate, ResourceUnitRead
from app.services import resource_service

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post(
    "",
    response_model=ResourceUnitRead,
    status_code=201,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.DISPATCHER))],
)
def create_resource(payload: ResourceUnitCreate, db: Session = Depends(get_db)) -> ResourceUnitRead:
    resource = resource_service.create_resource(db, payload)
    return ResourceUnitRead.model_validate(resource)


@router.get("", response_model=list[ResourceUnitRead])
def list_resources(
    limit: int = 100, offset: int = 0, db: Session = Depends(get_db)
) -> list[ResourceUnitRead]:
    resources = resource_service.list_resources(db, limit=limit, offset=offset)
    return [ResourceUnitRead.model_validate(r) for r in resources]
