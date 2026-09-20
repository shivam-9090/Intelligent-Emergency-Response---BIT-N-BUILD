from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.ml.fleet_optimizer import optimize_fleet_dispatch
from app.models.enums import IncidentStatus, ResourceStatus, UserRole
from app.models.incident import Incident
from app.models.resource import ResourceUnit
from app.schemas.optimization import FleetOptimizationResponse
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


@router.post("/optimize-fleet", response_model=FleetOptimizationResponse)
def optimize_fleet(db: Session = Depends(get_db)) -> FleetOptimizationResponse:
    """Execute global bipartite matching between active incidents and available resources.

    Uses Scipy's Hungarian Algorithm to minimize city-wide response delay and casualty risk.
    """
    active_incidents = (
        db.query(Incident)
        .filter(Incident.status.in_([IncidentStatus.REPORTED, IncidentStatus.VERIFIED]))
        .all()
    )
    avail_resources = db.query(ResourceUnit).filter(ResourceUnit.status == ResourceStatus.AVAILABLE).all()

    inc_dicts = [
        {
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "priority": inc.priority,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "address": inc.address,
            "created_at": inc.created_at.isoformat() if inc.created_at else "",
        }
        for inc in active_incidents
    ]

    res_dicts = [
        {
            "id": res.id,
            "name": res.name,
            "resource_type": res.resource_type,
            "capability": res.capability,
            "latitude": res.latitude,
            "longitude": res.longitude,
        }
        for res in avail_resources
    ]

    result = optimize_fleet_dispatch(inc_dicts, res_dicts)
    return FleetOptimizationResponse.model_validate(result)
