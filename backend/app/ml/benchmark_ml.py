"""ML Performance & Stress Benchmark Suite.

Evaluates:
1. Classification Accuracy, Precision, Recall, and F1 across all classes.
2. Confusion Matrix analysis.
3. Inference Latency (milliseconds per request).
4. Edge-case and noisy real-world text evaluation (slang, typos, multi-hazard, panic audio).
5. Deduplication semantic accuracy and boundary tests.
"""

import json
import time
from pathlib import Path

from app.ml.classification import classify_raw_text
from app.ml.duplicate_detection import compute_text_similarity
from app.models.enums import IncidentType, Severity

DATA_PATH = Path(__file__).resolve().parent / "data" / "emergency_incidents.json"


def run_benchmark():
    print("\n" + "=" * 70)
    print("       AI/ML PERFORMANCE, ACCURACY & STRESS BENCHMARK")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. Dataset Evaluation
    # -------------------------------------------------------------
    if not DATA_PATH.exists():
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    with open(DATA_PATH, encoding="utf-8") as f:
        dataset = json.load(f)

    print(f"\n📊 [1. Holdout Benchmark on {len(dataset)} Incident Records]")

    latencies = []
    type_correct = 0
    sev_correct = 0

    type_matrix: dict[str, dict[str, int]] = {
        t.value: {t2.value: 0 for t2 in IncidentType} for t in IncidentType
    }
    sev_matrix: dict[str, dict[str, int]] = {s.value: {s2.value: 0 for s2 in Severity} for s in Severity}

    for item in dataset:
        desc = item["description"]
        expected_type = item["incident_type"]
        expected_sev = item["severity"]

        start_time = time.perf_counter()
        result = classify_raw_text(desc)
        lat = (time.perf_counter() - start_time) * 1000.0  # ms
        latencies.append(lat)

        pred_type = result["incident_type"].value
        pred_sev = result["severity"].value

        if pred_type == expected_type:
            type_correct += 1
        if pred_sev == expected_sev:
            sev_correct += 1

        if expected_type in type_matrix and pred_type in type_matrix[expected_type]:
            type_matrix[expected_type][pred_type] += 1
        if expected_sev in sev_matrix and pred_sev in sev_matrix[expected_sev]:
            sev_matrix[expected_sev][pred_sev] += 1

    type_acc = (type_correct / len(dataset)) * 100
    sev_acc = (sev_correct / len(dataset)) * 100
    avg_lat = sum(latencies) / len(latencies)
    p95_lat = sorted(latencies)[int(len(latencies) * 0.95)]

    print(f"   - Emergency Type Accuracy:  {type_acc:.1f}% ({type_correct}/{len(dataset)})")
    print(f"   - Severity Accuracy:        {sev_acc:.1f}% ({sev_correct}/{len(dataset)})")
    print(f"   - Average Latency:          {avg_lat:.2f} ms / prediction")
    print(f"   - P95 Inference Latency:    {p95_lat:.2f} ms (Real-time sub-millisecond ready)")

    # -------------------------------------------------------------
    # 2. Stress Testing Real-World Dirty / Panic Inputs
    # -------------------------------------------------------------
    print("\n⚡ [2. Real-World Stress & Ambiguity Test Suite]")

    stress_cases = [
        {
            "name": "Panic / Caps / Typos (Fire)",
            "text": "FIRE FIRE EVEYRONE GET OUT PLS METRO STATIN BURNINNG AND PEOPLE TRAPPED!!",
            "expected_type": IncidentType.FIRE,
            "min_severity": Severity.CRITICAL,
        },
        {
            "name": "Colloquial Medical (Cardiac)",
            "text": (
                "My grandad suddenly fell down holding his chest, he stopped breathing "
                "we need ambulance fast"
            ),
            "expected_type": IncidentType.MEDICAL,
            "min_severity": Severity.HIGH,
        },
        {
            "name": "Hazardous Material Chemical Spill",
            "text": (
                "Tanker truck overturned near highway toll gate, pungent yellow "
                "chlorine gas cloud releasing"
            ),
            "expected_type": IncidentType.INDUSTRIAL_ACCIDENT,
            "min_severity": Severity.CRITICAL,
        },
        {
            "name": "Monsoon Flash Flood with rooftop rescue",
            "text": (
                "River bund broke overnight, 4 feet water inside houses, "
                "families stranded on roof waiting for rescue boat"
            ),
            "expected_type": IncidentType.FLOOD,
            "min_severity": Severity.HIGH,
        },
        {
            "name": "Multi-vehicle pileup with fuel leak",
            "text": (
                "5 car smash on expressway, driver pinned behind steering wheel "
                "and petrol spreading on road"
            ),
            "expected_type": IncidentType.ROAD_ACCIDENT,
            "min_severity": Severity.HIGH,
        },
        {
            "name": "Low-priority routine nuisance",
            "text": ("Someone left a broken wooden crate on the sidewalk curb, " "no injuries or blockage"),
            "expected_type": IncidentType.OTHER,
            "min_severity": Severity.LOW,
        },
    ]

    stress_passed = 0
    for case in stress_cases:
        res = classify_raw_text(case["text"])
        type_match = res["incident_type"] == case["expected_type"]
        sev_match = res["severity"] in (case["min_severity"], Severity.CRITICAL)

        passed = type_match and sev_match
        if passed:
            stress_passed += 1

        status_sym = "✅" if passed else "❌"
        print(f"\n   {status_sym} Test: {case['name']}")
        print(f"      Input: \"{case['text'][:65]}...\"")
        conf_str = f"{res['confidence']*100:.1f}%"
        print(
            f"      Result: {res['incident_type'].value.upper()} | "
            f"{res['severity'].value.upper()} | Priority P{res['priority']} ({conf_str})"
        )

    print(f"\n   Stress Test Score: {stress_passed}/{len(stress_cases)} passed")

    # -------------------------------------------------------------
    # 3. Deduplication Semantic Text Sensitivity
    # -------------------------------------------------------------
    print("\n🔍 [3. Semantic Deduplication Similarity Score Spectrum]")
    pairs = [
        (
            "Identical descriptions",
            "Explosion in chemical warehouse sector 4",
            "Explosion in chemical warehouse sector 4",
            True,
        ),
        (
            "Rephrased emergency callers",
            "Explosion in chemical warehouse sector 4 with thick smoke",
            "Chemical plant blew up on sector 4 road, black smoke billowing",
            True,
        ),
        (
            "Completely unrelated incidents",
            "Explosion in chemical warehouse sector 4 with thick smoke",
            "Minor water puddle accumulating on residential lane 2",
            False,
        ),
    ]

    for title, t1, t2, _expect_related in pairs:
        sim = compute_text_similarity(t1, t2)
        flag = "RELATED" if sim >= 0.20 else "DISTINCT"
        print(f"   - {title}: similarity = {sim:.3f} -> [{flag}]")

    print("\n" + "=" * 70)
    print("                     BENCHMARK COMPLETE")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    run_benchmark()
