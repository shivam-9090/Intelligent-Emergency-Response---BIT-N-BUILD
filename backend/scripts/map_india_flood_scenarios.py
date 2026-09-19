"""Map reviewed India Flood Inventory CSV rows into India-only flood scenarios.

Usage: python scripts/map_india_flood_scenarios.py INPUT.csv OUTPUT.json
The output is for scenario analysis, never Bengaluru dispatch calibration.
"""

import csv
import json
import sys
from pathlib import Path


def number(value: str | None) -> float | None:
    try:
        return float(value) if value and value.strip() else None
    except ValueError:
        return None


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: map_india_flood_scenarios.py INPUT.csv OUTPUT.json")
    source, target = map(Path, sys.argv[1:])
    with source.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    scenarios = []
    for row in rows:
        start = row.get("Start Date", "").strip()
        if not start:
            continue
        scenarios.append(
            {
                "external_id": row.get("UEI"),
                "reported_at": start,
                "ended_at": row.get("End Date") or None,
                "incident_type": "flood",
                "cause": row.get("Main Cause") or None,
                "state": row.get("State") or None,
                "districts": row.get("Districts") or None,
                "latitude": number(row.get("Latitude")),
                "longitude": number(row.get("Longitude")),
                "source_severity": row.get("Severity") or None,
                "fatalities": number(row.get("Human fatality")),
                "injuries": number(row.get("Human injured")),
                "displaced": number(row.get("Human Displaced")),
                "provenance": "India Flood Inventory–Impacts v3 (IIT Delhi); scenario research only",
            }
        )
    target.write_text(
        json.dumps({"dataset_role": "india_flood_scenario_history", "records": scenarios}, indent=2),
        encoding="utf-8",
    )
    geocoded = sum(item["latitude"] is not None and item["longitude"] is not None for item in scenarios)
    print(f"Mapped {len(scenarios)} events; {geocoded} have coordinates. Wrote {target}")


if __name__ == "__main__":
    main()
