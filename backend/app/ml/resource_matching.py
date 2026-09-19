import math

from app.models.enums import IncidentType, ResourceStatus, ResourceType
from app.models.incident import Incident
from app.models.resource import ResourceUnit

_INCIDENT_TYPE_RESOURCES: dict[IncidentType, tuple[ResourceType, ...]] = {
    IncidentType.FIRE: (ResourceType.VEHICLE, ResourceType.TEAM),
    IncidentType.FLOOD: (ResourceType.TEAM, ResourceType.EQUIPMENT),
    IncidentType.INDUSTRIAL_ACCIDENT: (ResourceType.TEAM, ResourceType.VEHICLE, ResourceType.EQUIPMENT),
    IncidentType.ROAD_ACCIDENT: (ResourceType.VEHICLE, ResourceType.TEAM),
    IncidentType.MEDICAL: (ResourceType.VEHICLE, ResourceType.FACILITY),
    IncidentType.OTHER: (ResourceType.TEAM,),
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def recommend_resources(
    incident: Incident, available: list[ResourceUnit], limit: int = 5
) -> list[ResourceUnit]:
    """Naive nearest-available matching by resource type relevance and distance.

    Upgrade path: incorporate capacity, ETA via routing (OSM), and multi-resource
    bundling once real availability/location data is fed in.
    """
    relevant_types = _INCIDENT_TYPE_RESOURCES.get(incident.incident_type, tuple(ResourceType))

    candidates = [
        r
        for r in available
        if r.status == ResourceStatus.AVAILABLE and r.resource_type in relevant_types
    ]

    if incident.latitude is None or incident.longitude is None:
        return candidates[:limit]

    def distance(resource: ResourceUnit) -> float:
        if resource.latitude is None or resource.longitude is None:
            return float("inf")
        return _haversine_km(incident.latitude, incident.longitude, resource.latitude, resource.longitude)

    return sorted(candidates, key=distance)[:limit]
