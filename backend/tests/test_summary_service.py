from app.models.enums import IncidentSource, IncidentStatus, IncidentType, Severity
from app.models.incident import Incident
from app.services import summary_service


def _incident(**overrides):
    defaults = {
        "title": "Warehouse fire",
        "description": "Large fire, smoke visible",
        "source": IncidentSource.CITIZEN_REPORT,
        "incident_type": IncidentType.FIRE,
        "severity": Severity.HIGH,
        "priority": 2,
        "status": IncidentStatus.REPORTED,
    }
    defaults.update(overrides)
    return Incident(**defaults)


def test_generate_summary_uses_ai_output_when_available(monkeypatch):
    monkeypatch.setattr(summary_service, "generate_incident_summary", lambda prompt: "AI-written summary.")
    text, ai_generated = summary_service.generate_summary(_incident())
    assert text == "AI-written summary."
    assert ai_generated is True


def test_generate_summary_falls_back_when_llm_disabled(monkeypatch):
    monkeypatch.setattr(summary_service, "generate_incident_summary", lambda prompt: None)
    text, ai_generated = summary_service.generate_summary(_incident())
    assert ai_generated is False
    assert "Warehouse fire" in text
    assert "high" in text.lower() or "High" in text
