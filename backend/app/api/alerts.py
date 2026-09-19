import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.alert import AlertRead
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertRead])
def list_alerts(
    resolved: bool | None = None, limit: int = 100, offset: int = 0, db: Session = Depends(get_db)
) -> list[AlertRead]:
    alerts = alert_service.list_alerts(db, resolved=resolved, limit=limit, offset=offset)
    return [AlertRead.model_validate(a) for a in alerts]


@router.post("/{alert_id}/resolve", response_model=AlertRead)
def resolve_alert(alert_id: uuid.UUID, db: Session = Depends(get_db)) -> AlertRead:
    alert = alert_service.resolve_alert(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return AlertRead.model_validate(alert)


@router.post("/check-delayed", response_model=list[AlertRead])
def check_delayed_responses(db: Session = Depends(get_db)) -> list[AlertRead]:
    """Manually trigger the delayed-response check.

    Deferred: a scheduler (e.g. APScheduler or a Celery beat task) should run
    this periodically once notification delivery is wired up.
    """
    alerts = alert_service.check_delayed_responses(db)
    return [AlertRead.model_validate(a) for a in alerts]


@router.post("/check-escalations", response_model=list[AlertRead])
def check_escalations(db: Session = Depends(get_db)) -> list[AlertRead]:
    """Manually trigger the escalation check. Same scheduling caveat as above."""
    alerts = alert_service.check_escalations(db)
    return [AlertRead.model_validate(a) for a in alerts]
