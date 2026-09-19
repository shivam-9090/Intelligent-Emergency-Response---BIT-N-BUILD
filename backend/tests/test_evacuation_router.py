import uuid

from starlette.testclient import TestClient

from app.ml.evacuation_router import (
    calculate_evacuation_routes,
    compute_segment_exposure_meters,
    point_in_polygon,
)

# Test hazard plume triangle polygon in Bangalore
TEST_PLUME_POLYGON = [
    [12.9716, 77.5946],
    [12.9780, 77.6020],
    [12.9800, 77.5900],
]


def test_point_in_polygon():
    # Centroid should be inside
    center_lat = (12.9716 + 12.9780 + 12.9800) / 3.0
    center_lon = (77.5946 + 77.6020 + 77.5900) / 3.0
    assert point_in_polygon(center_lat, center_lon, TEST_PLUME_POLYGON) is True

    # Far away point should be outside
    assert point_in_polygon(13.1000, 77.7000, TEST_PLUME_POLYGON) is False


def test_compute_segment_exposure():
    # Segment cutting straight across the polygon
    p1 = (12.9700, 77.5946)
    p2 = (12.9820, 77.5960)
    exposure = compute_segment_exposure_meters(p1, p2, TEST_PLUME_POLYGON)
    assert exposure > 100.0  # Penetrates substantial linear meters


def test_calculate_evacuation_routes():
    inc_id = uuid.uuid4()
    origin_lat, origin_lon = 12.9716, 77.5946
    dest_lat, dest_lon = 12.9900, 77.6100

    res = calculate_evacuation_routes(
        incident_id=inc_id,
        incident_title="Chemical Warehouse Fire",
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        dest_name="Bowring & Lady Curzon Hospital",
        dest_category="trauma_level_1",
        plume_polygon=TEST_PLUME_POLYGON,
        wind_direction_deg=45.0,
    )

    assert res.incident_id == inc_id
    assert res.safe_evacuation_corridor.is_safe is True
    assert res.safe_evacuation_corridor.hazard_exposure_meters == 0.0
    assert res.safety_delta_meters_avoided >= 0.0
    assert len(res.safe_evacuation_corridor.waypoints) >= 4
    assert len(res.naive_direct_route.waypoints) >= 4


def test_evacuation_route_endpoint(client: TestClient):
    # 1. Create incident
    create_res = client.post(
        "/incidents",
        json={
            "title": "Chlorine Tanker Leak at Ring Road Junction",
            "description": "Dense yellow-green gas cloud spreading downwind towards residential sector.",
            "source": "citizen_report",
            "incident_type": "industrial_accident",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
    )
    assert create_res.status_code == 201
    inc_id = create_res.json()["id"]

    # 2. Query evacuation route
    res = client.get(f"/incidents/{inc_id}/evacuation-route?wind_speed_kmh=22.0&wind_direction_deg=45.0")
    assert res.status_code == 200
    data = res.json()
    assert data["incident_id"] == inc_id
    assert "safe_evacuation_corridor" in data
    assert "naive_direct_route" in data
    assert data["safe_evacuation_corridor"]["is_safe"] is True
    assert data["safe_evacuation_corridor"]["hazard_exposure_meters"] == 0.0
    assert "tactical_advice" in data


def test_evacuation_route_nonexistent_incident(client: TestClient):
    random_id = uuid.uuid4()
    res = client.get(f"/incidents/{random_id}/evacuation-route")
    assert res.status_code == 404
