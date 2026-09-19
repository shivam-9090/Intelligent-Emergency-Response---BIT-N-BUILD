from app.models.enums import IncidentType, Severity

_TYPE_BASE_SEVERITY: dict[IncidentType, Severity] = {
    IncidentType.FIRE: Severity.HIGH,
    IncidentType.FLOOD: Severity.HIGH,
    IncidentType.INDUSTRIAL_ACCIDENT: Severity.CRITICAL,
    IncidentType.ROAD_ACCIDENT: Severity.MEDIUM,
    IncidentType.MEDICAL: Severity.HIGH,
    IncidentType.OTHER: Severity.LOW,
}

_SEVERITY_KEYWORDS: dict[Severity, tuple[str, ...]] = {
    Severity.CRITICAL: ("explosion", "collapse", "mass casualty", "trapped", "multiple injured"),
    Severity.HIGH: ("fire", "flood", "injured", "unconscious", "spreading"),
    Severity.MEDIUM: ("minor injury", "blocked", "smoke"),
}

_SEVERITY_PRIORITY: dict[Severity, int] = {
    Severity.CRITICAL: 1,
    Severity.HIGH: 2,
    Severity.MEDIUM: 3,
    Severity.LOW: 4,
}


def classify_incident(incident_type: IncidentType, description: str | None) -> tuple[Severity, int]:
    """Rule-based severity/priority placeholder.

    Upgrade path: replace with a trained classifier (scikit-learn) or LLM call
    once labeled incident data is available. Keeps the same return signature.
    """
    severity = _TYPE_BASE_SEVERITY.get(incident_type, Severity.LOW)

    text = (description or "").lower()
    for candidate_severity, keywords in _SEVERITY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            if _SEVERITY_PRIORITY[candidate_severity] < _SEVERITY_PRIORITY[severity]:
                severity = candidate_severity
            break

    priority = _SEVERITY_PRIORITY[severity]
    return severity, priority
