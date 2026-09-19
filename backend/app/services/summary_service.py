from app.core.llm import generate_incident_summary
from app.models.incident import Incident


def _build_prompt(incident: Incident) -> str:
    location = incident.address or (
        f"{incident.latitude}, {incident.longitude}" if incident.latitude is not None else "unknown"
    )
    return (
        f"Incident type: {incident.incident_type.value}\n"
        f"Severity: {incident.severity.value}\n"
        f"Priority: {incident.priority}\n"
        f"Status: {incident.status.value}\n"
        f"Title: {incident.title}\n"
        f"Description: {incident.description or 'No additional description provided.'}\n"
        f"Location: {location}\n"
    )


def _fallback_summary(incident: Incident) -> str:
    incident_type = incident.incident_type.value.replace("_", " ")
    status = incident.status.value.replace("_", " ")
    return (
        f"{incident.severity.value.capitalize()}-severity {incident_type} incident reported: "
        f"{incident.title}. Current status: {status}. Assign appropriate resources and monitor "
        "for escalation."
    )


def generate_summary(incident: Incident) -> tuple[str, bool]:
    """Returns (summary_text, ai_generated). Falls back to a template summary
    when the LLM is disabled or the request fails."""
    ai_summary = generate_incident_summary(_build_prompt(incident))
    if ai_summary:
        return ai_summary.strip(), True
    return _fallback_summary(incident), False
