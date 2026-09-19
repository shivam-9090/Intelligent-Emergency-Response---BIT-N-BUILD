from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.email import send_email
from app.models.alert import Alert
from app.models.enums import UserRole
from app.models.incident import Incident
from app.models.user import User


def _dispatch_recipient_emails(db: Session) -> list[str]:
    return list(
        db.execute(
            select(User.email)
            .where(User.role.in_([UserRole.ADMIN, UserRole.DISPATCHER]))
            .where(User.is_active.is_(True))
        ).scalars()
    )


def notify_alert_created(db: Session, alert: Alert, incident: Incident) -> None:
    recipients = _dispatch_recipient_emails(db)
    if not recipients:
        return

    subject = f"[{alert.alert_type.value.upper()}] {incident.title}"
    body = (
        f"Alert type: {alert.alert_type.value}\n"
        f"Incident: {incident.title}\n"
        f"Severity: {incident.severity.value}\n"
        f"Status: {incident.status.value}\n"
        f"\n{alert.message}\n"
    )
    send_email(recipients, subject, body)
