import type {
  Alert,
  CascadeRiskResponse,
  ClassifyResult,
  FleetOptimizationResponse,
  HospitalRecommendationResponse,
  Incident,
  IncidentSummary,
  ResourceBundleResponse,
  ResourceUnit,
} from "./types";

const API_BASE = "http://localhost:8001";

export async function fetchIncidents(): Promise<Incident[]> {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchResources(): Promise<ResourceUnit[]> {
  const res = await fetch(`${API_BASE}/resources`);
  if (!res.ok) throw new Error("Failed to fetch resources");
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function createIncident(data: {
  title: string;
  description: string;
  source: string;
  incident_type: string;
  latitude: number;
  longitude: number;
  address?: string;
}): Promise<Incident> {
  const res = await fetch(`${API_BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create incident");
  return res.json();
}

export async function classifyText(description: string): Promise<ClassifyResult> {
  const res = await fetch(`${API_BASE}/incidents/classify-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error("Failed to classify text");
  return res.json();
}

export async function fetchResourceBundle(
  incidentId: string
): Promise<ResourceBundleResponse> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/bundle`);
  if (!res.ok) throw new Error("Failed to fetch resource bundle");
  return res.json();
}

export async function fetchSummary(incidentId: string): Promise<IncidentSummary> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchHospitalRecommendations(
  incidentId: string
): Promise<HospitalRecommendationResponse> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/hospitals`);
  if (!res.ok) throw new Error("Failed to fetch hospital recommendations");
  return res.json();
}

export async function fetchCascadeRisk(
  incidentId: string,
  windSpeed = 18.0,
  windDirection = 45.0
): Promise<CascadeRiskResponse> {
  const res = await fetch(
    `${API_BASE}/incidents/${incidentId}/cascade-risk?wind_speed_kmh=${windSpeed}&wind_direction_deg=${windDirection}`
  );
  if (!res.ok) throw new Error("Failed to fetch cascade risk forecast");
  return res.json();
}

export async function fetchAnalyticsBreakdown(): Promise<Record<string, number>> {
  const res = await fetch(`${API_BASE}/analytics/incident-breakdown`);
  if (!res.ok) return {};
  return res.json();
}

export async function fetchAnalyticsDelays(): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/response-delays`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchAnalyticsShortages(): Promise<any> {
  const res = await fetch(`${API_BASE}/analytics/resource-shortages`);
  if (!res.ok) return [];
  return res.json();
}

export async function optimizeFleet(): Promise<FleetOptimizationResponse> {
  const res = await fetch(`${API_BASE}/resources/optimize-fleet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to execute global fleet optimization");
  return res.json();
}
