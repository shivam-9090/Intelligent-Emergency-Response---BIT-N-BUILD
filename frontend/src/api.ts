import type {
  Alert,
  CascadeRiskResponse,
  ClassifyResult,
  EvacuationRouteResponse,
  FleetOptimizationResponse,
  HospitalRecommendationResponse,
  ImageAnalysisResponse,
  Incident,
  IncidentSummary,
  PredictiveDemandResponse,
  ResourceBundleResponse,
  ResourceUnit,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

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
  try {
    const res = await fetch(`${API_BASE}/analytics/incidents`);
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, number> = {};
    if (data.by_type && Array.isArray(data.by_type)) {
      for (const item of data.by_type) {
        map[item.incident_type] = item.count;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchAnalyticsDelays(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/analytics/response-delays`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.by_type)) return data.by_type;
    return [];
  } catch {
    return [];
  }
}

export async function fetchAnalyticsShortages(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/analytics/resource-shortages`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return [];
  } catch {
    return [];
  }
}

export async function optimizeFleet(): Promise<FleetOptimizationResponse> {
  const res = await fetch(`${API_BASE}/resources/optimize-fleet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to execute global fleet optimization");
  return res.json();
}

export async function analyzeIncidentImage(
  imageBase64: string,
  incidentTypeHint?: string,
  contextDescription?: string
): Promise<ImageAnalysisResponse> {
  const res = await fetch(`${API_BASE}/incidents/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: imageBase64,
      incident_type_hint: incidentTypeHint,
      context_description: contextDescription,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Visual analysis request failed" }));
    throw new Error(err.detail || "Visual analysis request failed");
  }
  return res.json();
}

export async function fetchEvacuationRoute(
  incidentId: string,
  destinationName?: string
): Promise<EvacuationRouteResponse> {
  const query = destinationName ? `?destination_name=${encodeURIComponent(destinationName)}` : "";
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/evacuation-route${query}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to compute evacuation route" }));
    throw new Error(err.detail || "Failed to compute evacuation route");
  }
  return res.json();
}

export async function fetchPredictiveDemandForecast(
  horizonHours: number = 2
): Promise<PredictiveDemandResponse> {
  const res = await fetch(`${API_BASE}/analytics/predictive-demand-forecast?horizon_hours=${horizonHours}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch predictive demand forecast" }));
    throw new Error(err.detail || "Failed to fetch predictive demand forecast");
  }
  return res.json();
}
