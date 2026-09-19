import math

from app.models.incident import Incident

_DISTANCE_THRESHOLD_KM = 0.5
_TIME_WINDOW_SECONDS = 3600


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def find_duplicate(new_incident: Incident, candidates: list[Incident]) -> Incident | None:
    """Naive proximity + type + time-window duplicate check.

    Upgrade path: add text-similarity (embeddings) over title/description once
    a duplicate-labeled dataset exists.
    """
    if new_incident.latitude is None or new_incident.longitude is None:
        return None

    for candidate in candidates:
        if candidate.incident_type != new_incident.incident_type:
            continue
        if candidate.latitude is None or candidate.longitude is None:
            continue

        seconds_apart = abs((new_incident.reported_at - candidate.reported_at).total_seconds())
        if seconds_apart > _TIME_WINDOW_SECONDS:
            continue

        distance = _haversine_km(
            new_incident.latitude, new_incident.longitude, candidate.latitude, candidate.longitude
        )
        if distance <= _DISTANCE_THRESHOLD_KM:
            return candidate

    return None
