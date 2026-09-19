import uuid

from pydantic import BaseModel, Field


class WeatherTelemetry(BaseModel):
    wind_speed_kmh: float = Field(default=15.0, description="Wind speed in km/h")
    wind_direction_deg: float = Field(
        default=45.0,
        description="Compass bearing in degrees wind blows towards (0=N, 90=E, 180=S, 270=W)",
    )
    temperature_c: float = Field(default=28.0, description="Ambient air temperature in Celsius")
    humidity_pct: float = Field(default=65.0, description="Relative atmospheric humidity percentage")


class SecondaryHazardPrediction(BaseModel):
    hazard_type: str
    probability: float
    estimated_onset_minutes: int
    severity_impact: str
    recommended_action: str


class VulnerableInfrastructure(BaseModel):
    id: str
    name: str
    category: str
    distance_km: float
    inside_plume: bool
    occupancy_estimate: int


class PlumeCorridor(BaseModel):
    hazard_radius_meters: float
    downwind_length_meters: float
    wind_direction_deg: float
    polygon_coordinates: list[list[float]] = Field(
        default_factory=list, description="List of [latitude, longitude] vertices defining hazard polygon"
    )


class CascadeRiskResponse(BaseModel):
    incident_id: uuid.UUID
    cascade_risk_score: float = Field(description="Composite risk score from 0.0 to 100.0")
    escalation_level: str
    weather: WeatherTelemetry
    secondary_hazards: list[SecondaryHazardPrediction]
    evacuation_corridor: PlumeCorridor
    vulnerable_infrastructure: list[VulnerableInfrastructure]
    tactical_evacuation_advice: str
