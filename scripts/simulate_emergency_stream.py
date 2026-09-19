"""Live Emergency Response Platform Simulation Script.

Demonstrates the intelligent emergency pipeline step-by-step:
1. Real-time ML text classification (raw citizen report to structured emergency)
2. Incident creation & automated severity/priority assignment
3. Spatio-temporal & semantic duplicate detection
4. Multi-resource response bundling with road travel ETAs
5. AI situational summary generation (Llama-3.2 / fallback)
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")


def print_banner(text: str):
    print("\n" + "=" * 65)
    print(f"  {text}")
    print("=" * 65)


def http_post(endpoint: str, data: dict | None = None) -> dict:
    url = f"{BACKEND_URL}{endpoint}"
    payload = json.dumps(data if data is not None else {}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def http_get(endpoint: str) -> dict | list:
    url = f"{BACKEND_URL}{endpoint}"
    req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as response:
        return json.loads(response.read().decode("utf-8"))


def check_health():
    try:
        res = http_get("/health")
        if res.get("status") == "ok":
            print(" [Backend Connected] FastAPI is healthy at", BACKEND_URL)
            return True
    except Exception as exc:
        print("❌ [Connection Error] Could not reach backend at", BACKEND_URL, f"({exc})")
        return False
    return False


def run_demo():
    print_banner("INTELLIGENT EMERGENCY RESPONSE & RESOURCE COORDINATION")

    if not check_health():
        sys.exit(1)

    time.sleep(1)

    # -------------------------------------------------------------
    # Step 1: Real-time ML Raw Text Analysis
    # -------------------------------------------------------------
    print_banner("STEP 1: Incoming Unstructured 911 Call Log -> ML Classification")
    raw_call = "Massive explosion at chemical factory! Multiple workers trapped inside and flames spreading to adjacent units."
    print(f'📞 Raw Caller Audio Transcript: "{raw_call}"\n')

    classify_res = http_post("/incidents/classify-text", {"description": raw_call})
    print(f"🤖 [AI/ML Pipeline Output]:")
    print(f"   - Predicted Incident Type: {classify_res['incident_type'].upper()}")
    print(f"   - Severity:                {classify_res['severity'].upper()}")
    print(f"   - Priority Level:          {classify_res['priority']} (1 = Immediate Life Threat)")
    print(f"   - Model Confidence:        {classify_res['confidence'] * 100:.1f}%")
    print(f"   - Decision Method:         {classify_res['method']}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 2: Ingest First Incident
    # -------------------------------------------------------------
    print_banner("STEP 2: Ingesting First Emergency Incident into Platform")
    inc_payload = {
        "title": "Explosion & Chemical Fire at Industrial Park",
        "description": raw_call,
        "source": "citizen_report",
        "incident_type": classify_res["incident_type"],
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "Gate 4, Whitefield Industrial Zone, Bangalore",
    }
    first_incident = http_post("/incidents", inc_payload)
    inc_id = first_incident["id"]
    print(f" Incident Created: ID {inc_id}")
    print(f"   Status: {first_incident['status']} | Severity: {first_incident['severity']} | Priority: {first_incident['priority']}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 3: Duplicate Report Arrives (Semantic Deduplication)
    # -------------------------------------------------------------
    print_banner("STEP 3: Second Call Arrives (Multi-caller Semantic Deduplication)")
    dup_call = "Explosion at the chemical factory, heavy black smoke and flames spreading quickly!"
    print(f'📞 Second Caller Transcript: "{dup_call}"')
    print("📍 Location: 0.8 km away (12.9780, 77.5946)\n")

    dup_payload = {
        "title": "Smoke and blast reported in factory district",
        "description": dup_call,
        "source": "emergency_call",
        "incident_type": classify_res["incident_type"],
        "latitude": 12.9780,
        "longitude": 77.5946,
        "address": "Ring Road near Whitefield Industrial Zone",
    }
    second_incident = http_post("/incidents", dup_payload)
    dup_of = second_incident.get("duplicate_of_id")
    print("🔍 [Semantic Deduplication Engine]:")
    print(f"   - Incoming Report ID:   {second_incident['id']}")
    print(f"   - Duplicate Consolidated? {'YES ' if dup_of is not None else 'NO ❌'}")
    print(f"   - Merged into Incident:  {dup_of}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 4: Multi-Resource Response Bundling with ETAs
    # -------------------------------------------------------------
    print_banner("STEP 4: Intelligent Multi-Resource Dispatch Recommendation")
    print(f"🎯 Calculating optimal response package for {first_incident['severity'].upper()} incident...\n")

    bundle_res = http_post(f"/incidents/{inc_id}/bundle", {}) if False else http_get(f"/incidents/{inc_id}/bundle")
    bundle = bundle_res.get("bundle", {})

    for r_type, items in bundle.items():
        print(f"   [{r_type.upper()} UNITS] ({len(items)} allocated):")
        if not items:
            print("     (No available units currently in sector)")
        for it in items:
            unit = it["unit"]
            eta = it.get("eta_minutes")
            eta_str = f"{eta:.1f} min" if eta is not None else "Unknown"
            print(f"      Unit: {unit['name']} | Status: {unit['status']} | Estimated Arrival: {eta_str}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 5: Generative AI Situational Summary
    # -------------------------------------------------------------
    print_banner("STEP 5: Generative AI Situational Awareness Brief")
    print(" Requesting operational summary from NVIDIA Llama-3.2...")
    try:
        summary_res = http_get(f"/incidents/{inc_id}/summary")
        print(f"   AI Generated: {summary_res.get('ai_generated')}")
        print(f"\n   \"{summary_res.get('summary')}\"\n")
    except Exception as exc:
        print(f"   Summary note: {exc}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 6: Specialized Hospital & Trauma Center Routing
    # -------------------------------------------------------------
    print_banner("STEP 6: Specialized Hospital Routing & Live ICU Bed Allocation")
    print(f"🏥 Matching nearest specialized medical facilities for {first_incident['incident_type'].upper()} casualties...\n")
    try:
        hosp_res = http_get(f"/incidents/{inc_id}/hospitals")
        facilities = hosp_res.get("facilities", [])
        for hosp in facilities:
            caps = ", ".join(hosp.get("matched_capabilities", []))
            burn_tag = " [BURN ICU]" if hosp.get("burn_unit_available") else ""
            helipad_tag = " [HELIPORT]" if hosp.get("heliport") else ""
            print(f"   🏥 Facility: {hosp['name']}{burn_tag}{helipad_tag}")
            print(f"      Address:     {hosp['address']} ({hosp['distance_km']} km away)")
            print(f"      ICU Beds:    {hosp['available_icu_beds']} verified available")
            print(f"      Matched:     {caps}")
            print(f"      Transit ETA: {hosp['eta_minutes']:.1f} minutes\n")
    except Exception as exc:
        print(f"   Hospital routing note: {exc}")

    time.sleep(1.5)

    # -------------------------------------------------------------
    # Step 7: Predictive Incident Cascade & Secondary Hazard Forecaster
    # -------------------------------------------------------------
    print_banner("STEP 7: Predictive Cascade Forecaster & Atmospheric Plume Modeling")
    print("🔮 Forecasting multi-hazard escalation timelines and atmospheric plume dispersion...\n")
    try:
        cascade_res = http_get(f"/incidents/{inc_id}/cascade-risk?wind_speed_kmh=20.0&wind_direction_deg=45.0")
        print(f"   Escalation Level:   {cascade_res['escalation_level'].upper()}")
        print(f"   Cascade Risk Score: {cascade_res['cascade_risk_score']}%")
        weather = cascade_res["weather"]
        print(f"   Weather Telemetry:  Wind {weather['wind_speed_kmh']} km/h blowing {weather['wind_direction_deg']}° (NE) | Temp {weather['temperature_c']}°C")
        
        print("\n   [PREDICTED SECONDARY HAZARDS]:")
        for haz in cascade_res.get("secondary_hazards", []):
            print(f"      • {haz['hazard_type']} ({(haz['probability'] * 100):.0f}% prob, onset ~{haz['estimated_onset_minutes']}m)")
            print(f"        Action: {haz['recommended_action']}")

        infra = cascade_res.get("vulnerable_infrastructure", [])
        if infra:
            print("\n   [CIVIC INFRASTRUCTURE IN IMPACT ZONE]:")
            for inf in infra:
                print(f"      🏛️ {inf['name']} ({inf['distance_km']} km away, ~{inf['occupancy_estimate']} occupants)")

        corridor = cascade_res.get("evacuation_corridor", {})
        print(f"\n   [ATMOSPHERIC DISPERSION PLUME POLYGON]:")
        print(f"      Downwind Vector Length: {corridor.get('downwind_length_meters'):.0f} meters")
        print(f"      Polygon Vertices Generated: {len(corridor.get('polygon_coordinates', []))} GPS points for Leaflet map")
        print(f"\n   Tactical Evacuation Advice: \"{cascade_res.get('tactical_evacuation_advice')}\"\n")
    except Exception as exc:
        print(f"   Cascade forecaster note: {exc}")

    # -------------------------------------------------------------
    # STEP 8: Global Fleet Optimization Engine (Hungarian Algorithm)
    # -------------------------------------------------------------
    print_banner("STEP 8: Global Fleet Optimization Engine (Hungarian Bipartite Matching)")
    print("Executing Scipy linear_sum_assignment urgency-weighted dispatch optimization...")
    try:
        opt_res = http_post("/resources/optimize-fleet?commit=false")
        metrics = opt_res.get("metrics", {})
        print(f"   ⚡ Hungarian Global Optimization Completed ({opt_res.get('algorithm')})")
        print(f"   📊 Dispatched Incidents:       {metrics.get('incidents_assigned')}")
        print(f"   ⏱️ Optimized Total Travel:     {metrics.get('total_optimized_eta_minutes', 0):.1f} mins")
        print(f"   ⏱️ Naive Greedy Total Travel:  {metrics.get('total_greedy_eta_minutes', 0):.1f} mins")
        print(f"   🚀 Efficiency Gain:            +{metrics.get('efficiency_gain_pct', 0):.1f}% faster city-wide response")
        print(f"   💡 Net Time Saved:             {metrics.get('time_saved_minutes', 0):.1f} minutes")

        assignments = opt_res.get("assignments", [])
        if assignments:
            print("\n   [OPTIMAL BIPARTITE DISPATCH MATCHES]:")
            for a in assignments:
                cap_str = f"capability: {a.get('capability')}" if a.get("capability") else "standard"
                print(
                    f"      • {a.get('unit_name')} ({a.get('resource_type')}) ➔ "
                    f"\"{a.get('incident_title')}\" [{a.get('severity')}] | "
                    f"ETA: {a.get('eta_minutes')}m | {cap_str}"
                )

        bottlenecks = opt_res.get("bottlenecks", [])
        if bottlenecks:
            print("\n   [SECTOR BOTTLENECKS & CAPABILITY DEFICITS]:")
            for b in bottlenecks:
                print(
                    f"      🚨 Incident: \"{b.get('incident_title')}\" [{b.get('severity')}]"
                )
                print(f"         Missing: {b.get('missing_capability')} | Recommendation: {b.get('recommendation')}")
        print()
    except Exception as exc:
        print(f"   Fleet optimization note: {exc}")

    print_banner("DEMO COMPLETED SUCCESSFULLY")


if __name__ == "__main__":
    run_demo()
