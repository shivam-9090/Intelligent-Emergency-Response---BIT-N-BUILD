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


def _sanitize_header_value(value: str) -> str:
    """Strips CR/LF so user-supplied text (e.g. incident.title) can't break
    email header assignment. Python's email.message.EmailMessage already
    rejects raw CR/LF in header values by raising ValueError, but stripping
    here keeps the subject line legible instead of failing outright."""
    return value.replace("\r", " ").replace("\n", " ")


def notify_alert_created(db: Session, alert: Alert, incident: Incident) -> None:
    recipients = _dispatch_recipient_emails(db)
    if not recipients:
        return

    safe_title = _sanitize_header_value(incident.title)
    subject = f"[{alert.alert_type.value.upper()}] {safe_title}"
    body = (
        f"Alert type: {alert.alert_type.value}\n"
        f"Incident: {incident.title}\n"
        f"Severity: {incident.severity.value}\n"
        f"Status: {incident.status.value}\n"
        f"\n{alert.message}\n"
    )
    send_email(recipients, subject, body)
