import math

from app.models.enums import IncidentType, ResourceStatus, ResourceType, Severity
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

# Standard emergency response bundle quotas by severity
_SEVERITY_BUNDLE_SPECS: dict[Severity, dict[ResourceType, int]] = {
    Severity.CRITICAL: {
        ResourceType.TEAM: 2,
        ResourceType.VEHICLE: 2,
        ResourceType.EQUIPMENT: 1,
        ResourceType.FACILITY: 1,
    },
    Severity.HIGH: {
        ResourceType.TEAM: 1,
        ResourceType.VEHICLE: 1,
        ResourceType.EQUIPMENT: 1,
        ResourceType.FACILITY: 0,
    },
    Severity.MEDIUM: {
        ResourceType.TEAM: 1,
        ResourceType.VEHICLE: 1,
        ResourceType.EQUIPMENT: 0,
        ResourceType.FACILITY: 0,
    },
    Severity.LOW: {
        ResourceType.TEAM: 1,
        ResourceType.VEHICLE: 0,
        ResourceType.EQUIPMENT: 0,
        ResourceType.FACILITY: 0,
    },
}

_URBAN_ROUTE_CIRCUITY_FACTOR = 1.3  # Road network distance vs direct Haversine


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def estimate_eta_minutes(
    lat1: float | None,
    lon1: float | None,
    lat2: float | None,
    lon2: float | None,
    avg_speed_kmh: float = 40.0,
) -> float | None:
    """Estimate travel time in minutes incorporating road circuity and urban traffic speed."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    direct_km = haversine_km(lat1, lon1, lat2, lon2)
    road_km = direct_km * _URBAN_ROUTE_CIRCUITY_FACTOR
    hours = road_km / max(avg_speed_kmh, 10.0)
    return round(hours * 60.0, 1)


def recommend_resources(
    incident: Incident, available: list[ResourceUnit], limit: int = 5
) -> list[ResourceUnit]:
    """Nearest-available matching by resource type relevance and distance.

    Maintains full backward compatibility.
    """
    relevant_types = _INCIDENT_TYPE_RESOURCES.get(incident.incident_type, tuple(ResourceType))

    candidates = [
        r for r in available if r.status == ResourceStatus.AVAILABLE and r.resource_type in relevant_types
    ]

    if incident.latitude is None or incident.longitude is None:
        return candidates[:limit]
    incident_lat, incident_lon = incident.latitude, incident.longitude

    def distance(resource: ResourceUnit) -> float:
        if resource.latitude is None or resource.longitude is None:
            return float("inf")
        return haversine_km(incident_lat, incident_lon, resource.latitude, resource.longitude)

    return sorted(candidates, key=distance)[:limit]


def recommend_resource_bundle(
    incident: Incident, available: list[ResourceUnit]
) -> dict[ResourceType, list[ResourceUnit]]:
    """Assemble a multi-unit emergency response package tailored to incident severity and type.

    Returns recommended units grouped by ResourceType, prioritized by arrival proximity.
    """
    spec = _SEVERITY_BUNDLE_SPECS.get(incident.severity, _SEVERITY_BUNDLE_SPECS[Severity.MEDIUM])
    relevant_types = _INCIDENT_TYPE_RESOURCES.get(incident.incident_type, tuple(ResourceType))

    bundle: dict[ResourceType, list[ResourceUnit]] = {rt: [] for rt in ResourceType}

    inc_lat, inc_lon = incident.latitude, incident.longitude

    def sort_key(r: ResourceUnit) -> float:
        if inc_lat is None or inc_lon is None or r.latitude is None or r.longitude is None:
            return 0.0
        return haversine_km(inc_lat, inc_lon, r.latitude, r.longitude)

    for r_type in relevant_types:
        quota = spec.get(r_type, 0)
        if quota <= 0:
            continue

        matching_units = [
            r for r in available if r.status == ResourceStatus.AVAILABLE and r.resource_type == r_type
        ]
        sorted_units = sorted(matching_units, key=sort_key)
        bundle[r_type] = sorted_units[:quota]

    return bundle
