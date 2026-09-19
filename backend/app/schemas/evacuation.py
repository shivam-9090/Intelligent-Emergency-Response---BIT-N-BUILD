import uuid

from pydantic import BaseModel, Field


class RouteWaypoint(BaseModel):
    step_index: int = Field(description="Sequence index of the waypoint in the evacuation path")
    latitude: float = Field(description="Latitude of waypoint")
    longitude: float = Field(description="Longitude of waypoint")
    description: str = Field(
        description="Tactical navigation instruction (e.g. Initial departure, Upwind detour)"
    )
    inside_hazard: bool = Field(
        description="Whether this waypoint falls inside the active toxic plume polygon"
    )


class RoutePath(BaseModel):
    waypoints: list[RouteWaypoint] = Field(default_factory=list, description="Waypoints defining this path")
    total_distance_km: float = Field(description="Total path distance in kilometers")
    eta_minutes: float = Field(description="Estimated travel transit time in minutes")
    hazard_exposure_meters: float = Field(
        description="Linear meters of route penetrating the active hazard or toxic plume"
    )
    is_safe: bool = Field(description="True if route avoids 100% of the active hazard polygon")


class EvacuationRouteResponse(BaseModel):
    incident_id: uuid.UUID
    incident_title: str
    target_destination_name: str
    target_destination_category: str
    target_destination_coords: list[float] = Field(
        description="[lat, lon] coordinates of destination shelter or hospital"
    )
    naive_direct_route: RoutePath = Field(
        description="Direct shortest route inadvertently penetrating the active hazard plume"
    )
    safe_evacuation_corridor: RoutePath = Field(
        description="Dynamic detour route bypassing the active hazard polygon"
    )
    safety_delta_meters_avoided: float = Field(
        description="Hazardous plume exposure meters eliminated by following the safe corridor"
    )
    tactical_advice: str = Field(
        description="Tactical recommendation for first responders and evacuation convoys"
    )
    routing_algorithm: str = Field(
        default="Hazard-Aware Tangent Corridor Router (Geometric Plume Avoidance)",
        description="Algorithm used to compute safe detour",
    )
