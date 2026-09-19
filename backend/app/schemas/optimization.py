import uuid

from pydantic import BaseModel, Field

from app.models.enums import IncidentType, ResourceType, Severity


class OptimizedAssignmentItem(BaseModel):
    incident_id: uuid.UUID
    incident_title: str
    incident_type: IncidentType
    severity: Severity
    priority: int
    unit_id: uuid.UUID
    unit_name: str
    resource_type: ResourceType
    capability: str | None = None
    eta_minutes: float
    urgency_cost_score: float


class SectorBottleneck(BaseModel):
    incident_id: uuid.UUID
    incident_title: str
    incident_type: IncidentType
    severity: Severity
    missing_capability: str
    recommendation: str


class OptimizationMetrics(BaseModel):
    total_optimized_eta_minutes: float
    total_greedy_eta_minutes: float
    time_saved_minutes: float
    efficiency_gain_pct: float
    incidents_assigned: int
    unassigned_bottlenecks: int


class FleetOptimizationResponse(BaseModel):
    plan_id: str = Field(description="Unique session identifier for this optimization plan")
    timestamp: str
    algorithm: str = "Hungarian Bipartite Minimum-Cost Matching (scipy.optimize.linear_sum_assignment)"
    metrics: OptimizationMetrics
    assignments: list[OptimizedAssignmentItem]
    bottlenecks: list[SectorBottleneck]
