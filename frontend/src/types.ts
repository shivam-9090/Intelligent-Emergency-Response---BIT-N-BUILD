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

export interface OptimizedAssignmentItem {
  incident_id: string;
  incident_title: string;
  incident_type: IncidentType;
  severity: Severity;
  priority: number;
  unit_id: string;
  unit_name: string;
  resource_type: ResourceType;
  capability: string | null;
  eta_minutes: number;
  urgency_cost_score: number;
}

export interface SectorBottleneck {
  incident_id: string;
  incident_title: string;
  incident_type: IncidentType;
  severity: Severity;
  missing_capability: string;
  recommendation: string;
}

export interface OptimizationMetrics {
  total_optimized_eta_minutes: number;
  total_greedy_eta_minutes: number;
  time_saved_minutes: number;
  efficiency_gain_pct: number;
  incidents_assigned: number;
  unassigned_bottlenecks: number;
}

export interface FleetOptimizationResponse {
  plan_id: string;
  timestamp: string;
  algorithm: string;
  metrics: OptimizationMetrics;
  assignments: OptimizedAssignmentItem[];
  bottlenecks: SectorBottleneck[];
}

export interface VisualHazardItem {
  hazard_type: string;
  confidence: number;
  description: string;
}

export interface ImageAnalysisResponse {
  analysis_id: string;
  timestamp: string;
  damage_severity: Severity;
  damage_score: number;
  authenticity_status: "verified_authentic" | "possible_misinformation" | "false_alarm" | "inconclusive";
  authenticity_confidence: number;
  authenticity_reasoning: string;
  detected_hazards: VisualHazardItem[];
  trapped_victims_likely: boolean;
  estimated_casualty_count: number | null;
  accessibility_status: "accessible" | "partially_blocked" | "completely_blocked";
  recommended_tactical_gear: string[];
  tactical_assessment: string;
  analysis_provider: string;
}

export interface RouteWaypoint {
  step_index: number;
  latitude: number;
  longitude: number;
  description: string;
  inside_hazard: boolean;
}

export interface RoutePath {
  waypoints: RouteWaypoint[];
  total_distance_km: number;
  eta_minutes: number;
  hazard_exposure_meters: number;
  is_safe: boolean;
}

export interface EvacuationRouteResponse {
  incident_id: string;
  incident_title: string;
  target_destination_name: string;
  target_destination_category: string;
  target_destination_coords: [number, number];
  naive_direct_route: RoutePath;
  safe_evacuation_corridor: RoutePath;
  safety_delta_meters_avoided: number;
  tactical_advice: string;
  routing_algorithm: string;
}

export interface DemandHeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
  risk_level: "low" | "medium" | "high" | "critical";
  predicted_incident_type: string;
  historical_event_count: number;
}

export interface PreDeploymentStagingPoint {
  staging_id: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  target_incident_type: string;
  recommended_unit_type: string;
  predicted_demand_intensity: number;
  projected_eta_savings_minutes: number;
  tactical_rationale: string;
}

export interface PredictiveDemandResponse {
  forecast_horizon_hours: number;
  generated_at: string;
  city_wide_risk_index: number;
  active_incidents_considered: number;
  heatmap_grid: DemandHeatmapPoint[];
  staging_recommendations: PreDeploymentStagingPoint[];
  total_projected_eta_savings_minutes: number;
  algorithm: string;
}


