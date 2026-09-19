import math
import uuid
from datetime import UTC, datetime
from typing import TypedDict

from app.models.enums import IncidentType, Severity
from app.schemas.demand_prediction import (
    DemandHeatmapPoint,
    PreDeploymentStagingPoint,
    PredictiveDemandResponse,
)


class CivicSector(TypedDict):
    name: str
    latitude: float
    longitude: float
    primary_hazard: str
    unit: str


# Reference civic sectors in Bengaluru metropolitan area
CIVIC_SECTORS: list[CivicSector] = [
    {
        "name": "Peenya Industrial Sector",
        "latitude": 13.0285,
        "longitude": 77.5197,
        "primary_hazard": "fire",
        "unit": "fire_engine",
    },
    {
        "name": "Majestic Central Transit Hub",
        "latitude": 12.9767,
        "longitude": 77.5713,
        "primary_hazard": "medical",
        "unit": "ambulance",
    },
    {
        "name": "Koramangala Commercial Corridor",
        "latitude": 12.9352,
        "longitude": 77.6245,
        "primary_hazard": "medical",
        "unit": "ambulance",
    },
    {
        "name": "Indiranagar - Old Madras Road",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "primary_hazard": "road_accident",
        "unit": "ambulance",
    },
    {
        "name": "Hebbal Flyover Junction",
        "latitude": 13.0358,
        "longitude": 77.5970,
        "primary_hazard": "road_accident",
        "unit": "highway_patrol",
    },
    {
        "name": "Whitefield IT & Industrial Belt",
        "latitude": 12.9698,
        "longitude": 77.7499,
        "primary_hazard": "fire",
        "unit": "rescue_team",
    },
    {
        "name": "KR Market - Victoria Vicinity",
        "latitude": 12.9634,
        "longitude": 77.5746,
        "primary_hazard": "medical",
        "unit": "ambulance",
    },
]

SEVERITY_WEIGHTS: dict[str, float] = {
    Severity.CRITICAL.value: 3.5,
    Severity.HIGH.value: 2.2,
    Severity.MEDIUM.value: 1.3,
    Severity.LOW.value: 0.8,
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two GPS coordinates in kilometers."""
    radius_earth_km = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return radius_earth_km * c


def get_temporal_diurnal_factor(hour_of_day: int, incident_type: str) -> float:
    """Computes Poisson diurnal surge multiplier based on municipal emergency call cycles."""
    # Peak traffic hours: 08-11 and 17-21
    is_traffic_peak = (8 <= hour_of_day <= 11) or (17 <= hour_of_day <= 21)
    # Night hours: 22-05
    is_night = hour_of_day >= 22 or hour_of_day <= 5

    if incident_type in {IncidentType.ROAD_ACCIDENT.value, "traffic"}:
        return 1.6 if is_traffic_peak else (0.7 if is_night else 1.0)
    if incident_type in {IncidentType.FIRE.value, IncidentType.INDUSTRIAL_ACCIDENT.value}:
        return 1.4 if (12 <= hour_of_day <= 20) else 1.0
    if incident_type == IncidentType.MEDICAL.value:
        return 1.3 if (7 <= hour_of_day <= 22) else 0.9
    return 1.0


def find_nearest_sector_name(lat: float, lon: float) -> str:
    """Identifies the closest named municipal sector for situational awareness."""
    best_dist = float("inf")
    best_name = "Central Sector"
    for sector in CIVIC_SECTORS:
        d = haversine_km(lat, lon, sector["latitude"], sector["longitude"])
        if d < best_dist:
            best_dist = d
            best_name = sector["name"]
    return best_name


class DemandForecastingEngine:
    """Spatio-Temporal Kernel Density Estimation (KDE) Engine with Poisson Pre-Deployment."""

    def __init__(
        self,
        spatial_bandwidth_km: float = 2.5,
        lat_min: float = 12.90,
        lat_max: float = 13.05,
        lon_min: float = 77.50,
        lon_max: float = 77.68,
        grid_step_deg: float = 0.022,  # ~2.4 km per grid cell
    ):
        self.bandwidth_km = spatial_bandwidth_km
        self.lat_min = lat_min
        self.lat_max = lat_max
        self.lon_min = lon_min
        self.lon_max = lon_max
        self.grid_step = grid_step_deg

    def compute_forecast(
        self,
        incidents: list[dict],
        forecast_horizon_hours: int = 2,
    ) -> PredictiveDemandResponse:
        """Generates metropolitan demand heatmap grid and prioritized patrol staging points."""
        now = datetime.now(UTC)
        target_hour = (now.hour + forecast_horizon_hours) % 24

        # If no incidents recorded, initialize synthetic baseline nodes from civic sectors
        event_points: list[dict] = []
        for inc in incidents:
            lat = inc.get("latitude")
            lon = inc.get("longitude")
            if lat is not None and lon is not None:
                event_points.append(
                    {
                        "latitude": float(lat),
                        "longitude": float(lon),
                        "severity": str(inc.get("severity", "medium")),
                        "incident_type": str(inc.get("incident_type", "medical")),
                    }
                )

        if not event_points:
            # Fallback baseline seeding from civic sectors
            for sec in CIVIC_SECTORS:
                event_points.append(
                    {
                        "latitude": sec["latitude"],
                        "longitude": sec["longitude"],
                        "severity": "medium",
                        "incident_type": sec["primary_hazard"],
                    }
                )

        # 1. Generate Regular Spatial Grid
        raw_grid: list[dict] = []
        max_density = 0.0

        lat_steps = int(math.ceil((self.lat_max - self.lat_min) / self.grid_step)) + 1
        lon_steps = int(math.ceil((self.lon_max - self.lon_min) / self.grid_step)) + 1

        for i in range(lat_steps):
            glat = round(self.lat_min + (i * self.grid_step), 4)
            for j in range(lon_steps):
                glon = round(self.lon_min + (j * self.grid_step), 4)

                # Compute KDE sum over all event points
                cell_density = 0.0
                type_weights: dict[str, float] = {}
                contributing_count = 0

                for ev in event_points:
                    dist_km = haversine_km(glat, glon, ev["latitude"], ev["longitude"])
                    # Gaussian Kernel
                    kernel_val = math.exp(-((dist_km**2) / (2.0 * (self.bandwidth_km**2))))
                    sev_w = SEVERITY_WEIGHTS.get(ev["severity"], 1.0)
                    diurnal_w = get_temporal_diurnal_factor(target_hour, ev["incident_type"])

                    weight = kernel_val * sev_w * diurnal_w
                    cell_density += weight

                    if dist_km <= (self.bandwidth_km * 1.5):
                        contributing_count += 1
                        itype = ev["incident_type"]
                        type_weights[itype] = type_weights.get(itype, 0.0) + weight

                if cell_density > max_density:
                    max_density = cell_density

                dominant_type = (
                    max(type_weights.items(), key=lambda item: item[1])[0] if type_weights else "medical"
                )

                raw_grid.append(
                    {
                        "latitude": glat,
                        "longitude": glon,
                        "raw_density": cell_density,
                        "dominant_type": dominant_type,
                        "contributing_count": contributing_count,
                    }
                )

        # 2. Normalize Densities and Classify Risk Tiers
        heatmap_points: list[DemandHeatmapPoint] = []
        normalizer = max_density if max_density > 0.0 else 1.0

        for cell in raw_grid:
            intensity = min(1.0, max(0.0, cell["raw_density"] / normalizer))
            if intensity >= 0.75:
                risk_level = "critical"
            elif intensity >= 0.50:
                risk_level = "high"
            elif intensity >= 0.25:
                risk_level = "medium"
            else:
                risk_level = "low"

            heatmap_points.append(
                DemandHeatmapPoint(
                    latitude=cell["latitude"],
                    longitude=cell["longitude"],
                    intensity=round(intensity, 3),
                    risk_level=risk_level,
                    predicted_incident_type=cell["dominant_type"],
                    historical_event_count=cell["contributing_count"],
                )
            )

        # 3. Extract Top Pre-Deployment Staging Centroids (Non-Maximum Suppression)
        # Sort candidates descending by intensity
        candidates = sorted(
            [hp for hp in heatmap_points if hp.intensity >= 0.30],
            key=lambda x: x.intensity,
            reverse=True,
        )

        staging_points: list[PreDeploymentStagingPoint] = []
        min_staging_separation_km = 3.0
        max_staging_zones = 4

        for cand in candidates:
            if len(staging_points) >= max_staging_zones:
                break

            # Check spatial separation against already selected staging points
            is_separated = True
            for st in staging_points:
                if (
                    haversine_km(cand.latitude, cand.longitude, st.latitude, st.longitude)
                    < min_staging_separation_km
                ):
                    is_separated = False
                    break

            if not is_separated:
                continue

            zone_name = find_nearest_sector_name(cand.latitude, cand.longitude)
            # Map recommended resource unit
            p_type = cand.predicted_incident_type
            if p_type in {IncidentType.FIRE.value, IncidentType.INDUSTRIAL_ACCIDENT.value}:
                recommended_unit = "fire_engine"
            elif p_type == IncidentType.ROAD_ACCIDENT.value:
                recommended_unit = "highway_patrol"
            elif p_type == IncidentType.FLOOD.value:
                recommended_unit = "rescue_team"
            else:
                recommended_unit = "ambulance"

            # Projected response savings:
            # Traditional central station dispatch: ~13.5 mins
            # Staged patrol response: ~4.5 mins
            savings_mins = round(7.0 + (cand.intensity * 4.5), 1)

            staging_id = f"stage-{uuid.uuid4().hex[:6]}"
            rationale = (
                f"Anticipated {cand.risk_level.upper()} demand surge for {p_type.replace('_', ' ')} "
                f"in {zone_name} over next {forecast_horizon_hours}h. Pre-positioning a {recommended_unit} "
                f"shaves ~{savings_mins}m off initial emergency response time."
            )

            staging_points.append(
                PreDeploymentStagingPoint(
                    staging_id=staging_id,
                    zone_name=zone_name,
                    latitude=cand.latitude,
                    longitude=cand.longitude,
                    target_incident_type=p_type,
                    recommended_unit_type=recommended_unit,
                    predicted_demand_intensity=cand.intensity,
                    projected_eta_savings_minutes=savings_mins,
                    tactical_rationale=rationale,
                )
            )

        total_eta_savings = round(sum(st.projected_eta_savings_minutes for st in staging_points), 1)
        city_risk = round(min(100.0, (len(event_points) * 6.5) + (max_density * 4.0)), 1)

        return PredictiveDemandResponse(
            forecast_horizon_hours=forecast_horizon_hours,
            generated_at=now,
            city_wide_risk_index=city_risk,
            active_incidents_considered=len(event_points),
            heatmap_grid=heatmap_points,
            staging_recommendations=staging_points,
            total_projected_eta_savings_minutes=total_eta_savings,
            algorithm="Scenario KDE with heuristic temporal weighting",
            validation_status="Not calibrated against historical dispatch outcomes",
        )


demand_engine = DemandForecastingEngine()
