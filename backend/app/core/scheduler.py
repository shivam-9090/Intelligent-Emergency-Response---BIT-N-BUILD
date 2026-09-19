import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.alert_service import check_delayed_responses, check_escalations

logger = logging.getLogger(__name__)

settings = get_settings()

scheduler = BackgroundScheduler()


def run_alert_checks() -> None:
    db = SessionLocal()
    try:
        delayed = check_delayed_responses(db)
        escalations = check_escalations(db)
        if delayed or escalations:
            logger.info(
                "Alert checks generated %d delayed-response and %d escalation alerts",
                len(delayed),
                len(escalations),
            )
    finally:
        db.close()


def start_scheduler() -> None:
    if not settings.enable_scheduler:
        return
    if scheduler.running:
        return
    scheduler.add_job(
        run_alert_checks,
        trigger="interval",
        minutes=settings.alert_check_interval_minutes,
        id="alert_checks",
        replace_existing=True,
    )
    scheduler.start()


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
