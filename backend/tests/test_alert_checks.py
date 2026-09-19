from datetime import UTC, datetime, timedelta

from app.models.enums import IncidentSource, IncidentStatus, IncidentType
from app.models.incident import Incident
from app.services.alert_service import check_delayed_responses, check_escalations


def _stale_incident(db_session, **overrides):
    defaults = {
        "title": "Unattended incident",
        "source": IncidentSource.CITIZEN_REPORT,
        "incident_type": IncidentType.ROAD_ACCIDENT,
        "status": IncidentStatus.REPORTED,
        "priority": 3,
        "reported_at": datetime.now(UTC) - timedelta(minutes=45),
    }
    defaults.update(overrides)
    incident = Incident(**defaults)
    db_session.add(incident)
    db_session.commit()
    db_session.refresh(incident)
    return incident


def test_check_delayed_responses_flags_stale_incident(db_session):
    incident = _stale_incident(db_session)

    alerts = check_delayed_responses(db_session, threshold_minutes=30)
    assert len(alerts) == 1
    assert alerts[0].incident_id == incident.id
    assert alerts[0].alert_type.value == "delayed_response"


def test_check_delayed_responses_ignores_recent_incident(db_session):
    _stale_incident(db_session, reported_at=datetime.now(UTC) - timedelta(minutes=5))
    assert check_delayed_responses(db_session, threshold_minutes=30) == []


def test_check_delayed_responses_ignores_duplicate_report(db_session):
    canonical = _stale_incident(db_session)
    _stale_incident(db_session, duplicate_of_id=canonical.id)
    alerts = check_delayed_responses(db_session, threshold_minutes=30)
    assert len(alerts) == 1
    assert alerts[0].incident_id == canonical.id


def test_check_delayed_responses_does_not_duplicate_alerts(db_session):
    _stale_incident(db_session)
    first = check_delayed_responses(db_session, threshold_minutes=30)
    second = check_delayed_responses(db_session, threshold_minutes=30)
    assert len(first) == 1
    assert len(second) == 0


def test_check_escalations_flags_stale_high_priority_incident(db_session):
    incident = _stale_incident(db_session, priority=1, reported_at=datetime.now(UTC) - timedelta(minutes=90))

    alerts = check_escalations(db_session, threshold_minutes=60)
    assert len(alerts) == 1
    assert alerts[0].incident_id == incident.id
    assert alerts[0].alert_type.value == "escalation"


def test_check_escalations_ignores_low_priority_incident(db_session):
    _stale_incident(db_session, priority=4, reported_at=datetime.now(UTC) - timedelta(minutes=90))
    assert check_escalations(db_session, threshold_minutes=60) == []
