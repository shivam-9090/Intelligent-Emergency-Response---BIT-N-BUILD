import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.models.enums import IncidentType, Severity

logger = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).resolve().parent / "model_weights" / "incident_classifier.joblib"

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


@lru_cache(maxsize=1)
def _get_model_artifacts() -> dict[str, Any] | None:
    """Load serialized model artifacts with caching and safe error handling."""
    if not _MODEL_PATH.exists():
        logger.info("ML model weights not found at %s. Using rule-based classifier.", _MODEL_PATH)
        return None

    try:
        import joblib

        artifacts = joblib.load(_MODEL_PATH)
        version = artifacts.get("version")
        logger.info("Loaded ML models from %s (version %s)", _MODEL_PATH, version)
        return artifacts
    except Exception as exc:
        logger.warning("Failed to load ML models from %s: %s. Falling back to rules.", _MODEL_PATH, exc)
        return None


def _rule_based_classify(incident_type: IncidentType, description: str | None) -> tuple[Severity, int]:
    severity = _TYPE_BASE_SEVERITY.get(incident_type, Severity.LOW)

    text = (description or "").lower()
    for candidate_severity, keywords in _SEVERITY_KEYWORDS.items():
        if any(keyword in text for keyword in keywords):
            if _SEVERITY_PRIORITY[candidate_severity] < _SEVERITY_PRIORITY[severity]:
                severity = candidate_severity
            break

    priority = _SEVERITY_PRIORITY[severity]
    return severity, priority


def classify_incident(incident_type: IncidentType, description: str | None) -> tuple[Severity, int]:
    """Classify incident severity and priority using trained ML model with safety net override."""
    rule_sev, rule_prio = _rule_based_classify(incident_type, description)
    artifacts = _get_model_artifacts()
    if artifacts is None or not description:
        return rule_sev, rule_prio

    try:
        severity_pipeline = artifacts.get("severity_pipeline")
        if severity_pipeline is not None:
            # Safety check: if high-risk critical keywords are explicitly present, ensure critical priority
            text_lower = description.lower()
            if any(k in text_lower for k in _SEVERITY_KEYWORDS[Severity.CRITICAL]):
                return Severity.CRITICAL, 1

            input_text = f"[{incident_type.value}] {description}"
            predicted_sev_str = severity_pipeline.predict([input_text])[0]
            ml_sev = Severity(predicted_sev_str)
            ml_prio = _SEVERITY_PRIORITY[ml_sev]

            # Safety floor: explicit high-risk keywords must never be downgraded below HIGH
            if any(k in text_lower for k in _SEVERITY_KEYWORDS[Severity.HIGH]) and ml_prio > 2:
                return Severity.HIGH, 2

            return ml_sev, ml_prio
    except Exception as exc:
        logger.warning("ML prediction failed for incident: %s. Using rule fallback.", exc)

    return rule_sev, rule_prio


def classify_raw_text(description: str) -> dict[str, Any]:
    """Classify unformatted incoming emergency text directly.

    Predicts incident_type, severity, priority, and returns confidence metrics.
    """
    artifacts = _get_model_artifacts()
    if not description:
        return {
            "incident_type": IncidentType.OTHER,
            "severity": Severity.LOW,
            "priority": 4,
            "confidence": 0.0,
            "method": "default",
        }

    if artifacts is not None:
        try:
            type_pipeline = artifacts.get("type_pipeline")
            if type_pipeline is not None:
                predicted_type_str = type_pipeline.predict([description])[0]
                incident_type = IncidentType(predicted_type_str)

                # Get confidence score
                probs = type_pipeline.predict_proba([description])[0]
                confidence = float(max(probs))

                severity, priority = classify_incident(incident_type, description)
                return {
                    "incident_type": incident_type,
                    "severity": severity,
                    "priority": priority,
                    "confidence": round(confidence, 3),
                    "method": "ml_pipeline",
                }
        except Exception as exc:
            logger.warning("Error in classify_raw_text: %s", exc)

    # Heuristic fallback for raw text
    text_lower = description.lower()
    matched_type = IncidentType.OTHER
    if any(w in text_lower for w in ("fire", "smoke", "burning", "flames")):
        matched_type = IncidentType.FIRE
    elif any(w in text_lower for w in ("flood", "submerged", "waterlogging", "river", "drowning")):
        matched_type = IncidentType.FLOOD
    elif any(w in text_lower for w in ("chemical", "ammonia", "factory", "boiler", "hazmat")):
        matched_type = IncidentType.INDUSTRIAL_ACCIDENT
    elif any(w in text_lower for w in ("crash", "collision", "vehicle", "highway", "car")):
        matched_type = IncidentType.ROAD_ACCIDENT
    elif any(w in text_lower for w in ("cardiac", "stroke", "unconscious", "breathing", "hospital")):
        matched_type = IncidentType.MEDICAL

    severity, priority = _rule_based_classify(matched_type, description)
    return {
        "incident_type": matched_type,
        "severity": severity,
        "priority": priority,
        "confidence": 0.5,
        "method": "heuristic_fallback",
    }
