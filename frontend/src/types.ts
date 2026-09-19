export type IncidentType =
  | "fire"
  | "flood"
  | "industrial_accident"
  | "road_accident"
  | "medical"
  | "other";

export type Severity = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export type ResourceType = "team" | "vehicle" | "equipment" | "facility";

export type ResourceStatus = "available" | "assigned" | "unavailable";

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  source: string;
  incident_type: IncidentType;
  severity: Severity;
  priority: number;
  status: IncidentStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  duplicate_of_id: string | null;
  reported_at: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceUnit {
  id: string;
  name: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  capability: string | null;
  latitude: number | null;
  longitude: number | null;
  assigned_user_id: string | null;
}

export interface ResourceBundleItem {
  unit: ResourceUnit;
  eta_minutes: number | null;
}

export interface ResourceBundleResponse {
  incident_id: string;
  bundle: Record<string, ResourceBundleItem[]>;
}

export interface Alert {
  id: string;
  incident_id: string;
  alert_type: "critical_incident" | "delayed_response" | "escalation";
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface ClassifyResult {
  incident_type: IncidentType;
  severity: Severity;
  priority: number;
  confidence: number;
  method: string;
}

export interface IncidentSummary {
  incident_id: string;
  summary: string;
  ai_generated: boolean;
}

export interface HospitalFacility {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  available_icu_beds: number;
  burn_unit_available: boolean;
  heliport: boolean;
  matched_capabilities: string[];
  distance_km: number;
  eta_minutes: number;
  score: number;
}

export interface HospitalRecommendationResponse {
  incident_id: string;
  facilities: HospitalFacility[];
}

export interface WeatherTelemetry {
  wind_speed_kmh: number;
  wind_direction_deg: number;
  temperature_c: number;
  humidity_pct: number;
}

export interface SecondaryHazardPrediction {
  hazard_type: string;
  probability: number;
  estimated_onset_minutes: number;
  severity_impact: string;
  recommended_action: string;
}

export interface VulnerableInfrastructure {
  id: string;
  name: string;
  category: string;
  distance_km: number;
  inside_plume: boolean;
  occupancy_estimate: number;
}

export interface PlumeCorridor {
  hazard_radius_meters: number;
  downwind_length_meters: number;
  wind_direction_deg: number;
  polygon_coordinates: [number, number][];
}

export interface CascadeRiskResponse {
  incident_id: string;
  cascade_risk_score: number;
  escalation_level: "low" | "medium" | "high" | "critical";
  weather: WeatherTelemetry;
  secondary_hazards: SecondaryHazardPrediction[];
  evacuation_corridor: PlumeCorridor;
  vulnerable_infrastructure: VulnerableInfrastructure[];
  tactical_evacuation_advice: string;
}

