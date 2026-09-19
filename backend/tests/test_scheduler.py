from datetime import UTC, datetime, timedelta

from app.core import scheduler as scheduler_module
from app.models.enums import IncidentSource, IncidentStatus, IncidentType
from app.models.incident import Incident


def test_start_scheduler_noop_when_disabled(monkeypatch):
    monkeypatch.setattr(scheduler_module.settings, "enable_scheduler", False)
    scheduler_module.start_scheduler()
    assert not scheduler_module.scheduler.running


def test_run_alert_checks_creates_alerts(monkeypatch, db_session):
    incident = Incident(
        title="Stale incident",
        source=IncidentSource.SENSOR,
        incident_type=IncidentType.FLOOD,
        status=IncidentStatus.REPORTED,
        priority=3,
        reported_at=datetime.now(UTC) - timedelta(minutes=45),
    )
    db_session.add(incident)
    db_session.commit()

    monkeypatch.setattr(scheduler_module, "SessionLocal", lambda: db_session)
    monkeypatch.setattr(db_session, "close", lambda: None)

    scheduler_module.run_alert_checks()

    db_session.refresh(incident)
    assert len(incident.alerts) == 1
    assert incident.alerts[0].alert_type.value == "delayed_response"
