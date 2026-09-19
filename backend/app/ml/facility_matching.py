"""Specialized Hospital & Emergency Facility Recommender.

Matches emergency casualties and disaster types to the nearest capable medical
facility with verified available ICU beds, Burn units, or Trauma Centers.
"""

import json
from pathlib import Path
from typing import Any

from app.ml.resource_matching import estimate_eta_minutes, haversine_km
from app.models.enums import IncidentType, Severity

BASE_DIR = Path(__file__).resolve().parent
CANDIDATE_PATHS = [
    BASE_DIR / "data" / "facilities" / "hospitals.json",
    BASE_DIR.parent / "data" / "facilities" / "hospitals.json",
    BASE_DIR.parents[2] / "data" / "facilities" / "hospitals.json",
]


def _load_hospitals() -> list[dict[str, Any]]:
    for path in CANDIDATE_PATHS:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    return []


# Desired hospital capability requirements by incident profile
_CAPABILITY_MAP: dict[IncidentType, tuple[str, ...]] = {
    IncidentType.FIRE: ("burn_icu", "trauma_level_1", "general_icu"),
    IncidentType.INDUSTRIAL_ACCIDENT: ("mass_casualty_decontamination", "burn_icu", "trauma_level_1"),
    IncidentType.ROAD_ACCIDENT: ("trauma_level_1", "neuro_trauma", "general_icu"),
    IncidentType.MEDICAL: ("cardiac_cath_lab", "trauma_level_1", "general_icu"),
    IncidentType.FLOOD: ("general_icu", "trauma_level_1"),
    IncidentType.OTHER: ("general_icu",),
}


def recommend_hospitals(
    incident_type: IncidentType,
    severity: Severity,
    inc_lat: float | None,
    inc_lon: float | None,
    limit: int = 3,
) -> list[dict[str, Any]]:
    """Recommend optimal medical facilities based on specialized capabilities,

    live bed availability, and urban road network ETA.
    """
    hospitals = _load_hospitals()
    if not hospitals:
        return []

    required_caps = _CAPABILITY_MAP.get(incident_type, ("general_icu",))

    scored_facilities = []

    for hosp in hospitals:
        avail_beds = hosp.get("available_icu_beds", 0)
        # Prioritize facilities that actually have available beds
        if avail_beds <= 0:
            continue

        h_lat = hosp.get("latitude")
        h_lon = hosp.get("longitude")

        direct_km = (
            haversine_km(inc_lat, inc_lon, h_lat, h_lon)
            if inc_lat is not None and inc_lon is not None and h_lat is not None and h_lon is not None
            else 999.0
        )
        eta = estimate_eta_minutes(inc_lat, inc_lon, h_lat, h_lon)

        # Match capabilities
        hosp_caps = set(hosp.get("capabilities", []))
        matched_caps = [c for c in required_caps if c in hosp_caps]

        # Scoring: capability matches bonus - distance penalty
        match_score = len(matched_caps) * 20.0 - (direct_km * 1.5)

        scored_facilities.append({
            "id": hosp["id"],
            "name": hosp["name"],
            "address": hosp["address"],
            "latitude": h_lat,
            "longitude": h_lon,
            "available_icu_beds": avail_beds,
            "burn_unit_available": hosp.get("burn_unit_available", False),
            "heliport": hosp.get("heliport", False),
            "matched_capabilities": matched_caps,
            "distance_km": round(direct_km, 2),
            "eta_minutes": eta,
            "score": match_score,
        })

    # Sort by composite score (highest first)
    scored_facilities.sort(key=lambda x: x["score"], reverse=True)
    return scored_facilities[:limit]
