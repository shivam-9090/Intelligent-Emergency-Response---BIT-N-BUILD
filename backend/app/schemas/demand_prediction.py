from datetime import datetime
from pydantic import BaseModel, Field


class DemandHeatmapPoint(BaseModel):
    latitude: float = Field(description="Latitude of grid centroid")
    longitude: float = Field(description="Longitude of grid centroid")
    intensity: float = Field(
        ge=0.0,
        le=1.0,
        description="Normalized emergency risk intensity (0.0 to 1.0)",
    )
    risk_level: str = Field(description="Qualitative risk tier: low, medium, high, or critical")
    predicted_incident_type: str = Field(
        description="Dominant predicted incident category (fire, medical, road_accident, flood)"
    )
    historical_event_count: int = Field(
        description="Count of active and historical incidents contributing to this zone"
    )


class PreDeploymentStagingPoint(BaseModel):
    staging_id: str = Field(description="Unique identifier for the tactical staging point")
    zone_name: str = Field(description="Recognizable municipal sector or neighborhood name")
    latitude: float = Field(description="Latitude for standby staging coordinate")
    longitude: float = Field(description="Longitude for standby staging coordinate")
    target_incident_type: str = Field(
        description="Primary emergency type anticipated in this zone (e.g. fire, medical, road_accident)"
    )
    recommended_unit_type: str = Field(
        description="Recommended vehicle/team class to pre-deploy (e.g. ambulance, fire_engine, rescue_team)"
    )
    predicted_demand_intensity: float = Field(
        ge=0.0,
        le=1.0,
        description="Relative demand probability score in this cluster",
    )
    projected_eta_savings_minutes: float = Field(
        description="Expected response time reduction from pre-positioning vs station departure"
    )
    tactical_rationale: str = Field(
        description="Operational justification for patrol dispatchers and field coordinators"
    )


class PredictiveDemandResponse(BaseModel):
    forecast_horizon_hours: int = Field(
        description="Forward-looking time window for prediction in hours"
    )
    generated_at: datetime = Field(description="Timestamp of forecast generation")
    city_wide_risk_index: float = Field(
        ge=0.0,
        le=100.0,
        description="Aggregate city-wide emergency readiness pressure index (0 to 100)",
    )
    active_incidents_considered: int = Field(
        description="Number of incidents ingested into the spatial-temporal kernel"
    )
    heatmap_grid: list[DemandHeatmapPoint] = Field(
        default_factory=list,
        description="Spatial grid coordinates and normalized densities across metropolitan area",
    )
    staging_recommendations: list[PreDeploymentStagingPoint] = Field(
        default_factory=list,
        description="Prioritized tactical patrol pre-deployment coordinates",
    )
    total_projected_eta_savings_minutes: float = Field(
        description="Cumulative minutes shaved off first-arrival response across all staging zones"
    )
    algorithm: str = Field(
        default="Spatio-Temporal Kernel Density Estimation (KDE) + Diurnal Poisson Surge Modeling",
        description="Predictive model architecture",
    )

