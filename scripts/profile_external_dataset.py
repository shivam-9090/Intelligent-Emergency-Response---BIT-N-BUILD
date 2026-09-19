"""Create a reproducible quality report for reviewed external history.

Usage: python scripts/profile_external_dataset.py INPUT --source NAME --date-field FIELD
"""

import argparse
import csv
import hashlib
import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path


def load_rows(path: Path) -> list[dict[str, object]]:
    if path.suffix.lower() == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("records", payload) if isinstance(payload, dict) else payload


def present(value: object) -> bool:
    return value not in (None, "", "null", "None")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--source", required=True)
    parser.add_argument("--date-field", required=True)
    parser.add_argument("--id-field", default="")
    parser.add_argument("--lat-field", default="")
    parser.add_argument("--lon-field", default="")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    raw = args.input.read_bytes()
    rows = load_rows(args.input)
    fields = sorted({key for row in rows for key in row})
    missingness = {field: round(1 - sum(present(row.get(field)) for row in rows) / len(rows), 4) for field in fields} if rows else {}
    values = [str(row.get(args.date_field)) for row in rows if present(row.get(args.date_field))]
    ids = [str(row.get(args.id_field)) for row in rows if args.id_field and present(row.get(args.id_field))]
    geocoded = sum(present(row.get(args.lat_field)) and present(row.get(args.lon_field)) for row in rows) if args.lat_field and args.lon_field else 0
    report = {
        "source": args.source,
        "generated_at": datetime.now(UTC).isoformat(),
        "file": args.input.name,
        "sha256": hashlib.sha256(raw).hexdigest(),
        "records": len(rows),
        "fields": fields,
        "date_field": args.date_field,
        "date_range_raw": {"min": min(values) if values else None, "max": max(values) if values else None},
        "missingness": missingness,
        "duplicate_ids": len(ids) - len(set(ids)),
        "geocoded_records": geocoded,
        "geocoded_fraction": round(geocoded / len(rows), 4) if rows else 0,
        "ready_for_chronological_split": len(values) >= 20,
    }
    output = args.output or args.input.with_suffix(".quality.json")
    output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({key: report[key] for key in ("source", "records", "date_range_raw", "duplicate_ids", "geocoded_fraction", "ready_for_chronological_split")}, indent=2))
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
