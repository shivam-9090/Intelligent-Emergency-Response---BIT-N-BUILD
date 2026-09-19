from datetime import UTC, datetime

from app.ml.classification import classify_incident, classify_raw_text
from app.ml.duplicate_detection import compute_text_similarity, find_duplicate
from app.ml.resource_matching import estimate_eta_minutes, recommend_resource_bundle
from app.models.enums import IncidentType, ResourceStatus, ResourceType, Severity
from app.models.incident import Incident
from app.models.resource import ResourceUnit


def test_classify_incident_critical():
    sev, priority = classify_incident(
        IncidentType.FIRE,
        "Massive explosion at chemical factory! Multiple workers trapped inside.",
    )
    assert sev == Severity.CRITICAL
    assert priority == 1


def test_classify_incident_low():
    sev, priority = classify_incident(
        IncidentType.OTHER,
        "Minor puddle accumulation on residential street curb.",
    )
    assert sev in (Severity.LOW, Severity.MEDIUM)
    assert priority >= 3


def test_classify_raw_text_fire():
    result = classify_raw_text("Emergency! Massive warehouse fire with thick black smoke billowing out!")
    assert result["incident_type"] == IncidentType.FIRE
    assert result["severity"] in (Severity.HIGH, Severity.CRITICAL)
    assert result["priority"] in (1, 2)
    assert result["confidence"] > 0.0


def test_classify_raw_text_medical():
    result = classify_raw_text("Adult male experiencing cardiac arrest and unresponsive at train station.")
    assert result["incident_type"] == IncidentType.MEDICAL
    assert result["severity"] in (Severity.HIGH, Severity.CRITICAL)
    assert result["priority"] in (1, 2)


def test_compute_text_similarity():
    sim_high = compute_text_similarity(
        "Huge fire burning in chemical factory warehouse",
        "Large blaze and smoke at chemical plant warehouse",
    )
    sim_low = compute_text_similarity(
        "Huge fire burning in chemical factory warehouse",
        "Water leaking from minor pipe in residential garden",
    )
    assert sim_high > sim_low
    assert sim_high >= 0.20


def test_find_duplicate_semantic_radius():
    now = datetime.now(UTC)
    base_incident = Incident(
        id=101,
        incident_type=IncidentType.FIRE,
        latitude=12.9716,
        longitude=77.5946,
        description="Massive warehouse fire near metro station with thick toxic smoke",
        reported_at=now,
    )
    # 0.8 km away (beyond 0.5km direct cutoff, within 1.5km extended radius)
    # 0.007 degrees lat is approx 0.77 km
    near_duplicate = Incident(
        id=102,
        incident_type=IncidentType.FIRE,
        latitude=12.9786,
        longitude=77.5946,
        description="Warehouse fire with heavy smoke visible from metro line",
        reported_at=now,
    )
    duplicate = find_duplicate(near_duplicate, [base_incident])
    assert duplicate is not None
    assert duplicate.id == 101


def test_recommend_resource_bundle_critical():
    inc = Incident(
        id=1,
        incident_type=IncidentType.INDUSTRIAL_ACCIDENT,
        severity=Severity.CRITICAL,
        latitude=12.97,
        longitude=77.59,
    )
    available = [
        ResourceUnit(
            id=1,
            name="Hazmat Team 1",
            resource_type=ResourceType.TEAM,
            status=ResourceStatus.AVAILABLE,
            latitude=12.98,
            longitude=77.59,
        ),
        ResourceUnit(
            id=2,
            name="Rescue Team 2",
            resource_type=ResourceType.TEAM,
            status=ResourceStatus.AVAILABLE,
            latitude=12.99,
            longitude=77.59,
        ),
        ResourceUnit(
            id=3,
            name="Fire Engine 1",
            resource_type=ResourceType.VEHICLE,
            status=ResourceStatus.AVAILABLE,
            latitude=12.971,
            longitude=77.591,
        ),
        ResourceUnit(
            id=4,
            name="Fire Engine 2",
            resource_type=ResourceType.VEHICLE,
            status=ResourceStatus.AVAILABLE,
            latitude=12.975,
            longitude=77.595,
        ),
        ResourceUnit(
            id=5,
            name="Decon Unit",
            resource_type=ResourceType.EQUIPMENT,
            status=ResourceStatus.AVAILABLE,
            latitude=12.972,
            longitude=77.592,
        ),
    ]

    bundle = recommend_resource_bundle(inc, available)
    assert len(bundle[ResourceType.TEAM]) == 2
    assert len(bundle[ResourceType.VEHICLE]) == 2
    assert len(bundle[ResourceType.EQUIPMENT]) == 1


def test_estimate_eta_minutes():
    # 10 km direct distance at 40 km/h with 1.3 circuity factor
    eta = estimate_eta_minutes(12.97, 77.59, 13.06, 77.59, avg_speed_kmh=40.0)
    assert eta is not None
    assert 15.0 <= eta <= 30.0
