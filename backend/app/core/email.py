import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


def send_email(to: list[str], subject: str, body: str) -> None:
    """Send a plain-text email over SMTP.

    Works with a plain SMTP server or an SMTP relay such as SendGrid's
    (smtp.sendgrid.net) — no provider-specific SDK needed. No-ops when
    email notifications are disabled or misconfigured, so it's always
    safe to call from service code without extra guards at call sites.
    """
    if not settings.enable_email_notifications or not to:
        return

    if not settings.smtp_host:
        logger.warning("Email notifications enabled but SMTP_HOST is not configured, skipping send")
        return

    try:
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.smtp_from_email
        message["To"] = ", ".join(to)
        message.set_content(body)

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_username:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(message)
    except (OSError, smtplib.SMTPException, ValueError):
        logger.exception("Failed to send email notification to %s", to)
