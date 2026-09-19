from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import IncidentType, Severity


class ImageAnalysisRequest(BaseModel):
    image_base64: str = Field(description="Base64 encoded JPEG or PNG image data")
    incident_type_hint: IncidentType | None = Field(
        default=None, description="Optional incident type reported by caller"
    )
    context_description: str | None = Field(
        default=None, description="Optional description from 911 caller or sensor"
    )


class VisualHazardItem(BaseModel):
    hazard_type: str = Field(description="Visual hazard identifier (e.g. active_flames, structural_collapse)")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence of visual hazard detection")
    description: str = Field(description="Details on visual evidence observed")


class ImageAnalysisResponse(BaseModel):
    analysis_id: str = Field(description="Unique identifier for this visual audit")
    timestamp: str = Field(description="ISO timestamp of analysis")
    damage_severity: Severity = Field(description="Assessed damage severity from visual inspection")
    damage_score: float = Field(ge=0.0, le=100.0, description="Quantitative damage severity score (0-100%)")
    authenticity_status: Literal[
        "verified_authentic", "possible_misinformation", "false_alarm", "inconclusive"
    ] = Field(description="Visual authenticity verification status")
    authenticity_confidence: float = Field(ge=0.0, le=1.0, description="Confidence in authenticity rating")
    authenticity_reasoning: str = Field(
        description="Evidence explaining authenticity rating or false alarm check"
    )
    detected_hazards: list[VisualHazardItem] = Field(
        default_factory=list, description="Visual hazards identified in the frame"
    )
    trapped_victims_likely: bool = Field(description="Whether visual cues indicate trapped casualties")
    estimated_casualty_count: int | None = Field(
        default=None, description="Estimated count of visible or trapped victims"
    )
    accessibility_status: Literal["accessible", "partially_blocked", "completely_blocked"] = Field(
        description="Road or approach accessibility assessment"
    )
    recommended_tactical_gear: list[str] = Field(
        default_factory=list,
        description="Recommended PPE, specialized vehicles or tools for first responders",
    )
    tactical_assessment: str = Field(
        description="Summary tactical assessment for dispatchers and field command"
    )
    analysis_provider: str = Field(
        description="Model used for analysis (e.g. Llama-3.2-Vision or Heuristic Engine)"
    )
